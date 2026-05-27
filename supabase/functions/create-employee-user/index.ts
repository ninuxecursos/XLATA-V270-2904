import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// SECURITY: Restricted CORS origins
const ALLOWED_ORIGINS = [
  'https://xlata.site',
  'https://www.xlata.site',
  'https://oxawvjcckmbevjztyfgp.supabase.co',
  'https://lovable.dev',
  'http://localhost:5173',
  'http://localhost:3000'
];

const isAllowedOrigin = (origin: string | null): boolean => {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (origin.endsWith('.lovable.app') || 
      origin.endsWith('.lovable.dev') || 
      origin.endsWith('.lovableproject.com')) {
    return true;
  }
  return false;
};

const getCorsHeaders = (origin: string | null) => {
  const allowedOrigin = isAllowedOrigin(origin) ? origin! : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
};

// Generate secure random password
function generateSecurePassword(length: number = 12): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%&*';
  
  const allChars = uppercase + lowercase + numbers + special;
  
  // Ensure at least one of each type
  let password = '';
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  // Fill remaining with random chars
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

// Get default permissions for a role
function getDefaultPermissions(role: string): string[] {
  switch (role) {
    case 'gerente':
      return [
        'pdv_view', 'pdv_create_order', 'pdv_complete_order',
        'materials_view', 'materials_edit',
        'stock_view',
        'transactions_view', 'expenses_view', 'expenses_create',
        'cash_register_open', 'cash_register_close',
        'reports_view',
        'clients_view', 'clients_edit',
        'settings_view'
      ];
    case 'supervisor':
      return [
        'pdv_view', 'pdv_create_order', 'pdv_complete_order',
        'materials_view', 'materials_edit',
        'stock_view',
        'transactions_view', 'expenses_view',
        'cash_register_open', 'cash_register_close',
        'reports_view',
        'clients_view', 'clients_edit'
      ];
    case 'caixa':
      return [
        'pdv_view', 'pdv_create_order', 'pdv_complete_order',
        'materials_view',
        'cash_register_open', 'cash_register_close',
        'clients_view'
      ];
    case 'operador':
    default:
      return [
        'pdv_view', 'pdv_create_order',
        'materials_view',
        'clients_view'
      ];
  }
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get authorization header to validate the caller
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Verify the caller's JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !caller) {
      throw new Error('Invalid authorization token');
    }

    const { name, email, phone, role } = await req.json();

    console.log(`Creating employee user: ${email} for owner: ${caller.id}`);

    // Validate required fields
    if (!name || !email) {
      throw new Error('Nome e email são obrigatórios');
    }

    // Check if email already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    const emailExists = existingUser?.users?.some(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (emailExists) {
      throw new Error('Este email já está cadastrado no sistema');
    }

    // Generate secure password
    const generatedPassword = generateSecurePassword(12);

    // Create user in Supabase Auth
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase(),
      password: generatedPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        name,
        phone,
        is_employee: true,
        owner_id: caller.id,
      },
    });

    if (createError) {
      console.error('Error creating user:', createError);
      throw new Error(`Erro ao criar usuário: ${createError.message}`);
    }

    console.log(`User created successfully: ${newUser.user.id}`);

    // Create profile for the new employee
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: newUser.user.id,
        email: email.toLowerCase(),
        name,
        phone,
        status: 'user',
      });

    if (profileError) {
      console.error('Error creating profile:', profileError);
      // Don't throw - profile might be created by trigger
    }

    // Create depot_employee record
    const { data: employee, error: employeeError } = await supabaseAdmin
      .from('depot_employees')
      .insert({
        owner_user_id: caller.id,
        employee_user_id: newUser.user.id,
        name,
        email: email.toLowerCase(),
        phone,
        role: role || 'operador',
        is_active: true,
        initial_password_set: true,
      })
      .select()
      .single();

    if (employeeError) {
      console.error('Error creating employee record:', employeeError);
      // Rollback: delete the created user
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      throw new Error(`Erro ao criar registro de funcionário: ${employeeError.message}`);
    }

    console.log(`Employee record created: ${employee.id}`);

    // Apply default permissions based on role
    const defaultPermissions = getDefaultPermissions(role || 'operador');
    
    if (defaultPermissions.length > 0) {
      const permissionRecords = defaultPermissions.map(permission => ({
        employee_id: employee.id,
        permission,
        granted_by: caller.id,
      }));

      const { error: permError } = await supabaseAdmin
        .from('employee_permissions')
        .insert(permissionRecords);

      if (permError) {
        console.error('Error creating permissions:', permError);
        // Don't throw - permissions can be added later
      } else {
        console.log(`Applied ${defaultPermissions.length} default permissions`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        employee,
        generatedPassword,
        message: 'Funcionário criado com sucesso',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in create-employee-user:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erro interno do servidor',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
