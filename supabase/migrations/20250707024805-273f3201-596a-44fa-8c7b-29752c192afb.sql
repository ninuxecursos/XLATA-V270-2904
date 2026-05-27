
-- Criar função para definir configurações como padrão do sistema
CREATE OR REPLACE FUNCTION public.set_default_receipt_format_settings(
  p_format text,
  p_settings jsonb
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o usuário é admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Apenas administradores podem definir configurações padrão';
  END IF;

  -- Inserir ou atualizar configuração padrão (usando user_id especial para padrões do sistema)
  INSERT INTO public.receipt_format_settings (
    user_id,
    format,
    container_width,
    padding,
    margins,
    logo_max_width,
    logo_max_height,
    phone_font_size,
    address_font_size,
    title_font_size,
    customer_font_size,
    table_font_size,
    totals_font_size,
    final_total_font_size,
    datetime_font_size,
    quote_font_size
  ) VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid, -- ID especial para configurações padrão
    p_format,
    (p_settings->>'container_width')::text,
    (p_settings->>'padding')::text,
    (p_settings->>'margins')::text,
    (p_settings->>'logo_max_width')::text,
    (p_settings->>'logo_max_height')::text,
    (p_settings->>'phone_font_size')::text,
    (p_settings->>'address_font_size')::text,
    (p_settings->>'title_font_size')::text,
    (p_settings->>'customer_font_size')::text,
    (p_settings->>'table_font_size')::text,
    (p_settings->>'totals_font_size')::text,
    (p_settings->>'final_total_font_size')::text,
    (p_settings->>'datetime_font_size')::text,
    (p_settings->>'quote_font_size')::text
  )
  ON CONFLICT (user_id, format) DO UPDATE SET
    container_width = EXCLUDED.container_width,
    padding = EXCLUDED.padding,
    margins = EXCLUDED.margins,
    logo_max_width = EXCLUDED.logo_max_width,
    logo_max_height = EXCLUDED.logo_max_height,
    phone_font_size = EXCLUDED.phone_font_size,
    address_font_size = EXCLUDED.address_font_size,
    title_font_size = EXCLUDED.title_font_size,
    customer_font_size = EXCLUDED.customer_font_size,
    table_font_size = EXCLUDED.table_font_size,
    totals_font_size = EXCLUDED.totals_font_size,
    final_total_font_size = EXCLUDED.final_total_font_size,
    datetime_font_size = EXCLUDED.datetime_font_size,
    quote_font_size = EXCLUDED.quote_font_size,
    updated_at = now();

  RETURN true;
END;
$$;

-- Inserir configurações padrão do sistema para 50mm
INSERT INTO public.receipt_format_settings (
  user_id,
  format,
  container_width,
  padding,
  margins,
  logo_max_width,
  logo_max_height,
  phone_font_size,
  address_font_size,
  title_font_size,
  customer_font_size,
  table_font_size,
  totals_font_size,
  final_total_font_size,
  datetime_font_size,
  quote_font_size
) VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid,
  '50mm',
  '45mm',
  '2mm',
  '1mm 0',
  '90%',
  '17mm',
  '14px',
  '12px',
  '13px',
  '12px',
  '10px',
  '12px',
  '16px',
  '12px',
  '11px'
)
ON CONFLICT (user_id, format) DO UPDATE SET
  container_width = EXCLUDED.container_width,
  padding = EXCLUDED.padding,
  margins = EXCLUDED.margins,
  logo_max_width = EXCLUDED.logo_max_width,
  logo_max_height = EXCLUDED.logo_max_height,
  phone_font_size = EXCLUDED.phone_font_size,
  address_font_size = EXCLUDED.address_font_size,
  title_font_size = EXCLUDED.title_font_size,
  customer_font_size = EXCLUDED.customer_font_size,
  table_font_size = EXCLUDED.table_font_size,
  totals_font_size = EXCLUDED.totals_font_size,
  final_total_font_size = EXCLUDED.final_total_font_size,
  datetime_font_size = EXCLUDED.datetime_font_size,
  quote_font_size = EXCLUDED.quote_font_size,
  updated_at = now();

-- Inserir configurações padrão do sistema para 80mm
INSERT INTO public.receipt_format_settings (
  user_id,
  format,
  container_width,
  padding,
  margins,
  logo_max_width,
  logo_max_height,
  phone_font_size,
  address_font_size,
  title_font_size,
  customer_font_size,
  table_font_size,
  totals_font_size,
  final_total_font_size,
  datetime_font_size,
  quote_font_size
) VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid,
  '80mm',
  '66mm',
  '2mm',
  '1mm 0',
  '90%',
  '50mm',
  '22px',
  '13.25px',
  '18px',
  '19.327px',
  '11px',
  '18px',
  '22px',
  '20.124px',
  '14px'
)
ON CONFLICT (user_id, format) DO UPDATE SET
  container_width = EXCLUDED.container_width,
  padding = EXCLUDED.padding,
  margins = EXCLUDED.margins,
  logo_max_width = EXCLUDED.logo_max_width,
  logo_max_height = EXCLUDED.logo_max_height,
  phone_font_size = EXCLUDED.phone_font_size,
  address_font_size = EXCLUDED.address_font_size,
  title_font_size = EXCLUDED.title_font_size,
  customer_font_size = EXCLUDED.customer_font_size,
  table_font_size = EXCLUDED.table_font_size,
  totals_font_size = EXCLUDED.totals_font_size,
  final_total_font_size = EXCLUDED.final_total_font_size,
  datetime_font_size = EXCLUDED.datetime_font_size,
  quote_font_size = EXCLUDED.quote_font_size,
  updated_at = now();
