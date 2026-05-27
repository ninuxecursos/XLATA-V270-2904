-- Corrigir políticas de leitura pública para serem PERMISSIVE
-- Problema: políticas estavam como RESTRICTIVE, bloqueando acesso anônimo

-- landing_videos
DROP POLICY IF EXISTS "Landing videos are publicly readable" ON landing_videos;
CREATE POLICY "Landing videos are publicly readable" 
  ON landing_videos FOR SELECT 
  USING (true);

-- landing_sections
DROP POLICY IF EXISTS "Landing sections are publicly readable" ON landing_sections;
CREATE POLICY "Landing sections are publicly readable" 
  ON landing_sections FOR SELECT 
  USING (true);

-- landing_requirements
DROP POLICY IF EXISTS "Landing requirements are publicly readable" ON landing_requirements;
CREATE POLICY "Landing requirements are publicly readable" 
  ON landing_requirements FOR SELECT 
  USING (true);

-- landing_problems
DROP POLICY IF EXISTS "Landing problems are publicly readable" ON landing_problems;
CREATE POLICY "Landing problems are publicly readable" 
  ON landing_problems FOR SELECT 
  USING (true);

-- landing_kpis
DROP POLICY IF EXISTS "Landing KPIs are publicly readable" ON landing_kpis;
CREATE POLICY "Landing KPIs are publicly readable" 
  ON landing_kpis FOR SELECT 
  USING (true);

-- landing_how_it_works
DROP POLICY IF EXISTS "Landing how it works are publicly readable" ON landing_how_it_works;
CREATE POLICY "Landing how it works are publicly readable" 
  ON landing_how_it_works FOR SELECT 
  USING (true);

-- landing_testimonials
DROP POLICY IF EXISTS "Landing testimonials are publicly readable" ON landing_testimonials;
CREATE POLICY "Landing testimonials are publicly readable" 
  ON landing_testimonials FOR SELECT 
  USING (true);

-- landing_faq
DROP POLICY IF EXISTS "Landing FAQ are publicly readable" ON landing_faq;
CREATE POLICY "Landing FAQ are publicly readable" 
  ON landing_faq FOR SELECT 
  USING (true);

-- landing_cta_final
DROP POLICY IF EXISTS "Landing CTA final is publicly readable" ON landing_cta_final;
CREATE POLICY "Landing CTA final is publicly readable" 
  ON landing_cta_final FOR SELECT 
  USING (true);

-- landing_page_settings
DROP POLICY IF EXISTS "Landing page settings are publicly readable" ON landing_page_settings;
CREATE POLICY "Landing page settings are publicly readable" 
  ON landing_page_settings FOR SELECT 
  USING (true);