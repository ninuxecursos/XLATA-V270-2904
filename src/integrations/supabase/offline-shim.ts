/**
 * Supabase Offline Shim
 * 
 * Imita a API pública do @supabase/supabase-js usada pelo XLata, redirecionando
 * todas as chamadas para um backend Express local (http://localhost:3939/api/...).
 * 
 * Ativado quando VITE_OFFLINE_BUILD === 'true' no momento do build (vite.config.offline.ts).
 * No build online normal, este arquivo é tree-shaken (não entra no bundle).
 */

type AuthChangeCallback = (event: string, session: any | null) => void;

const API_BASE = ''; // mesmo origin (Express serve dist + /api)

// ---------- HTTP helper ----------
async function api(path: string, init?: RequestInit): Promise<any> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  });
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const message = (data && (data.message || data.error)) || `HTTP ${res.status}`;
    return { ok: false, status: res.status, data: null, error: { message, code: String(res.status) } };
  }
  return { ok: true, status: res.status, data, error: null };
}

// ---------- AUTH ----------
const authListeners: AuthChangeCallback[] = [];
let cachedSession: any | null = null;

function emitAuth(event: string, session: any | null) {
  cachedSession = session;
  authListeners.forEach(cb => { try { cb(event, session); } catch {} });
}

const auth = {
  async signInWithPassword({ email, password }: { email: string; password: string }) {
    const r = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    if (!r.ok) return { data: { user: null, session: null }, error: r.error };
    emitAuth('SIGNED_IN', r.data.session);
    return { data: r.data, error: null };
  },
  async signUp(_args: any) {
    return { data: { user: null, session: null }, error: { message: 'Cadastro indisponível na versão offline. Use as credenciais fornecidas.' } };
  },
  async signOut() {
    await api('/api/auth/logout', { method: 'POST' });
    emitAuth('SIGNED_OUT', null);
    return { error: null };
  },
  async getSession() {
    const r = await api('/api/auth/session');
    cachedSession = r.ok ? r.data.session : null;
    return { data: { session: cachedSession }, error: null };
  },
  async getUser() {
    const r = await api('/api/auth/session');
    return { data: { user: r.ok ? r.data.user : null }, error: null };
  },
  onAuthStateChange(cb: AuthChangeCallback) {
    authListeners.push(cb);
    // Dispara imediatamente com a sessão atual (compat com supabase-js)
    setTimeout(() => cb(cachedSession ? 'INITIAL_SESSION' : 'SIGNED_OUT', cachedSession), 0);
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            const i = authListeners.indexOf(cb);
            if (i >= 0) authListeners.splice(i, 1);
          },
        },
      },
    };
  },
  async resetPasswordForEmail(_email: string) {
    return { data: null, error: { message: 'Recuperação de senha indisponível offline.' } };
  },
  async updateUser(_args: any) {
    return { data: { user: null }, error: { message: 'Atualização de usuário indisponível offline.' } };
  },
  async refreshSession() {
    return { data: { session: cachedSession, user: cachedSession?.user ?? null }, error: null };
  },
};

// ---------- QUERY BUILDER (.from) ----------
type Filter = { col: string; op: string; val: any };

class QueryBuilder {
  private table: string;
  private method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET';
  private filters: Filter[] = [];
  private selectCols = '*';
  private orderBy: { col: string; ascending: boolean }[] = [];
  private limitVal: number | null = null;
  private rangeVal: [number, number] | null = null;
  private body: any = null;
  private singleMode: 'single' | 'maybeSingle' | null = null;
  private countMode: string | null = null;
  private returnRepresentation = false;

  constructor(table: string) { this.table = table; }

  select(cols = '*', opts?: { count?: string; head?: boolean }) {
    this.selectCols = cols;
    if (opts?.count) this.countMode = opts.count;
    return this;
  }
  insert(values: any, opts?: { returning?: string }) {
    this.method = 'POST';
    this.body = Array.isArray(values) ? values : [values];
    this.returnRepresentation = opts?.returning !== 'minimal';
    return this;
  }
  upsert(values: any, opts?: any) {
    this.method = 'POST';
    this.body = Array.isArray(values) ? values : [values];
    this.returnRepresentation = true;
    (this as any)._upsert = true;
    (this as any)._onConflict = opts?.onConflict;
    return this;
  }
  update(values: any) {
    this.method = 'PATCH';
    this.body = values;
    this.returnRepresentation = true;
    return this;
  }
  delete() {
    this.method = 'DELETE';
    return this;
  }

  // Filtros
  eq(col: string, val: any) { this.filters.push({ col, op: 'eq', val }); return this; }
  neq(col: string, val: any) { this.filters.push({ col, op: 'neq', val }); return this; }
  gt(col: string, val: any) { this.filters.push({ col, op: 'gt', val }); return this; }
  gte(col: string, val: any) { this.filters.push({ col, op: 'gte', val }); return this; }
  lt(col: string, val: any) { this.filters.push({ col, op: 'lt', val }); return this; }
  lte(col: string, val: any) { this.filters.push({ col, op: 'lte', val }); return this; }
  like(col: string, val: string) { this.filters.push({ col, op: 'like', val }); return this; }
  ilike(col: string, val: string) { this.filters.push({ col, op: 'ilike', val }); return this; }
  is(col: string, val: any) { this.filters.push({ col, op: 'is', val }); return this; }
  in(col: string, vals: any[]) { this.filters.push({ col, op: 'in', val: vals }); return this; }
  contains(col: string, val: any) { this.filters.push({ col, op: 'cs', val }); return this; }
  not(col: string, op: string, val: any) { this.filters.push({ col, op: `not.${op}`, val }); return this; }
  or(_expr: string) { return this; } // simplificado: ignorado offline
  filter(col: string, op: string, val: any) { this.filters.push({ col, op, val }); return this; }
  match(obj: Record<string, any>) {
    Object.entries(obj).forEach(([k, v]) => this.filters.push({ col: k, op: 'eq', val: v }));
    return this;
  }

  order(col: string, opts?: { ascending?: boolean }) {
    this.orderBy.push({ col, ascending: opts?.ascending !== false });
    return this;
  }
  limit(n: number) { this.limitVal = n; return this; }
  range(from: number, to: number) { this.rangeVal = [from, to]; return this; }

  single() { this.singleMode = 'single'; return this; }
  maybeSingle() { this.singleMode = 'maybeSingle'; return this; }

  private buildQS(): string {
    const params = new URLSearchParams();
    params.set('select', this.selectCols);
    this.filters.forEach(f => {
      const val = Array.isArray(f.val) ? `(${f.val.join(',')})` : String(f.val);
      params.append(f.col, `${f.op}.${val}`);
    });
    if (this.orderBy.length) {
      params.set('order', this.orderBy.map(o => `${o.col}.${o.ascending ? 'asc' : 'desc'}`).join(','));
    }
    if (this.limitVal != null) params.set('limit', String(this.limitVal));
    if (this.rangeVal) {
      params.set('offset', String(this.rangeVal[0]));
      params.set('limit', String(this.rangeVal[1] - this.rangeVal[0] + 1));
    }
    if (this.countMode) params.set('count', this.countMode);
    if ((this as any)._upsert) params.set('upsert', '1');
    if ((this as any)._onConflict) params.set('on_conflict', (this as any)._onConflict);
    return params.toString();
  }

  async execute() {
    const qs = this.buildQS();
    const url = `/api/from/${this.table}?${qs}`;
    const init: RequestInit = { method: this.method };
    if (this.body !== null) init.body = JSON.stringify(this.body);
    const r = await api(url, init);
    if (!r.ok) return { data: null, error: r.error, count: null, status: r.status, statusText: '' };

    let data = r.data?.rows ?? r.data ?? [];
    const count = r.data?.count ?? null;

    if (this.singleMode === 'single') {
      if (!Array.isArray(data) || data.length !== 1) {
        return { data: null, error: { message: 'Single row not found', code: 'PGRST116' }, count, status: r.status, statusText: '' };
      }
      data = data[0];
    } else if (this.singleMode === 'maybeSingle') {
      data = Array.isArray(data) && data.length > 0 ? data[0] : null;
    }
    return { data, error: null, count, status: r.status, statusText: '' };
  }

  // Thenable: permite await direto sem .execute()
  then(onFulfilled?: any, onRejected?: any) {
    return this.execute().then(onFulfilled, onRejected);
  }
  catch(onRejected?: any) { return this.execute().catch(onRejected); }
  finally(cb?: any) { return this.execute().finally(cb); }
}

function from(table: string) {
  return new QueryBuilder(table);
}

// ---------- RPC ----------
async function rpc(fnName: string, args?: any) {
  const r = await api(`/api/rpc/${fnName}`, { method: 'POST', body: JSON.stringify(args || {}) });
  if (!r.ok) return { data: null, error: r.error };
  return { data: r.data, error: null };
}

// ---------- STORAGE (stub) ----------
const storage = {
  from(_bucket: string) {
    const offlineErr = { message: 'Storage indisponível na versão offline.' };
    return {
      upload: async () => ({ data: null, error: offlineErr }),
      download: async () => ({ data: null, error: offlineErr }),
      remove: async () => ({ data: null, error: offlineErr }),
      list: async () => ({ data: [], error: null }),
      getPublicUrl: (path: string) => ({ data: { publicUrl: `/uploads/${path}` } }),
      createSignedUrl: async () => ({ data: null, error: offlineErr }),
    };
  },
};

// ---------- REALTIME (no-op) ----------
function channel(_name: string) {
  const ch: any = {
    on: () => ch,
    subscribe: (cb?: any) => { setTimeout(() => cb && cb('SUBSCRIBED'), 0); return ch; },
    unsubscribe: async () => 'ok',
    send: () => Promise.resolve({}),
    track: () => Promise.resolve({}),
  };
  return ch;
}
function removeChannel(_ch: any) { return Promise.resolve('ok'); }
function removeAllChannels() { return Promise.resolve('ok'); }
function getChannels() { return []; }

// ---------- FUNCTIONS (Edge Functions stub) ----------
const functions = {
  async invoke(name: string, _opts?: any) {
    return {
      data: null,
      error: { message: `Função "${name}" indisponível na versão offline.` },
    };
  },
};

// ---------- FACTORY ----------
export function createOfflineShim() {
  // Inicializa sessão em background
  api('/api/auth/session').then(r => {
    if (r.ok && r.data?.session) {
      cachedSession = r.data.session;
      emitAuth('INITIAL_SESSION', cachedSession);
    }
  }).catch(() => {});

  return {
    auth,
    from,
    rpc,
    storage,
    channel,
    removeChannel,
    removeAllChannels,
    getChannels,
    functions,
  } as any;
}
