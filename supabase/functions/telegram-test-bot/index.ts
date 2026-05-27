import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) return json({ error: 'UNAUTHORIZED' }, 401);
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!);
    const { data: u } = await supabase.auth.getUser(auth.replace('Bearer ', ''));
    if (!u?.user) return json({ error: 'UNAUTHORIZED' }, 401);

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: cfg } = await admin.from('telegram_bot_config').select('bot_token').limit(1).maybeSingle();
    if (!cfg?.bot_token) return json({ error: 'NO_TOKEN', message: 'Configure o token do bot primeiro.' }, 400);

    const meRes = await fetch(`https://api.telegram.org/bot${cfg.bot_token}/getMe`);
    const meData = await meRes.json();
    if (!meData.ok) return json({ error: 'BOT_INVALID', message: meData.description || 'Token inválido.', telegram: meData }, 400);

    const infoRes = await fetch(`https://api.telegram.org/bot${cfg.bot_token}/getWebhookInfo`);
    const infoData = await infoRes.json();

    return json({ success: true, bot: meData.result, webhook: infoData?.result || null });
  } catch (e: any) {
    console.error('telegram-test-bot error:', e);
    return json({ error: 'FATAL', message: e?.message || 'Erro interno' }, 500);
  }
});
