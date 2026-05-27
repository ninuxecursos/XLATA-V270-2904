import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Download images and convert to base64
async function downloadImagesToBase64(imageUrls: string[]) {
  const results: { base64: string; mimeType: string }[] = [];
  for (const url of imageUrls.slice(0, 5)) {
    try {
      const imgResponse = await fetch(url);
      if (!imgResponse.ok) {
        console.warn(`[ImageStudio] Failed to fetch image (${imgResponse.status}): ${url}`);
        continue;
      }
      const buffer = await imgResponse.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);
      const mimeType = imgResponse.headers.get('content-type') || 'image/jpeg';
      results.push({ base64, mimeType });
    } catch (e) {
      console.warn(`[ImageStudio] Error fetching image: ${url}`, e);
    }
  }
  return results;
}

// Call Google Gemini API directly for image generation
async function callGoogleImageGen(geminiApiKey: string, promptText: string, images: { base64: string; mimeType: string }[]) {
  const parts: any[] = [{ text: promptText }];
  for (const img of images) {
    parts.push({ inlineData: { mimeType: img.mimeType, data: img.base64 } });
  }

  console.log('[ImageStudio] Calling Google Direct API with model gemini-2.0-flash-preview-image-generation');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${geminiApiKey}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts }],
      generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[ImageStudio] Google API error:', response.status, errorText);
    if (response.status === 429) throw { status: 429, message: 'Rate limit exceeded' };
    throw { status: response.status, message: `Google API error: ${response.status}` };
  }

  const data = await response.json();
  
  // Find image part in response
  const candidateParts = data.candidates?.[0]?.content?.parts || [];
  const imagePart = candidateParts.find((p: any) => p.inlineData);
  
  if (imagePart?.inlineData) {
    const { mimeType, data: imgData } = imagePart.inlineData;
    const format = mimeType.split('/')[1] || 'png';
    return `data:${mimeType};base64,${imgData}`;
  }
  
  return null;
}

// Call Lovable gateway for image generation
async function callLovableImageGen(apiKey: string, promptText: string, images: { base64: string; mimeType: string }[]) {
  const content: any[] = [{ type: "text", text: promptText }];
  for (const img of images) {
    content.push({
      type: "image_url",
      image_url: { url: `data:${img.mimeType};base64,${img.base64}` },
    });
  }

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image",
      messages: [{ role: "user", content }],
      modalities: ["image", "text"],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[ImageStudio] Lovable gateway error:', response.status, errorText);
    if (response.status === 429) throw { status: 429, message: 'Rate limit exceeded' };
    if (response.status === 402) throw { status: 402, message: 'Payment required' };
    throw { status: 500, message: 'AI generation failed' };
  }

  const aiData = await response.json();
  
  // Primary path
  let imageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url || null;
  
  // Alternative: inline base64 in content
  if (!imageUrl) {
    const contentStr = typeof aiData.choices?.[0]?.message?.content === 'string'
      ? aiData.choices[0].message.content : '';
    const inlineMatch = contentStr.match(/data:image\/[a-zA-Z]+;base64,[A-Za-z0-9+/=]+/);
    if (inlineMatch) imageUrl = inlineMatch[0];
  }

  return imageUrl;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrls, prompt } = await req.json();

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return new Response(JSON.stringify({ success: false, error: "No images provided" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!prompt) {
      return new Response(JSON.stringify({ success: false, error: "No prompt provided" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Setup Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get user's Gemini API key from database
    const { data: config } = await supabaseAdmin
      .from('ai_automation_config')
      .select('gemini_api_key')
      .single();

    const geminiApiKey = config?.gemini_api_key;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!geminiApiKey && !lovableApiKey) {
      return new Response(JSON.stringify({ success: false, error: "Nenhuma chave de API configurada." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Download all images to base64
    const downloadedImages = await downloadImagesToBase64(imageUrls);
    if (downloadedImages.length === 0) {
      return new Response(JSON.stringify({ success: false, error: "Failed to process input images" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aspectInstruction = "CRITICAL REQUIREMENT: The output image MUST be perfectly square with a 1:1 aspect ratio (same width and height). Never produce vertical, horizontal, or rectangular images. The main product must be centered in the square frame.\n\n";
    const fullPrompt = aspectInstruction + prompt;

    console.log(`[ImageStudio] Function called! Using ${geminiApiKey ? 'Google Direct' : 'Lovable Gateway'}, ${downloadedImages.length} images, prompt length: ${prompt.length}`);

    // Retry logic - up to 3 attempts
    let generatedImageUrl: string | null = null;
    const MAX_ATTEMPTS = 3;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      console.log(`[ImageStudio] Attempt ${attempt}/${MAX_ATTEMPTS}`);

      try {
        if (geminiApiKey) {
          generatedImageUrl = await callGoogleImageGen(geminiApiKey, fullPrompt, downloadedImages);
        } else {
          generatedImageUrl = await callLovableImageGen(lovableApiKey!, fullPrompt, downloadedImages);
        }
      } catch (err: any) {
        // For rate limit or payment errors, return immediately
        if (err.status === 429 || err.status === 402) {
          return new Response(JSON.stringify({ success: false, error: err.message }), {
            status: err.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        console.error(`[ImageStudio] Error on attempt ${attempt}:`, err.message);
      }

      if (generatedImageUrl) {
        console.log(`[ImageStudio] Image obtained on attempt ${attempt}`);
        break;
      }

      if (attempt < MAX_ATTEMPTS) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    if (!generatedImageUrl) {
      return new Response(JSON.stringify({ success: false, error: "No image generated after all attempts" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract base64 data and upload to storage
    const base64Match = generatedImageUrl.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!base64Match) {
      return new Response(JSON.stringify({ success: false, error: "Invalid image format" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const imageFormat = base64Match[1];
    const base64Data = base64Match[2];
    const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

    const fileName = `studio/studio-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${imageFormat === 'jpeg' ? 'jpg' : imageFormat}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("shop-product-images")
      .upload(fileName, binaryData, {
        contentType: `image/${imageFormat}`,
        upsert: false,
      });

    if (uploadError) {
      console.error("[ImageStudio] Upload error:", uploadError);
      return new Response(JSON.stringify({ success: false, error: "Upload failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from("shop-product-images")
      .getPublicUrl(fileName);

    console.log("[ImageStudio] Success:", publicUrlData.publicUrl);

    // Log AI usage
    try {
      await supabaseAdmin.from('ai_usage_log').insert({
        usage_type: 'image_generation',
        ai_provider: geminiApiKey ? 'google_gemini' : 'lovable_cloud',
        ai_model: geminiApiKey ? 'gemini-2.0-flash-preview-image-generation' : 'google/gemini-2.5-flash-image',
      });
    } catch (e) {
      console.warn('[ImageStudio] Failed to log AI usage:', e);
    }

    return new Response(JSON.stringify({ success: true, imageUrl: publicUrlData.publicUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[ImageStudio] Unexpected error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
