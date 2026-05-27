import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('[process-interactive-events] Starting event processing...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date().toISOString();
    const results = {
      activated: 0,
      finalized: 0,
      reactivated: 0,
      errors: [] as string[]
    };

    // 1. Activate scheduled events that should start now
    const { data: scheduledEvents, error: scheduledError } = await supabase
      .from('shop_interactive_events')
      .select('id')
      .eq('status', 'scheduled')
      .lte('start_at', now);

    if (scheduledError) {
      console.error('[process-interactive-events] Error fetching scheduled events:', scheduledError);
      results.errors.push(`Scheduled fetch error: ${scheduledError.message}`);
    } else if (scheduledEvents && scheduledEvents.length > 0) {
      console.log(`[process-interactive-events] Found ${scheduledEvents.length} events to activate`);
      
      for (const event of scheduledEvents) {
        const { data, error } = await supabase.rpc('activate_scheduled_event', {
          p_event_id: event.id
        });

        if (error) {
          console.error(`[process-interactive-events] Failed to activate event ${event.id}:`, error);
          results.errors.push(`Activate ${event.id}: ${error.message}`);
        } else {
          console.log(`[process-interactive-events] Activated event ${event.id}`);
          results.activated++;
        }
      }
    }

    // 2. Finalize active events that have ended
    const { data: endedEvents, error: endedError } = await supabase
      .from('shop_interactive_events')
      .select('id')
      .eq('status', 'active')
      .lte('end_at', now);

    if (endedError) {
      console.error('[process-interactive-events] Error fetching ended events:', endedError);
      results.errors.push(`Ended fetch error: ${endedError.message}`);
    } else if (endedEvents && endedEvents.length > 0) {
      console.log(`[process-interactive-events] Found ${endedEvents.length} events to finalize`);
      
      for (const event of endedEvents) {
        const { data, error } = await supabase.rpc('finalize_interactive_event', {
          p_event_id: event.id
        });

        if (error) {
          console.error(`[process-interactive-events] Failed to finalize event ${event.id}:`, error);
          results.errors.push(`Finalize ${event.id}: ${error.message}`);
        } else {
          console.log(`[process-interactive-events] Finalized event ${event.id}:`, data);
          results.finalized++;
        }
      }
    }

    // 3. Reactivate products after 3-day cooldown
    const { data: reactivatedProducts, error: reactivateError } = await supabase.rpc('reactivate_cooled_down_products');

    if (reactivateError) {
      console.error('[process-interactive-events] Error reactivating products:', reactivateError);
      results.errors.push(`Reactivation error: ${reactivateError.message}`);
    } else if (reactivatedProducts && reactivatedProducts.length > 0) {
      console.log(`[process-interactive-events] Reactivated ${reactivatedProducts.length} products after cooldown`);
      results.reactivated = reactivatedProducts.length;
      
      for (const item of reactivatedProducts) {
        console.log(`[process-interactive-events] Product ${item.product_id} reactivated with new event ${item.new_event_id}`);
      }
    }

    console.log('[process-interactive-events] Processing complete:', results);

    return new Response(JSON.stringify({
      success: true,
      message: `Processed ${results.activated} activations, ${results.finalized} finalizations, ${results.reactivated} reactivations`,
      ...results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[process-interactive-events] Unexpected error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
