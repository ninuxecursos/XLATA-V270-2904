import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { provider, model, geminiApiKey: providedApiKey } = await req.json();
    
    console.log('Testing AI connection:', { provider, model, hasProvidedApiKey: !!providedApiKey });

    // Get Supabase client to fetch stored API key if needed
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // For Lovable Cloud, use the gateway
    if (provider === 'lovable_cloud') {
      const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
      
      if (!lovableApiKey) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'LOVABLE_API_KEY não configurada no ambiente',
          }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const startTime = Date.now();
      
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model || 'google/gemini-3-flash-preview',
          messages: [
            { role: 'user', content: 'Responda apenas "OK" para confirmar conexão.' }
          ],
          max_tokens: 10,
        }),
      });

      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Lovable AI error:', response.status, errorText);
        
        if (response.status === 429) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Limite de requisições excedido. Aguarde alguns minutos.',
            }),
            { 
              status: 429,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
        
        if (response.status === 402) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Créditos insuficientes. Adicione créditos ao workspace Lovable.',
            }),
            { 
              status: 402,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        return new Response(
          JSON.stringify({
            success: false,
            error: `Erro na API: ${response.status} - ${errorText}`,
          }),
          { 
            status: response.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const data = await response.json();
      const responseContent = data.choices?.[0]?.message?.content || '';

      console.log('Connection test successful:', { responseTime, responseContent });

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Conexão estabelecida com sucesso',
          provider: 'Lovable Cloud',
          model: model || 'google/gemini-3-flash-preview',
          responseTime,
          testResponse: responseContent.substring(0, 50),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For Google Gemini direct API
    if (provider === 'google_gemini') {
      // Use provided API key first, then check database for stored key
      let apiKey = providedApiKey;
      
      if (!apiKey) {
        // Fetch stored API key from database
        const { data: config } = await supabase
          .from('ai_automation_config')
          .select('gemini_api_key')
          .single();
        
        apiKey = config?.gemini_api_key;
      }
      
      if (!apiKey) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'API Key do Gemini não configurada. Insira a chave no campo acima e salve.',
            requiresApiKey: true,
          }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const startTime = Date.now();
      
      // Use Gemini API directly
      const geminiModel = model?.replace('google/', '') || 'gemini-2.0-flash';
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`;
      
      console.log('Testing Gemini direct with model:', geminiModel);
      
      const response = await fetch(geminiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: 'Responda apenas "OK" para confirmar conexão.' }
              ]
            }
          ],
          generationConfig: {
            maxOutputTokens: 10,
          }
        }),
      });

      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Gemini API error:', response.status, errorData);
        
        let errorMessage = 'Erro na API do Gemini';
        
        if (response.status === 400) {
          errorMessage = 'API Key inválida ou modelo não suportado';
        } else if (response.status === 403) {
          errorMessage = 'API Key sem permissão. Verifique se a API está habilitada no Google Cloud.';
        } else if (response.status === 429) {
          const isFreeTier = JSON.stringify(errorData).includes('free_tier');
          errorMessage = isFreeTier 
            ? 'Limite do plano GRATUITO do Gemini excedido (20 req/dia). Aguarde 24h ou ative o faturamento no Google AI Studio para ter mais requisições.'
            : 'Limite de requisições excedido. Aguarde alguns minutos e tente novamente.';
        } else if (errorData.error?.message) {
          errorMessage = errorData.error.message;
        }

        return new Response(
          JSON.stringify({
            success: false,
            error: errorMessage,
          }),
          { 
            status: response.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const data = await response.json();
      const responseContent = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      console.log('Gemini connection test successful:', { responseTime, responseContent });

      // If a new API key was provided and test was successful, save it to database
      if (providedApiKey) {
        await supabase
          .from('ai_automation_config')
          .update({ gemini_api_key: providedApiKey, updated_at: new Date().toISOString() })
          .neq('id', '');
        
        console.log('API Key saved to database');
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Conexão direta com Gemini estabelecida!',
          provider: 'Google Gemini Direct',
          model: geminiModel,
          responseTime,
          testResponse: responseContent.substring(0, 50),
          apiKeySaved: !!providedApiKey,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Provedor de IA não reconhecido',
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error testing AI connection:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
