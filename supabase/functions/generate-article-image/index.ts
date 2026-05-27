import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// XLATA Logo as base64 (small green circular logo with X pattern)
const XLATA_LOGO_URL = 'https://oxawvjcckmbevjztyfgp.supabase.co/storage/v1/object/public/landing-images/XLATALOGO.png';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, content, articleType, keywords } = await req.json();

    if (!title) {
      return new Response(
        JSON.stringify({ error: 'Title is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build optimized prompt based on article type
    const typePrompts: Record<string, string> = {
      blog: 'Create a professional blog header illustration',
      help: 'Create a clean tutorial illustration',
      pillar: 'Create an impactful hero banner illustration',
      glossary: 'Create a conceptual educational illustration'
    };

    const basePrompt = typePrompts[articleType] || typePrompts.blog;
    
    // Extract key themes from content
    const contentSummary = content?.substring(0, 300) || '';
    const keywordsList = keywords || '';

    // Step 1: Generate base image WITHOUT logo
    const baseImagePrompt = `${basePrompt} for a recycling management software.

Theme: "${title}"
${contentSummary ? `Context: ${contentSummary}` : ''}
${keywordsList ? `Related: ${keywordsList}` : ''}

CRITICAL RULES - ABSOLUTELY MUST FOLLOW:
1. NO TEXT whatsoever - absolutely NO words, NO letters, NO numbers, NO typography
2. NO logos, NO watermarks, NO brand marks
3. Leave the bottom-right corner relatively clean/simple for logo placement later

Visual Style:
- Modern flat illustration with subtle gradients and depth
- Professional, clean, tech-inspired design
- Primary colors: emerald green (#10B981), dark tones (#1F2937, #111827)
- Industrial recycling elements: metal, gears, scales, trucks, recycling symbols
- 16:9 aspect ratio, ultra high resolution
- Suitable for website hero section

This is a pure ILLUSTRATION without any text or logos.`;

    console.log('Step 1: Generating base image...');

    // Call Lovable AI to generate base image
    const baseImageResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: baseImagePrompt
          }
        ],
        modalities: ['image', 'text']
      })
    });

    if (!baseImageResponse.ok) {
      const errorText = await baseImageResponse.text();
      console.error('AI Gateway error (base image):', baseImageResponse.status, errorText);
      
      if (baseImageResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns minutos.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (baseImageResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos insuficientes para geração de imagem.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to generate base image' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const baseImageData = await baseImageResponse.json();
    console.log('Base image generated');

    // Extract base image from response
    const baseImageUrl = baseImageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!baseImageUrl) {
      console.error('No base image in AI response:', JSON.stringify(baseImageData).substring(0, 500));
      return new Response(
        JSON.stringify({ error: 'No base image generated' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Step 2: Adding XLATA logo overlay...');

    // Step 2: Use image editing to add the XLATA logo
    const logoOverlayResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Add the XLATA logo (the second image) to the bottom-right corner of the main image (the first image).

REQUIREMENTS:
- Place the logo in the bottom-right corner with 20-30 pixels of padding from edges
- Make the logo size approximately 10-12% of the image width
- Keep the logo fully visible and clear
- DO NOT modify any other part of the image
- DO NOT add any text
- Maintain the original image quality
- The logo should have a subtle white or light glow/shadow behind it to ensure visibility`
              },
              {
                type: 'image_url',
                image_url: {
                  url: baseImageUrl
                }
              },
              {
                type: 'image_url',
                image_url: {
                  url: XLATA_LOGO_URL
                }
              }
            ]
          }
        ],
        modalities: ['image', 'text']
      })
    });

    if (!logoOverlayResponse.ok) {
      const errorText = await logoOverlayResponse.text();
      console.error('AI Gateway error (logo overlay):', logoOverlayResponse.status, errorText);
      
      // If logo overlay fails, use the base image without logo
      console.log('Logo overlay failed, using base image');
    }

    let finalImageData = baseImageUrl;

    if (logoOverlayResponse.ok) {
      const logoOverlayData = await logoOverlayResponse.json();
      const overlayImageUrl = logoOverlayData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      
      if (overlayImageUrl) {
        finalImageData = overlayImageUrl;
        console.log('Logo overlay successful');
      } else {
        console.log('No overlay image returned, using base image');
      }
    }

    console.log('Image generation complete');

    // Upload to Supabase Storage
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract base64 data
    const base64Data = finalImageData.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    // Generate unique filename
    const timestamp = Date.now();
    const slug = title.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
    const fileName = `${articleType}/${slug}-${timestamp}.png`;

    console.log('Uploading image to storage:', fileName);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('article-images')
      .upload(fileName, imageBuffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return new Response(
        JSON.stringify({ error: 'Failed to upload image', details: uploadError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('article-images')
      .getPublicUrl(fileName);

    console.log('Image uploaded successfully:', publicUrl);

    return new Response(
      JSON.stringify({ 
        success: true, 
        imageUrl: publicUrl,
        fileName: fileName,
        prompt: baseImagePrompt
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-article-image:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
