import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

interface SystemStats {
  database_name: string;
  database_size: string;
  database_size_bytes: number;
  database_capacity: string;
  database_usage_percentage: number;
  storage_size: string;
  storage_capacity: string;
  storage_usage_percentage: number;
  total_tables: number;
  total_functions: number;
  active_connections: number;
  active_users: number;
  transactions_today: number;
  total_transactions: number;
  cpu_usage?: number;
  memory_usage?: number;
  supabase_plan: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const dbName = supabaseUrl.split('//')[1]?.split('.')[0] || 'supabase_db'

    // 1. Table count via RPC
    let tableCount = 0;
    try {
      const { data } = await supabase.rpc('get_table_count');
      tableCount = data?.count || 0;
    } catch { tableCount = 0; }

    // 2. Total users
    const { count: totalUsersCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // 3. Active users (online in last 5 min via user_presence)
    let activeUsers = 0;
    try {
      const { data: onlineData } = await supabase.rpc('get_online_users');
      activeUsers = onlineData?.length || 0;
    } catch {
      // fallback: profiles updated in last 24h
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('updated_at', yesterday.toISOString());
      activeUsers = count || 0;
    }

    // 4. Transactions today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: todayCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString())
      .eq('status', 'completed');

    // 5. Total transactions
    const { count: totalCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed');

    // 6. Database size via RPC
    let databaseSizeBytes = 0;
    let databaseSizeFormatted = 'N/A';
    try {
      const { data: dbSizeData, error: dbSizeError } = await supabase.rpc('get_database_statistics');
      if (!dbSizeError && dbSizeData) {
        databaseSizeFormatted = dbSizeData.database_size || 'N/A';
        if (typeof dbSizeData.size_bytes === 'number') {
          databaseSizeBytes = dbSizeData.size_bytes;
        }
      }
    } catch {}

    const supabaseFreeDbLimit = 500 * 1024 * 1024; // 500 MB
    const supabaseFreeStorageLimit = 1 * 1024 * 1024 * 1024; // 1 GB
    const dbUsagePercentage = Math.min((databaseSizeBytes / supabaseFreeDbLimit) * 100, 100);

    // 7. Storage usage via RPC
    let storageSize = '0 MB';
    let storageSizeBytes = 0;
    let storageUsagePercentage = 0;
    try {
      const { data: storageData, error: storageError } = await supabase.rpc('get_storage_usage');
      if (!storageError && storageData) {
        storageSize = storageData.formatted_size || '0 MB';
        storageSizeBytes = storageData.total_size || 0;
        storageUsagePercentage = Math.min((storageSizeBytes / supabaseFreeStorageLimit) * 100, 100);
      }
    } catch {}

    // 8. Function count via RPC
    let functionCount = 0;
    try {
      const { data } = await supabase.rpc('get_function_count');
      functionCount = data?.count || 0;
    } catch {}

    // 9. Active connections (user_presence online count)
    let activeConnections = 0;
    try {
      const { count } = await supabase
        .from('user_presence')
        .select('*', { count: 'exact', head: true })
        .eq('is_online', true);
      activeConnections = count || 0;
    } catch {}

    const stats: SystemStats = {
      database_name: dbName,
      database_size: databaseSizeFormatted,
      database_size_bytes: databaseSizeBytes,
      database_capacity: '500 MB',
      database_usage_percentage: Math.round(dbUsagePercentage * 100) / 100,
      storage_size: storageSize,
      storage_capacity: '1 GB',
      storage_usage_percentage: Math.round(storageUsagePercentage * 100) / 100,
      total_tables: tableCount,
      total_functions: functionCount,
      active_connections: activeConnections,
      active_users: activeUsers,
      transactions_today: todayCount || 0,
      total_transactions: totalCount || 0,
      cpu_usage: undefined,
      memory_usage: undefined,
      supabase_plan: 'Free'
    };

    return new Response(JSON.stringify(stats), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in get-system-stats:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
