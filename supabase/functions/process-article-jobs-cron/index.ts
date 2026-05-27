// CRON: roda a cada minuto. Pega até 3 jobs pendentes prontos e dispara
// process-article-job em paralelo (background tasks). Não trava na resposta.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const MAX_CONCURRENT = 3;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const nowIso = new Date().toISOString();

  // ─── (1) Tópicos do banco com scheduled_for vencido — geração programada manual ───
  // Pega no máximo 1 por execução para evitar pico no Gemini
  const { data: scheduledTopics } = await supabase
    .from("seo_topic_bank")
    .select("id, topic, scheduled_for")
    .eq("is_used", false)
    .not("scheduled_for", "is", null)
    .lte("scheduled_for", nowIso)
    .order("scheduled_for", { ascending: true })
    .limit(1);

  const scheduledDispatched: Array<{ id: string; topic: string }> = [];
  if (scheduledTopics && scheduledTopics.length > 0) {
    for (const t of scheduledTopics) {
      console.log(`[cron] Disparando tópico agendado: ${t.topic}`);
      // fire-and-forget — não bloqueia o CRON
      supabase.functions
        .invoke("generate-seo-article", { body: { topic_id: t.id } })
        .catch((err) => console.error(`[cron] Falha geração tópico ${t.id}:`, err));
      scheduledDispatched.push({ id: t.id, topic: t.topic });
    }
  }

  // ─── (2) Jobs tradicionais (article_jobs) ───
  const { data: jobs, error } = await supabase
    .from("article_jobs")
    .select("id, title")
    .eq("status", "pending")
    .lte("scheduled_at", nowIso)
    .order("scheduled_at", { ascending: true })
    .limit(MAX_CONCURRENT);

  if (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message, scheduledDispatched: scheduledDispatched.length }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (!jobs || jobs.length === 0) {
    return new Response(
      JSON.stringify({
        success: true,
        dispatched: 0,
        scheduledTopicsDispatched: scheduledDispatched.length,
        topics: scheduledDispatched,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const dispatched = jobs.map((job) => {
    return supabase.functions
      .invoke("process-article-job", { body: { job_id: job.id } })
      .catch((err) =>
        console.error(`[cron] Falha ao disparar job ${job.id}:`, err)
      );
  });

  await Promise.race([
    Promise.allSettled(dispatched),
    new Promise((r) => setTimeout(r, 5000)),
  ]);

  return new Response(
    JSON.stringify({
      success: true,
      dispatched: jobs.length,
      scheduledTopicsDispatched: scheduledDispatched.length,
      jobs: jobs.map((j) => ({ id: j.id, title: j.title })),
      topics: scheduledDispatched,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
