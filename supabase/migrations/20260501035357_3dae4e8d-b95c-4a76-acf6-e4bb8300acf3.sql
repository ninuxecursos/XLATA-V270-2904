-- Adiciona colunas de automação na configuração de IA
ALTER TABLE public.ai_automation_config 
ADD COLUMN IF NOT EXISTS auto_approve_keywords boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS last_discovery_at timestamptz;

-- Função para mover automaticamente oportunidades de alto score para o banco de temas
CREATE OR REPLACE FUNCTION public.auto_approve_high_potential_keywords()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auto_approve boolean;
  v_category_map jsonb := '{"comercial": "comercial", "informacional": "educacional", "local": "comercial", "problema_dor": "comercial"}'::jsonb;
  v_topic_id uuid;
  v_mapped_category text;
BEGIN
  -- Verifica se a aprovação automática está ligada
  SELECT auto_approve_keywords INTO v_auto_approve FROM public.ai_automation_config LIMIT 1;
  
  -- Só roda se estiver ligado, score alto, e oportunidade nova
  IF COALESCE(v_auto_approve, true) AND NEW.opportunity_score >= 80 AND NEW.status = 'new' THEN
    v_mapped_category := COALESCE(v_category_map->>NEW.category, 'educacional');
    
    -- Verifica se já existe esse tópico no banco para evitar duplicatas
    IF NOT EXISTS (
      SELECT 1 FROM public.seo_topic_bank 
      WHERE lower(topic) = lower(COALESCE(NEW.suggested_title, NEW.keyword))
    ) THEN
      INSERT INTO public.seo_topic_bank (
        topic,
        keywords,
        category,
        priority
      ) VALUES (
        COALESCE(NEW.suggested_title, NEW.keyword),
        array_prepend(NEW.keyword, COALESCE(NEW.variations, '{}')),
        v_mapped_category,
        CASE 
          WHEN NEW.opportunity_score >= 90 THEN 10 
          WHEN NEW.opportunity_score >= 80 THEN 8
          ELSE 5
        END
      ) RETURNING id INTO v_topic_id;
      
      NEW.status := 'added_to_bank';
      NEW.is_added_to_bank := true;
      NEW.added_to_bank_at := now();
      NEW.topic_bank_id := v_topic_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para execução automática ao inserir novas keywords
DROP TRIGGER IF EXISTS trg_auto_approve_keywords ON public.keyword_opportunities;
CREATE TRIGGER trg_auto_approve_keywords
BEFORE INSERT ON public.keyword_opportunities
FOR EACH ROW
EXECUTE FUNCTION public.auto_approve_high_potential_keywords();