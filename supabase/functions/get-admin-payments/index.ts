import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'https://xlata.site',
  'https://www.xlata.site',
  'https://oxawvjcckmbevjztyfgp.supabase.co',
  'http://localhost:5173',
  'http://localhost:3000',
  'https://lovable.dev'
];

// Allow any lovable.app or lovable.dev preview domain
const isAllowedOrigin = (origin: string | null): boolean => {
  if (!origin) return true; // Allow requests without origin (like curl)
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (origin.endsWith('.lovable.app') || origin.endsWith('.lovable.dev')) return true;
  if (origin.endsWith('.lovableproject.com')) return true;
  return false;
};

const getCorsHeaders = (origin: string | null) => {
  const allowedOrigin = isAllowedOrigin(origin) ? (origin || '*') : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };
};

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  console.log(`[get-admin-payments] Request received - Method: ${req.method}, Origin: ${origin}`);

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log('[get-admin-payments] Handling OPTIONS preflight request');
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      console.error('[get-admin-payments] Missing environment variables');
      throw new Error("Missing required environment variables");
    }

    // Verify the user is authenticated and is admin
    const authHeader = req.headers.get("Authorization");
    console.log(`[get-admin-payments] Auth header present: ${!!authHeader}`);
    
    if (!authHeader) {
      console.log('[get-admin-payments] No authorization header');
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user's token to verify identity
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    
    if (userError) {
      console.error('[get-admin-payments] User auth error:', userError.message);
      return new Response(
        JSON.stringify({ error: "Erro de autenticação: " + userError.message }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (!user) {
      console.log('[get-admin-payments] No user found');
      return new Response(
        JSON.stringify({ error: "Usuário não autenticado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[get-admin-payments] User authenticated: ${user.id}`);

    // Check if user is admin
    const { data: profile, error: profileError } = await userClient
      .from("profiles")
      .select("status")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error('[get-admin-payments] Profile fetch error:', profileError.message);
      return new Response(
        JSON.stringify({ error: "Erro ao verificar perfil: " + profileError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (profile?.status !== "admin") {
      console.log(`[get-admin-payments] Access denied - User status: ${profile?.status}`);
      return new Response(
        JSON.stringify({ error: "Acesso negado. Apenas administradores." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log('[get-admin-payments] Admin verified, fetching data...');

    // Use service role to fetch all payments
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all payments
    const { data: payments, error: paymentsError } = await adminClient
      .from("mercado_pago_payments")
      .select("*")
      .order("created_at", { ascending: false });

    if (paymentsError) {
      console.error("[get-admin-payments] Error fetching payments:", paymentsError.message);
      throw new Error("Erro ao buscar pagamentos: " + paymentsError.message);
    }

    console.log(`[get-admin-payments] Found ${payments?.length || 0} payments`);

    // Fetch all subscriptions with payment references
    const { data: subscriptions, error: subsError } = await adminClient
      .from("user_subscriptions")
      .select("user_id, payment_reference, plan_type, is_active, expires_at, activated_at")
      .not("payment_reference", "is", null);

    if (subsError) {
      console.error("[get-admin-payments] Error fetching subscriptions:", subsError.message);
      throw new Error("Erro ao buscar assinaturas: " + subsError.message);
    }

    console.log(`[get-admin-payments] Found ${subscriptions?.length || 0} subscriptions with payment refs`);

    // Get unique user IDs from subscriptions
    const userIds = [...new Set(subscriptions?.map(s => s.user_id) || [])];

    // Fetch user profiles
    const { data: profiles, error: profilesError } = await adminClient
      .from("profiles")
      .select("id, name, email, phone, whatsapp")
      .in("id", userIds.length > 0 ? userIds : ['00000000-0000-0000-0000-000000000000']);

    if (profilesError) {
      console.error("[get-admin-payments] Error fetching profiles:", profilesError.message);
    }

    // Create a map of profiles by user_id
    const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

    // Enrich subscriptions with user data
    const enrichedSubscriptions = subscriptions?.map(sub => ({
      ...sub,
      user_profile: profilesMap.get(sub.user_id) || null
    })) || [];

    // Also try to match payments by email to get user info
    const emails = payments?.map(p => p.payer_email).filter(Boolean) || [];
    const { data: emailProfiles } = await adminClient
      .from("profiles")
      .select("id, name, email, phone, whatsapp")
      .in("email", emails.length > 0 ? emails : ['none@none.com']);

    const emailProfilesMap = new Map(emailProfiles?.map(p => [p.email, p]) || []);

    // Enrich payments with user profile from email
    const enrichedPayments = payments?.map(payment => ({
      ...payment,
      user_profile: emailProfilesMap.get(payment.payer_email) || null
    })) || [];

    const responseData = {
      payments: enrichedPayments,
      subscriptions: enrichedSubscriptions,
      stats: {
        total: payments?.length || 0,
        approved: payments?.filter(p => p.status === "approved").length || 0,
        pending: payments?.filter(p => p.status === "pending").length || 0,
        rejected: payments?.filter(p => p.status === "rejected" || p.status === "cancelled").length || 0,
        totalRevenue: payments
          ?.filter(p => p.status === "approved")
          .reduce((sum, p) => sum + (p.transaction_amount || 0), 0) || 0
      }
    };

    console.log(`[get-admin-payments] Returning response with ${responseData.payments.length} payments`);

    return new Response(
      JSON.stringify(responseData),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("[get-admin-payments] Error:", error.message);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Erro interno do servidor",
        details: "Verifique os logs da função para mais detalhes"
      }),
      { status: 500, headers: { ...getCorsHeaders(req.headers.get('origin')), "Content-Type": "application/json" } }
    );
  }
});
