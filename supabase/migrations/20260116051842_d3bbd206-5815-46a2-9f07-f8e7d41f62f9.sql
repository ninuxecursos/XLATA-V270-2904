-- Adicionar campo para badges de segurança no footer
ALTER TABLE landing_footer_settings
ADD COLUMN IF NOT EXISTS security_badges jsonb DEFAULT '[
  {"icon": "Shield", "label": "Site Seguro", "is_visible": true},
  {"icon": "Lock", "label": "Dados Criptografados", "is_visible": true},
  {"icon": "BadgeCheck", "label": "100% Confiável", "is_visible": true}
]'::jsonb;

-- Comentário explicativo
COMMENT ON COLUMN landing_footer_settings.security_badges IS 'Array de badges de segurança: [{icon, label, is_visible}]';