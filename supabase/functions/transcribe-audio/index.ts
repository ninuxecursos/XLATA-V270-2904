 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 
 const corsHeaders = {
   'Access-Control-Allow-Origin': '*',
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
 };
 
 serve(async (req) => {
   // Handle CORS preflight requests
   if (req.method === 'OPTIONS') {
     return new Response('ok', { headers: corsHeaders });
   }
 
   try {
     const { audio_base64, mime_type } = await req.json();
     
     if (!audio_base64) {
       throw new Error('audio_base64 is required');
     }
 
     const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
     if (!lovableApiKey) {
       throw new Error('LOVABLE_API_KEY not configured');
     }
 
     console.log('[transcribe-audio] Processing audio, mime_type:', mime_type || 'audio/webm');
     console.log('[transcribe-audio] Audio size (base64):', audio_base64.length, 'chars');
 
     // Determine audio format from mime type
     let audioFormat = 'webm';
     if (mime_type) {
       if (mime_type.includes('mp4') || mime_type.includes('m4a')) {
         audioFormat = 'mp4';
       } else if (mime_type.includes('wav')) {
         audioFormat = 'wav';
       } else if (mime_type.includes('mp3') || mime_type.includes('mpeg')) {
         audioFormat = 'mp3';
       } else if (mime_type.includes('ogg')) {
         audioFormat = 'ogg';
       }
     }
 
      // Determine mime type for data URI
      const mimeForDataUri = mime_type || `audio/${audioFormat}`;

      // Use Gemini Flash for audio transcription via image_url data URI format
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Transcreva este áudio para texto em português brasileiro.

INSTRUÇÕES:
- Retorne APENAS o texto transcrito
- Não adicione explicações, comentários ou formatação
- Se o áudio contiver informações sobre um produto (nome, preço, descrição, dimensões, peso, etc.), transcreva exatamente como foi dito
- Mantenha números e valores exatamente como foram falados
- Se não conseguir entender algo, ignore essa parte

Transcrição:`
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${mimeForDataUri};base64,${audio_base64}`
                  }
                }
              ]
            }
          ],
         temperature: 0.1,
         max_tokens: 2000,
       }),
     });
 
     if (!response.ok) {
       const errorText = await response.text();
       console.error('[transcribe-audio] AI Gateway error:', response.status, errorText);
       throw new Error(`AI error: ${response.status} - ${errorText}`);
     }
 
     const aiResponse = await response.json();
     console.log('[transcribe-audio] AI Response received');
     
     const transcription = aiResponse.choices?.[0]?.message?.content || '';
     
     if (!transcription) {
       console.warn('[transcribe-audio] Empty transcription returned');
       throw new Error('Não foi possível transcrever o áudio');
     }
 
     console.log('[transcribe-audio] Transcription successful, length:', transcription.length);
 
     return new Response(
       JSON.stringify({ 
         transcription: transcription.trim(),
         format_detected: audioFormat
       }),
       { 
         headers: { 
           ...corsHeaders, 
           'Content-Type': 'application/json' 
         } 
       }
     );
 
   } catch (error) {
     console.error('[transcribe-audio] Error:', error);
     return new Response(
       JSON.stringify({ 
         error: error.message || 'Erro ao transcrever áudio',
         details: String(error)
       }),
       { 
         status: 500, 
         headers: { 
           ...corsHeaders, 
           'Content-Type': 'application/json' 
         } 
       }
     );
   }
 });