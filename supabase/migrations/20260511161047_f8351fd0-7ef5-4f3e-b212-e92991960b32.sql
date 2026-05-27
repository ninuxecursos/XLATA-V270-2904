
-- ============== SCALE PROFILES ==============
CREATE TABLE public.scale_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  protocol TEXT NOT NULL,
  transport TEXT NOT NULL DEFAULT 'serial',
  default_baud_rate INTEGER NOT NULL DEFAULT 9600,
  data_bits INTEGER NOT NULL DEFAULT 8,
  parity TEXT NOT NULL DEFAULT 'none',
  stop_bits INTEGER NOT NULL DEFAULT 1,
  request_byte INTEGER,
  frame_regex TEXT NOT NULL,
  weight_divisor NUMERIC NOT NULL DEFAULT 1000,
  stable_flag_byte INTEGER,
  default_tcp_port INTEGER,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.scale_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view active scale profiles"
ON public.scale_profiles FOR SELECT
TO authenticated
USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins can insert scale profiles"
ON public.scale_profiles FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update scale profiles"
ON public.scale_profiles FOR UPDATE
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can delete scale profiles"
ON public.scale_profiles FOR DELETE
TO authenticated
USING (public.is_admin());

CREATE TRIGGER update_scale_profiles_updated_at
BEFORE UPDATE ON public.scale_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============== USER SCALE CONFIGS ==============
CREATE TABLE public.user_scale_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nickname TEXT NOT NULL,
  profile_id UUID REFERENCES public.scale_profiles(id) ON DELETE SET NULL,
  transport TEXT NOT NULL DEFAULT 'web_serial',
  baud_rate INTEGER NOT NULL DEFAULT 9600,
  data_bits INTEGER NOT NULL DEFAULT 8,
  parity TEXT NOT NULL DEFAULT 'none',
  stop_bits INTEGER NOT NULL DEFAULT 1,
  request_byte INTEGER,
  frame_regex TEXT NOT NULL,
  weight_divisor NUMERIC NOT NULL DEFAULT 1000,
  unit TEXT NOT NULL DEFAULT 'kg',
  decimal_places INTEGER NOT NULL DEFAULT 3,
  tcp_host TEXT,
  tcp_port INTEGER,
  qz_port_name TEXT,
  auto_connect BOOLEAN NOT NULL DEFAULT false,
  is_default BOOLEAN NOT NULL DEFAULT false,
  last_test_at TIMESTAMPTZ,
  last_test_status TEXT,
  last_test_weight NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_scale_configs ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX user_scale_configs_one_default_per_user
ON public.user_scale_configs(user_id) WHERE is_default = true;

CREATE INDEX user_scale_configs_user_id_idx ON public.user_scale_configs(user_id);

CREATE POLICY "Users view own scale configs"
ON public.user_scale_configs FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users insert own scale configs"
ON public.user_scale_configs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own scale configs"
ON public.user_scale_configs FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users delete own scale configs"
ON public.user_scale_configs FOR DELETE
TO authenticated
USING (auth.uid() = user_id OR public.is_admin());

CREATE TRIGGER update_user_scale_configs_updated_at
BEFORE UPDATE ON public.user_scale_configs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============== SCALE TEST LOGS ==============
CREATE TABLE public.scale_test_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  config_id UUID REFERENCES public.user_scale_configs(id) ON DELETE SET NULL,
  success BOOLEAN NOT NULL DEFAULT false,
  raw_data TEXT,
  parsed_weight NUMERIC,
  error_message TEXT,
  tested_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.scale_test_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX scale_test_logs_user_id_idx ON public.scale_test_logs(user_id, tested_at DESC);

CREATE POLICY "Users view own scale test logs"
ON public.scale_test_logs FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users insert own scale test logs"
ON public.scale_test_logs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own scale test logs"
ON public.scale_test_logs FOR DELETE
TO authenticated
USING (auth.uid() = user_id OR public.is_admin());

-- ============== SEED DEFAULT PROFILES ==============
INSERT INTO public.scale_profiles
(brand, model, protocol, transport, default_baud_rate, data_bits, parity, stop_bits, request_byte, frame_regex, weight_divisor, default_tcp_port, notes) VALUES
('Toledo', 'Prix 3 / Prix 4 Uno', 'toledo_p1', 'serial', 9600, 8, 'none', 1, 5,
 '\x02(\d{6})\x03', 1000, NULL,
 'Envia ENQ (0x05), recebe STX + 6 dígitos (peso em gramas) + ETX. Cabo serial DB9 cross/null-modem.'),
('Toledo', 'Prix 5 / Prix 6 (Rede)', 'toledo_p1', 'tcp', 9600, 8, 'none', 1, 5,
 '\x02(\d{6})\x03', 1000, 9001,
 'Versão de rede (Ethernet/Wi-Fi). Mesmo protocolo Toledo. Configure IP e porta no painel da balança.'),
('Filizola', 'CS-15 / Platina', 'toledo_p2', 'serial', 4800, 8, 'none', 1, 5,
 '\x02(\d{6})\x03', 1000, NULL,
 'Compatível Toledo P1/P2. Atenção: muitas Filizola operam a 4800 baud.'),
('Filizola', 'MGV6 / Smart', 'toledo_p1', 'serial', 9600, 8, 'none', 1, 5,
 '\x02(\d{6})\x03', 1000, NULL,
 'Protocolo Toledo padrão. Algumas variantes suportam TCP em porta 9001.'),
('Urano', 'POP-S / POP-Z', 'urano_ik', 'serial', 9600, 8, 'none', 1, 5,
 'Ik(\d+\.\d+)', 1, NULL,
 'Resposta ao ENQ no formato "IkX.XXX" (peso em kg com ponto decimal). Modo contínuo também disponível.'),
('Welmy', 'W-200 / W-300 / R/2', 'welmy_ascii', 'serial', 9600, 8, 'none', 1, NULL,
 '(\d+\.\d+)\s*kg', 1, NULL,
 'Modo contínuo ASCII. Frames como "  1.234 kg" terminados em CR/LF.'),
('Elgin', 'DP-15 / SA-110', 'toledo_p1', 'serial', 9600, 8, 'none', 1, 5,
 '\x02(\d{6})\x03', 1000, NULL,
 'Compatível com protocolo Toledo P1. Use ENQ para solicitar peso.'),
('Genérica', 'Toledo STX/ETX (qualquer marca)', 'generic_enq', 'serial', 9600, 8, 'none', 1, 5,
 '\x02(\d{6})\x03', 1000, NULL,
 'Padrão genérico STX + dígitos + ETX. Tente este perfil se a marca não estiver listada.'),
('Genérica', 'Modo Contínuo ASCII', 'generic_continuous', 'serial', 9600, 8, 'none', 1, NULL,
 '(\d+\.\d+)', 1, NULL,
 'Para balanças que enviam peso continuamente em ASCII com ponto decimal. Sem byte de requisição.');
