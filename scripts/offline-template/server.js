/**
 * XLata PDV Offline — Servidor local (MODO DIRETO, sem login)
 * Express + sql.js (SQLite WASM, zero compilação nativa)
 *
 * Endpoints:
 *   GET  /                       → serve dist/ (build offline do React XLata)
 *   GET  /api/auth/session       → SEMPRE retorna owner derivado de license/credentials
 *   POST /api/auth/login         → no-op (compat); retorna owner
 *   POST /api/auth/logout        → no-op (compat)
 *   GET  /api/license            → retorna licença local (plan, expires_at, valid)
 *   GET    /api/from/:table      → SELECT com filtros PostgREST
 *   POST   /api/from/:table      → INSERT (single ou array)
 *   PATCH  /api/from/:table      → UPDATE com filtros
 *   DELETE /api/from/:table      → DELETE com filtros
 *   POST /api/rpc/:fn            → chama função registrada (RPC offline)
 */

const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const initSqlJs = require('sql.js');

const PORT = process.env.PORT || 3939;
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const DB_PATH = path.join(DATA_DIR, 'xlata.db');
const LOG_PATH = path.join(ROOT, 'start.log');
const LICENSE_PATH = path.join(ROOT, 'license.json');
const CREDENTIALS_PATH = path.join(ROOT, 'credentials.json');
const DIST_DIR = path.join(ROOT, 'dist');
const UPLOADS_DIR = path.join(ROOT, 'public', 'uploads');

// ---------- Logging ----------
function log(...args) {
  const line = `[${new Date().toISOString()}] ${args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ')}`;
  console.log(line);
  try { fs.appendFileSync(LOG_PATH, line + '\n'); } catch {}
}

process.on('uncaughtException', err => log('UNCAUGHT EXCEPTION:', err.stack || err.message));
process.on('unhandledRejection', err => log('UNHANDLED REJECTION:', err && (err.stack || err.message || err)));

// ---------- Setup ----------
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// ---------- DB layer ----------
let SQL = null;
let db = null;
let pendingSave = null;

function scheduleSave() {
  if (pendingSave) clearTimeout(pendingSave);
  pendingSave = setTimeout(() => {
    try {
      const data = Buffer.from(db.export());
      fs.writeFileSync(DB_PATH, data);
    } catch (e) { log('DB save error:', e.message); }
  }, 1000);
}

function dbExec(sql) { db.exec(sql); }
function dbAll(sql, params = []) {
  const stmt = db.prepare(sql);
  try { stmt.bind(params); const rows = []; while (stmt.step()) rows.push(stmt.getAsObject()); return rows; }
  finally { stmt.free(); }
}
function dbRun(sql, params = []) {
  const stmt = db.prepare(sql);
  try { stmt.bind(params); stmt.step(); }
  finally { stmt.free(); }
  scheduleSave();
}

// ---------- Schema ----------
const SCHEMA = `
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY, name TEXT, email TEXT, company TEXT, company_name TEXT, logo_url TEXT,
  phone TEXT, whatsapp TEXT, address TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS user_roles (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, role TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS material_categories (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, name TEXT NOT NULL,
  color TEXT DEFAULT 'gray', hex_color TEXT, display_order INTEGER DEFAULT 0,
  is_system INTEGER DEFAULT 0, is_required INTEGER DEFAULT 0, is_active INTEGER DEFAULT 1,
  system_key TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS materials (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, name TEXT NOT NULL,
  price REAL DEFAULT 0, sale_price REAL DEFAULT 0, unit TEXT DEFAULT 'kg',
  category_id TEXT, is_default INTEGER DEFAULT 0,
  previous_price REAL, previous_sale_price REAL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS material_price_history (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, material_id TEXT NOT NULL,
  material_name TEXT, old_price REAL, old_sale_price REAL,
  new_price REAL NOT NULL, new_sale_price REAL NOT NULL,
  change_type TEXT DEFAULT 'manual', changed_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, name TEXT NOT NULL,
  phone TEXT, email TEXT, document TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, customer_id TEXT,
  type TEXT DEFAULT 'venda', total REAL DEFAULT 0,
  status TEXT DEFAULT 'completed', payment_method TEXT DEFAULT 'dinheiro',
  cancelled INTEGER DEFAULT 0, cancelled_at TEXT, cancelled_by TEXT,
  cancellation_reason TEXT, refund_amount REAL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP, timestamp INTEGER
);
CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY, order_id TEXT NOT NULL, user_id TEXT,
  material_id TEXT,
  material_name TEXT NOT NULL, quantity REAL NOT NULL, price REAL NOT NULL,
  total REAL NOT NULL, tara REAL DEFAULT 0,
  original_price REAL, price_adjustment REAL, cost_price REAL,
  linked_stock_quantity REAL, linked_material_name TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS cash_registers (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL,
  initial_amount REAL DEFAULT 0, current_amount REAL DEFAULT 0, final_amount REAL,
  status TEXT DEFAULT 'open',
  opening_timestamp INTEGER, closing_timestamp INTEGER,
  user_name TEXT, user_email TEXT,
  gross_profit REAL, net_profit REAL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS cash_transactions (
  id TEXT PRIMARY KEY, cash_register_id TEXT NOT NULL, user_id TEXT NOT NULL,
  type TEXT NOT NULL, amount REAL NOT NULL, description TEXT,
  order_id TEXT, timestamp INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, cash_register_id TEXT,
  amount REAL NOT NULL, description TEXT, category TEXT,
  timestamp INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, name TEXT NOT NULL,
  email TEXT, password_hash TEXT, role TEXT DEFAULT 'employee',
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS employee_sessions (
  id TEXT PRIMARY KEY, employee_id TEXT NOT NULL,
  last_heartbeat INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS user_material_settings (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL UNIQUE,
  use_categories INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Tabelas extras p/ configuração offline (logo, comprovantes, planos, mensagens)
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL,
  plan_type TEXT DEFAULT 'pro', tier TEXT DEFAULT 'pro',
  is_active INTEGER DEFAULT 1, expires_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS depot_employees (
  id TEXT PRIMARY KEY, owner_user_id TEXT NOT NULL, employee_user_id TEXT,
  role TEXT DEFAULT 'employee', is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS system_settings (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL,
  logo TEXT, whatsapp1 TEXT, whatsapp2 TEXT, address TEXT, company TEXT,
  seo_config TEXT,
  key TEXT, value TEXT, settings TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS receipt_format_settings (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL,
  format TEXT DEFAULT '80mm', font_family TEXT DEFAULT 'monospace',
  container_width TEXT, padding TEXT, margins TEXT,
  logo_max_width TEXT, logo_max_height TEXT,
  title_font_size TEXT, customer_font_size TEXT, address_font_size TEXT,
  phone_font_size TEXT, datetime_font_size TEXT, table_font_size TEXT,
  totals_font_size TEXT, final_total_font_size TEXT, quote_font_size TEXT,
  header_text TEXT, footer_text TEXT, logo_url TEXT,
  show_logo INTEGER DEFAULT 1, show_address INTEGER DEFAULT 1,
  show_phone INTEGER DEFAULT 1, paper_width INTEGER DEFAULT 80,
  font_size INTEGER DEFAULT 12, settings TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS global_notifications (
  id TEXT PRIMARY KEY, title TEXT, message TEXT, sender_name TEXT,
  is_active INTEGER DEFAULT 1, expires_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS global_notification_recipients (
  id TEXT PRIMARY KEY, notification_id TEXT NOT NULL, user_id TEXT NOT NULL,
  read_at TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS user_direct_messages (
  id TEXT PRIMARY KEY, recipient_id TEXT NOT NULL,
  title TEXT, message TEXT, sender_name TEXT, read_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_materials_user ON materials(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_created ON orders(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_user ON order_items(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_user ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_cash_tx_register ON cash_transactions(cash_register_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_subs_user ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_sys_settings_user ON system_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_receipt_user ON receipt_format_settings(user_id);
`;

// Embeds PostgREST filhos: tabela_filha → coluna FK na FILHA que aponta pro pai
const EMBED_FK = {
  order_items: 'order_id',
  cash_transactions: 'cash_register_id',
};

// Embeds PostgREST pais: tabela_pai → coluna FK na linha CORRENTE que aponta pro pai
// Ex.: orders.customer_id → customers.id  (select="customers (id, name)" em orders)
const PARENT_EMBED_FK = {
  customers: 'customer_id',
  cash_registers: 'cash_register_id',
  orders: 'order_id',
  materials: 'material_id',
  profiles: 'user_id',
};

// Parser de "*, order_items (*), customers (id, name), orders!inner(type, status)" →
//   { mainSelect, embeds: [{kind:'child'|'parent', table, select, fk, inner}] }
function parseSelectWithEmbeds(select) {
  const embeds = [];
  let mainParts = [];
  let depth = 0, current = '';
  const tokens = [];
  for (let i = 0; i < select.length; i++) {
    const ch = select[i];
    if (ch === '(') { depth++; current += ch; }
    else if (ch === ')') { depth--; current += ch; }
    else if (ch === ',' && depth === 0) {
      if (current.trim()) tokens.push(current.trim());
      current = '';
    } else current += ch;
  }
  if (current.trim()) tokens.push(current.trim());

  const extraSelectCols = new Set();
  for (const tok of tokens) {
    // Aceita "table(...)" e "table!inner(...)" / "table!left(...)"
    const m = tok.match(/^([a-z_][a-z0-9_]*)(?:!(\w+))?\s*\(([^)]*)\)$/i);
    if (m) {
      const tbl = m[1];
      const join = (m[2] || '').toLowerCase();
      const sel = m[3].trim() || '*';
      const inner = join === 'inner';
      if (EMBED_FK[tbl]) {
        embeds.push({ kind: 'child', table: tbl, select: sel, fk: EMBED_FK[tbl], inner });
        continue;
      }
      if (PARENT_EMBED_FK[tbl]) {
        const fk = PARENT_EMBED_FK[tbl];
        embeds.push({ kind: 'parent', table: tbl, select: sel, fk, inner });
        extraSelectCols.add(fk);
        continue;
      }
    }
    mainParts.push(tok);
  }
  if (mainParts.length === 0) mainParts = ['*'];
  // Se mainSelect não usar '*', garante que a FK do parent embed esteja no SELECT
  if (!mainParts.includes('*')) {
    extraSelectCols.forEach(c => { if (!mainParts.includes(c)) mainParts.push(c); });
  }
  return { mainSelect: mainParts.join(', '), embeds };
}

// Coerce values vindos da query string (sempre string) para o tipo SQLite esperado
function coerceParam(val) {
  if (val === 'true') return 1;
  if (val === 'false') return 0;
  if (val === 'null') return null;
  return val;
}

// ---------- Helpers ----------
function readJSON(p, fallback = {}) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return fallback; }
}

// MODO DIRETO: owner fixo derivado de license.json + credentials.json
function getOwner() {
  const creds = readJSON(CREDENTIALS_PATH, {});
  const lic = readJSON(LICENSE_PATH, {});
  const id = creds.user_id || 'offline-owner';
  const name = creds.name || lic.client_name || 'Administrador';
  const email = creds.email || 'owner@local';
  return { id, sub: id, email, name };
}

// ---------- PostgREST → SQL translator ----------
const OPS = {
  eq: '=', neq: '!=', gt: '>', gte: '>=', lt: '<', lte: '<=',
  like: 'LIKE', ilike: 'LIKE', is: 'IS',
};

function buildWhere(query, reservedKeys) {
  const where = [];
  const params = [];
  // Filtros em relações embutidas (ex.: "orders.status=eq.completed") — aplicados em pós-processamento
  const embedFilters = []; // [{ table, col, op, val }]
  for (const [key, raw] of Object.entries(query)) {
    if (reservedKeys.has(key)) continue;
    const values = Array.isArray(raw) ? raw : [raw];
    for (const v of values) {
      const dotIdx = String(v).indexOf('.');
      if (dotIdx < 0) continue;
      const op = String(v).slice(0, dotIdx);
      const val = String(v).slice(dotIdx + 1);

      // Filtro embed (ex.: orders.status, customers.name) — separa pra pós-processar
      if (key.includes('.')) {
        const [tbl, col] = key.split('.');
        embedFilters.push({ table: tbl, col, op, val });
        continue;
      }

      if (op === 'in') {
        const list = val.replace(/^\(|\)$/g, '').split(',').map(s => s.trim());
        if (list.length === 0) { where.push('0=1'); continue; }
        where.push(`${key} IN (${list.map(() => '?').join(',')})`);
        list.forEach(x => params.push(coerceParam(x)));
      } else if (op === 'is') {
        if (val === 'null') where.push(`${key} IS NULL`);
        else if (val === 'not.null') where.push(`${key} IS NOT NULL`);
        else { where.push(`${key} IS ?`); params.push(coerceParam(val)); }
      } else if (OPS[op]) {
        where.push(`${key} ${OPS[op]} ?`);
        params.push(op === 'ilike' ? val.toLowerCase() : coerceParam(val));
      }
    }
  }
  return { where, params, embedFilters };
}

// Avalia um filtro embed contra um valor já carregado da row do parent/child
function matchEmbedFilter(actual, op, expected) {
  // Coerce expected do query string ao tipo do banco
  const exp = coerceParam(expected);
  switch (op) {
    case 'eq':  return actual == exp;
    case 'neq': return actual != exp;
    case 'gt':  return Number(actual) >  Number(exp);
    case 'gte': return Number(actual) >= Number(exp);
    case 'lt':  return Number(actual) <  Number(exp);
    case 'lte': return Number(actual) <= Number(exp);
    case 'like':  return String(actual ?? '').includes(String(expected).replace(/%/g, ''));
    case 'ilike': return String(actual ?? '').toLowerCase().includes(String(expected).toLowerCase().replace(/%/g, ''));
    case 'is':
      if (expected === 'null') return actual == null;
      if (expected === 'not.null') return actual != null;
      return actual == exp;
    default: return true;
  }
}

const RESERVED = new Set(['select', 'order', 'limit', 'offset', 'count', 'upsert', 'on_conflict']);

function camelToSnake(o) {
  if (!o || typeof o !== 'object') return o;
  const out = {};
  for (const [k, v] of Object.entries(o)) {
    const sk = k.replace(/([A-Z])/g, '_$1').toLowerCase();
    out[sk] = v;
  }
  return out;
}

// ---------- App ----------
const app = express();
app.use(express.json({ limit: '20mb' }));
app.use(cookieParser());

app.use((req, _res, next) => {
  if (req.url.startsWith('/api/')) {
    log(`→ ${req.method} ${req.url.length > 200 ? req.url.slice(0, 200) + '...' : req.url}`);
  }
  next();
});

// MODO DIRETO: todo request tem owner como user
app.use((req, _res, next) => {
  req.user = getOwner();
  next();
});

function tableExists(name) {
  const r = dbAll("SELECT name FROM sqlite_master WHERE type='table' AND name = ?", [name]);
  return r.length > 0;
}

// ---------- Auth routes (compat: sempre owner) ----------
app.get('/api/auth/session', (_req, res) => {
  const user = getOwner();
  res.json({
    user,
    session: { user, access_token: 'offline-direct', token_type: 'bearer' },
  });
});

// Valida senha contra credentials.json (password_hash em SHA-256 hex)
// Se o credentials.json não tiver password_hash (compat antiga), aceita qualquer senha.
app.post('/api/auth/login', (req, res) => {
  const owner = getOwner();
  const creds = readJSON(CREDENTIALS_PATH, {});
  const expectedHash = (creds.password_hash || '').toLowerCase();
  const inputPassword = String((req.body && req.body.password) || '');

  if (expectedHash) {
    const inputHash = crypto.createHash('sha256').update(inputPassword).digest('hex');
    if (inputHash !== expectedHash) {
      log('  ↳ login negado: senha incorreta');
      return res.status(400).json({
        error: 'Invalid login credentials',
        message: 'Email ou senha incorretos',
        code: 'invalid_credentials',
      });
    }
  }
  res.json({ user: owner, session: { user: owner, access_token: 'offline-direct', token_type: 'bearer' } });
});

app.post('/api/auth/logout', (_req, res) => res.json({ ok: true }));

// ---------- License ----------
app.get('/api/license', (_req, res) => {
  const lic = readJSON(LICENSE_PATH, { plan: 'essencial', expires_at: null, client_name: 'Cliente' });
  const valid = !lic.expires_at || new Date(lic.expires_at).getTime() > Date.now();
  res.json({ ...lic, valid });
});

// ---------- Generic data routes ----------
app.get('/api/from/:table', (req, res) => {
  try {
    const table = req.params.table;
    if (!tableExists(table)) {
      log(`  ↳ tabela "${table}" não existe — retornando vazio`);
      return res.json({ rows: [], count: 0 });
    }
    const rawSelect = String(req.query.select || '*').replace(/\s+/g, ' ').trim();
    const { mainSelect, embeds } = parseSelectWithEmbeds(rawSelect);
    const order = req.query.order;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : null;
    const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0;
    const { where, params, embedFilters } = buildWhere(req.query, RESERVED);

    let sql = `SELECT ${mainSelect === '*' ? '*' : mainSelect} FROM ${table}`;
    if (where.length) sql += ' WHERE ' + where.join(' AND ');
    if (order) {
      const parts = String(order).split(',').map(p => {
        const [col, dir] = p.split('.');
        return `${col} ${dir === 'desc' ? 'DESC' : 'ASC'}`;
      });
      sql += ' ORDER BY ' + parts.join(', ');
    }
    // OBS: aplicamos LIMIT/OFFSET DEPOIS dos filtros de embed,
    // senão um SELECT limitado removeria linhas antes do pós-processamento
    const hasEmbedFilters = embedFilters.length > 0;
    const hasInnerEmbed = embeds.some(e => e.inner);
    if (limit != null && !hasEmbedFilters && !hasInnerEmbed) {
      sql += ` LIMIT ${limit} OFFSET ${offset}`;
    }

    let rows = dbAll(sql, params);

    // Resolve embeds (segundo passe)
    for (const emb of embeds) {
      const kind = emb.kind || 'child';
      if (!tableExists(emb.table) || rows.length === 0) {
        rows.forEach(r => { r[emb.table] = kind === 'parent' ? null : []; });
        continue;
      }

      if (kind === 'parent') {
        // Embed pai: cada row tem r[emb.fk] que aponta pra emb.table.id
        const parentIds = [...new Set(rows.map(r => r[emb.fk]).filter(Boolean))];
        if (parentIds.length === 0) {
          rows.forEach(r => { r[emb.table] = null; });
          continue;
        }
        const placeholders = parentIds.map(() => '?').join(',');
        const parentSelect = emb.select === '*' ? '*' : emb.select;
        // Garante que id esteja no select pra correlacionar (e que as colunas dos embedFilters venham)
        const filterCols = embedFilters.filter(f => f.table === emb.table).map(f => f.col);
        let selWithId = parentSelect;
        if (parentSelect !== '*') {
          const cols = new Set(parentSelect.split(',').map(s => s.trim()));
          cols.add('id');
          filterCols.forEach(c => cols.add(c));
          selWithId = [...cols].join(', ');
        }
        const parentRows = dbAll(
          `SELECT ${selWithId} FROM ${emb.table} WHERE id IN (${placeholders})`,
          parentIds
        );
        const byId = {};
        parentRows.forEach(p => { byId[p.id] = p; });
        rows.forEach(r => { r[emb.table] = byId[r[emb.fk]] || null; });
        continue;
      }

      // Embed filho (default)
      const ids = [...new Set(rows.map(r => r.id).filter(Boolean))];
      if (ids.length === 0) {
        rows.forEach(r => { r[emb.table] = []; });
        continue;
      }
      const placeholders = ids.map(() => '?').join(',');
      const childSelect = emb.select === '*' ? '*' : emb.select;
      // Garante que a FK esteja no SELECT pra correlacionar com a row pai
      const selCols = childSelect.split(',').map(s => s.trim());
      const selWithFk = childSelect === '*' || selCols.includes(emb.fk)
        ? childSelect
        : `${emb.fk}, ${childSelect}`;
      const childRows = dbAll(
        `SELECT ${selWithFk} FROM ${emb.table} WHERE ${emb.fk} IN (${placeholders})`,
        ids
      );
      const grouped = {};
      childRows.forEach(c => {
        const key = c[emb.fk];
        (grouped[key] = grouped[key] || []).push(c);
      });
      rows.forEach(r => { r[emb.table] = grouped[r.id] || []; });
    }

    // Pós-filtragem: aplica filtros em colunas de relações embutidas (ex.: orders.status=eq.completed)
    // E remove linhas cujo embed !inner não tenha pai ou tenha sido reprovado pelo filtro.
    if (embedFilters.length > 0 || hasInnerEmbed) {
      rows = rows.filter(r => {
        for (const emb of embeds) {
          const data = r[emb.table];
          const fs = embedFilters.filter(f => f.table === emb.table);
          if (emb.kind === 'parent') {
            if (emb.inner && (data == null)) return false;
            if (fs.length > 0) {
              if (data == null) return false;
              for (const f of fs) {
                if (!matchEmbedFilter(data[f.col], f.op, f.val)) return false;
              }
            }
          } else {
            // Embed filho: filtro vira "EXISTS algum filho que satisfaz"
            if (fs.length > 0) {
              const arr = Array.isArray(data) ? data : [];
              const ok = arr.some(c => fs.every(f => matchEmbedFilter(c[f.col], f.op, f.val)));
              if (!ok) return false;
            } else if (emb.inner) {
              if (!Array.isArray(data) || data.length === 0) return false;
            }
          }
        }
        return true;
      });

      // Aplica limit/offset depois do pós-filtro
      if (limit != null) {
        rows = rows.slice(offset, offset + limit);
      }
    }

    let count = null;
    if (req.query.count) {
      const cSql = `SELECT COUNT(*) as c FROM ${table}` + (where.length ? ' WHERE ' + where.join(' AND ') : '');
      count = dbAll(cSql, params)[0]?.c || 0;
    }
    res.json({ rows, count });
  } catch (e) {
    log('GET error:', e.message);
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/from/:table', (req, res) => {
  try {
    const table = req.params.table;
    if (!tableExists(table)) {
      return res.json({ rows: Array.isArray(req.body) ? req.body : [req.body] });
    }
    const rows = Array.isArray(req.body) ? req.body : [req.body];
    const upsert = req.query.upsert === '1';
    // on_conflict pode vir como "user_id" ou "user_id,key" — usa para localizar registro existente
    const onConflict = req.query.on_conflict
      ? String(req.query.on_conflict).split(',').map(s => s.trim()).filter(Boolean)
      : [];
    const inserted = [];
    for (const raw of rows) {
      const row = camelToSnake(raw);

      // Upsert por colunas conflitantes (ex: user_id em system_settings)
      if (upsert && onConflict.length > 0) {
        const allHaveValues = onConflict.every(c => row[c] !== undefined && row[c] !== null);
        if (allHaveValues) {
          const whereParts = onConflict.map(c => `${c} = ?`);
          const whereVals = onConflict.map(c => row[c]);
          const existing = dbAll(
            `SELECT id FROM ${table} WHERE ${whereParts.join(' AND ')} LIMIT 1`,
            whereVals
          );
          if (existing.length > 0) {
            // UPDATE em vez de INSERT — preserva o id já gravado
            row.id = existing[0].id;
            const updateCols = Object.keys(row).filter(c => c !== 'id');
            if (updateCols.length > 0) {
              const sets = updateCols.map(c => `${c} = ?`).join(', ');
              const updateVals = updateCols.map(c => {
                const v = row[c];
                if (v === undefined || v === null) return null;
                if (typeof v === 'object') return JSON.stringify(v);
                if (typeof v === 'boolean') return v ? 1 : 0;
                return v;
              });
              dbRun(`UPDATE ${table} SET ${sets} WHERE id = ?`, [...updateVals, row.id]);
            }
            const got = dbAll(`SELECT * FROM ${table} WHERE id = ?`, [row.id])[0];
            if (got) inserted.push(got);
            continue;
          }
        }
      }

      if (!row.id) row.id = crypto.randomUUID();
      const cols = Object.keys(row);
      const placeholders = cols.map(() => '?').join(',');
      const values = cols.map(c => {
        const v = row[c];
        if (v === undefined || v === null) return null;
        if (typeof v === 'object') return JSON.stringify(v);
        if (typeof v === 'boolean') return v ? 1 : 0;
        return v;
      });
      const verb = upsert ? 'INSERT OR REPLACE' : 'INSERT';
      dbRun(`${verb} INTO ${table} (${cols.join(',')}) VALUES (${placeholders})`, values);
      const got = dbAll(`SELECT * FROM ${table} WHERE id = ?`, [row.id])[0];
      if (got) inserted.push(got);
    }
    res.json({ rows: inserted });
  } catch (e) {
    log('POST error:', e.message);
    res.status(400).json({ error: e.message });
  }
});

app.patch('/api/from/:table', (req, res) => {
  try {
    const table = req.params.table;
    if (!tableExists(table)) return res.json({ rows: [] });
    const row = camelToSnake(req.body);
    const { where, params } = buildWhere(req.query, RESERVED);
    if (!where.length) return res.status(400).json({ error: 'PATCH exige filtros' });
    const cols = Object.keys(row);
    const sets = cols.map(c => `${c} = ?`).join(', ');
    const values = cols.map(c => {
      const v = row[c];
      if (v === undefined || v === null) return null;
      if (typeof v === 'object') return JSON.stringify(v);
      if (typeof v === 'boolean') return v ? 1 : 0;
      return v;
    });
    dbRun(`UPDATE ${table} SET ${sets} WHERE ${where.join(' AND ')}`, [...values, ...params]);
    const updated = dbAll(`SELECT * FROM ${table} WHERE ${where.join(' AND ')}`, params);
    res.json({ rows: updated });
  } catch (e) {
    log('PATCH error:', e.message);
    res.status(400).json({ error: e.message });
  }
});

app.delete('/api/from/:table', (req, res) => {
  try {
    const table = req.params.table;
    if (!tableExists(table)) return res.json({ rows: [] });
    const { where, params } = buildWhere(req.query, RESERVED);
    if (!where.length) return res.status(400).json({ error: 'DELETE exige filtros' });
    const before = dbAll(`SELECT * FROM ${table} WHERE ${where.join(' AND ')}`, params);
    dbRun(`DELETE FROM ${table} WHERE ${where.join(' AND ')}`, params);
    res.json({ rows: before });
  } catch (e) {
    log('DELETE error:', e.message);
    res.status(400).json({ error: e.message });
  }
});

// ---------- RPC ----------
const RPCS = {
  // Auth/role
  is_admin() { return true; },
  has_role() { return true; },
  validate_subscription_access() { return true; },

  // Materiais
  get_user_material_settings(_args, user) {
    const rows = dbAll('SELECT * FROM user_material_settings WHERE user_id = ?', [user.sub]);
    return rows[0] || { user_id: user.sub, use_categories: 0 };
  },
  get_user_materials(args, user) {
    const target = args.target_user_id || user.sub;
    return dbAll('SELECT * FROM materials WHERE user_id = ? ORDER BY name ASC', [target]);
  },
  get_stock_summary(_args, user) {
    const materials = dbAll('SELECT * FROM materials WHERE user_id = ?', [user.sub]);
    return { total_materials: materials.length, total_stock_value: 0 };
  },

  get_user_orders(args, user) {
    const target = args.target_user_id || user.sub;
    const orders = dbAll('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [target]);
    return orders.map(o => {
      const items = dbAll('SELECT * FROM order_items WHERE order_id = ?', [o.id]);
      return { ...o, items };
    });
  },

  get_user_profile(_args, user) {
    const rows = dbAll('SELECT * FROM profiles WHERE id = ?', [user.sub]);
    return rows[0] || { id: user.sub, name: user.name || 'Admin', email: user.email };
  },

  get_active_employee_sessions(_args, user) {
    return dbAll('SELECT * FROM employee_sessions WHERE employee_id IN (SELECT id FROM employees WHERE user_id = ?)', [user.sub]);
  },

  log_action() { return null; },
  track_event() { return null; },
  get_admin_stats() { return { users: 1, orders: 0, revenue: 0 }; },

  // Cash register
  get_user_active_cash_register(args, user) {
    const target = args.target_user_id || user.sub;
    const rows = dbAll(
      "SELECT * FROM cash_registers WHERE user_id = ? AND status = 'open' ORDER BY created_at DESC LIMIT 1",
      [target]
    );
    if (rows.length === 0) return null;
    const reg = rows[0];
    reg.cash_transactions = dbAll(
      'SELECT * FROM cash_transactions WHERE cash_register_id = ? ORDER BY created_at ASC',
      [reg.id]
    );
    return reg;
  },
  open_cash_register(args, user) {
    const initial = Number(args.initial_amount || args.p_initial_amount || 0);
    // Fecha registros abertos anteriores
    dbRun(
      "UPDATE cash_registers SET status = 'closed', closing_timestamp = ? WHERE user_id = ? AND status = 'open'",
      [Date.now(), user.sub]
    );
    const id = crypto.randomUUID();
    dbRun(
      'INSERT INTO cash_registers (id, user_id, initial_amount, current_amount, status, opening_timestamp) VALUES (?, ?, ?, ?, ?, ?)',
      [id, user.sub, initial, initial, 'open', Date.now()]
    );
    dbRun(
      'INSERT INTO cash_transactions (id, cash_register_id, user_id, type, amount, description, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [crypto.randomUUID(), id, user.sub, 'opening', initial, 'Abertura de caixa', Date.now()]
    );
    return dbAll('SELECT * FROM cash_registers WHERE id = ?', [id])[0];
  },

  // PDV access control (modo offline: sempre permitido, sem limite real)
  register_pdv_session(_args, user) {
    const id = crypto.randomUUID();
    return {
      allowed: true,
      session_id: id,
      active_sessions: 1,
      max_slots: 99,
      message: null,
    };
  },
  heartbeat_pdv_session() { return { ok: true }; },
  release_pdv_session() { return { ok: true }; },
  check_employee_work_hours() { return { allowed: true, message: null }; },

  // Materiais — semear categorias E materiais padrão (igual ao online)
  seed_default_categories_for_current_user(_args, user) {
    const defaultCategories = [
      { name: 'Ferro', color: 'red', hex_color: '#dc2626', system_key: 'ferro', display_order: 1 },
      { name: 'Cobre', color: 'orange', hex_color: '#ea580c', system_key: 'cobre', display_order: 2 },
      { name: 'Alumínio', color: 'gray', hex_color: '#6b7280', system_key: 'aluminio', display_order: 3 },
      { name: 'Inox', color: 'blue', hex_color: '#2563eb', system_key: 'inox', display_order: 4 },
      { name: 'Latão', color: 'yellow', hex_color: '#ca8a04', system_key: 'latao', display_order: 5 },
      { name: 'Outros', color: 'slate', hex_color: '#475569', system_key: 'outros', display_order: 6 },
    ];

    // Materiais padrão por categoria (system_key) — preços de referência
    const defaultMaterials = [
      { category: 'ferro',     name: 'Ferro Misto',       price: 0.50, sale_price: 0.80 },
      { category: 'ferro',     name: 'Ferro Pesado',      price: 0.70, sale_price: 1.00 },
      { category: 'cobre',     name: 'Cobre Misto',       price: 30.00, sale_price: 38.00 },
      { category: 'cobre',     name: 'Cobre Vermelho',    price: 38.00, sale_price: 48.00 },
      { category: 'aluminio',  name: 'Alumínio Latinha',  price: 5.00,  sale_price: 7.00 },
      { category: 'aluminio',  name: 'Alumínio Perfil',   price: 7.00,  sale_price: 9.00 },
      { category: 'inox',      name: 'Inox 304',          price: 5.50,  sale_price: 7.50 },
      { category: 'latao',     name: 'Latão',             price: 12.00, sale_price: 16.00 },
      { category: 'outros',    name: 'Bateria de Chumbo', price: 3.50,  sale_price: 4.50 },
    ];

    // 1) Cria categorias que faltam, mapeando system_key → id final
    const existingCats = dbAll(
      'SELECT id, system_key FROM material_categories WHERE user_id = ?',
      [user.sub]
    );
    const catBySystemKey = {};
    existingCats.forEach(c => { if (c.system_key) catBySystemKey[c.system_key] = c.id; });

    let categoriesCreated = 0;
    for (const cat of defaultCategories) {
      if (catBySystemKey[cat.system_key]) continue;
      const id = crypto.randomUUID();
      dbRun(
        `INSERT INTO material_categories
         (id, user_id, name, color, hex_color, display_order, is_system, is_required, is_active, system_key)
         VALUES (?, ?, ?, ?, ?, ?, 1, 0, 1, ?)`,
        [id, user.sub, cat.name, cat.color, cat.hex_color, cat.display_order, cat.system_key]
      );
      catBySystemKey[cat.system_key] = id;
      categoriesCreated++;
    }

    // 2) Cria materiais que faltam (dedup por nome)
    const existingMats = dbAll(
      'SELECT name FROM materials WHERE user_id = ?',
      [user.sub]
    );
    const existingNames = new Set(
      existingMats.map(m => String(m.name || '').trim().toLowerCase())
    );
    let materialsCreated = 0;
    for (const m of defaultMaterials) {
      if (existingNames.has(m.name.toLowerCase())) continue;
      dbRun(
        `INSERT INTO materials
         (id, user_id, name, price, sale_price, unit, category_id, is_default)
         VALUES (?, ?, ?, ?, ?, 'kg', ?, 1)`,
        [crypto.randomUUID(), user.sub, m.name, m.price, m.sale_price, catBySystemKey[m.category] || null]
      );
      materialsCreated++;
    }

    // 3) Ativa uso de categorias
    const settingsExists = dbAll('SELECT id FROM user_material_settings WHERE user_id = ?', [user.sub]);
    if (settingsExists.length === 0) {
      dbRun(
        'INSERT INTO user_material_settings (id, user_id, use_categories) VALUES (?, ?, ?)',
        [crypto.randomUUID(), user.sub, 1]
      );
    } else {
      dbRun('UPDATE user_material_settings SET use_categories = 1 WHERE user_id = ?', [user.sub]);
    }

    return {
      success: true,
      categories_created: categoriesCreated,
      materials_created: materialsCreated,
    };
  },
};

app.post('/api/rpc/:fn', (req, res) => {
  const fn = RPCS[req.params.fn];
  if (!fn) {
    log('Unknown RPC called:', req.params.fn);
    return res.json(null);
  }
  try {
    const result = fn(req.body || {}, req.user);
    res.json(result);
  } catch (e) {
    log('RPC error:', req.params.fn, e.message);
    res.status(400).json({ error: e.message });
  }
});

// ---------- Static files ----------
app.use('/uploads', express.static(UPLOADS_DIR));
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get(/^(?!\/api\/).*/, (_req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
} else {
  app.get('/', (_req, res) => {
    res.send(`<h1>XLata PDV Offline</h1><p>Pasta <code>dist/</code> não encontrada. Reextraia o .zip.</p>`);
  });
}

// ---------- Boot ----------
async function boot() {
  log('Iniciando XLata PDV Offline (modo direto, sem login)...');
  log('Carregando engine SQL (sql.js / WASM)...');
  SQL = await initSqlJs({
    locateFile: f => path.join(__dirname, 'node_modules', 'sql.js', 'dist', f),
  });
  if (fs.existsSync(DB_PATH)) {
    log('Abrindo banco existente:', DB_PATH);
    db = new SQL.Database(fs.readFileSync(DB_PATH));
  } else {
    log('Criando novo banco em:', DB_PATH);
    db = new SQL.Database();
  }
  dbExec(SCHEMA);

  // Migração idempotente: adiciona colunas que possam faltar em DBs criados em versões antigas
  function ensureColumns(table, columns) {
    try {
      const existing = dbAll(`PRAGMA table_info(${table})`).map(r => r.name);
      for (const [col, def] of columns) {
        if (!existing.includes(col)) {
          try {
            dbExec(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`);
            log(`   ↳ migração: adicionada coluna ${table}.${col}`);
          } catch (e) { log(`   ↳ migração ignorada ${table}.${col}: ${e.message}`); }
        }
      }
    } catch (e) { log(`   ↳ ensureColumns ${table} falhou: ${e.message}`); }
  }

  ensureColumns('profiles', [
    ['whatsapp', 'TEXT'], ['company', 'TEXT'], ['company_name', 'TEXT'],
    ['logo_url', 'TEXT'], ['phone', 'TEXT'], ['address', 'TEXT'],
  ]);
  ensureColumns('system_settings', [
    ['logo', 'TEXT'], ['whatsapp1', 'TEXT'], ['whatsapp2', 'TEXT'],
    ['address', 'TEXT'], ['company', 'TEXT'], ['seo_config', 'TEXT'],
  ]);
  ensureColumns('receipt_format_settings', [
    ['format', "TEXT DEFAULT '80mm'"], ['font_family', "TEXT DEFAULT 'monospace'"],
    ['container_width', 'TEXT'], ['padding', 'TEXT'], ['margins', 'TEXT'],
    ['logo_max_width', 'TEXT'], ['logo_max_height', 'TEXT'],
    ['title_font_size', 'TEXT'], ['customer_font_size', 'TEXT'], ['address_font_size', 'TEXT'],
    ['phone_font_size', 'TEXT'], ['datetime_font_size', 'TEXT'], ['table_font_size', 'TEXT'],
    ['totals_font_size', 'TEXT'], ['final_total_font_size', 'TEXT'], ['quote_font_size', 'TEXT'],
  ]);

  // CRITICAL: PDV grava order_items com user_id, mas o schema antigo não tinha essa coluna.
  // Sem isso, "Erro ao salvar item no pedido" aparece ao adicionar material no PDV offline.
  ensureColumns('order_items', [
    ['user_id', 'TEXT'],
    ['cost_price', 'REAL'],
    ['linked_stock_quantity', 'REAL'],
    ['linked_material_name', 'TEXT'],
    ['original_price', 'REAL'],
    ['price_adjustment', 'REAL'],
    ['tara', 'REAL DEFAULT 0'],
  ]);
  ensureColumns('orders', [
    ['cancelled', 'INTEGER DEFAULT 0'],
    ['cancelled_at', 'TEXT'],
    ['cancelled_by', 'TEXT'],
    ['cancellation_reason', 'TEXT'],
    ['refund_amount', 'REAL'],
    ['payment_method', "TEXT DEFAULT 'dinheiro'"],
    ['timestamp', 'INTEGER'],
  ]);
  try {
    const owner = getOwner();
    const existsProfile = dbAll('SELECT id FROM profiles WHERE id = ?', [owner.id]);
    if (existsProfile.length === 0) {
      dbRun(
        'INSERT INTO profiles (id, name, email) VALUES (?, ?, ?)',
        [owner.id, owner.name, owner.email]
      );
    }
    const existsSub = dbAll(
      'SELECT id FROM user_subscriptions WHERE user_id = ? AND is_active = 1',
      [owner.id]
    );
    if (existsSub.length === 0) {
      // Tier reflete o license.json (essencial|pro). Default essencial se ausente.
      const lic = readJSON(LICENSE_PATH, {});
      const planRaw = String(lic.plan || 'essencial').toLowerCase();
      const tier = (planRaw === 'pro' || planRaw === 'controle') ? 'pro' : 'essencial';
      const farFuture = new Date(Date.now() + 50 * 365 * 24 * 60 * 60 * 1000).toISOString();
      dbRun(
        'INSERT INTO user_subscriptions (id, user_id, plan_type, tier, is_active, expires_at) VALUES (?, ?, ?, ?, ?, ?)',
        [crypto.randomUUID(), owner.id, tier, tier, 1, farFuture]
      );
      log(`   ↳ seed: assinatura ${tier.toUpperCase()} ativa criada para owner ${owner.id}`);
    }
  } catch (e) { log('Seed warning:', e.message); }

  scheduleSave();

  app.listen(PORT, () => {
    log(`✅ Servidor rodando em http://localhost:${PORT}`);
    log(`   Logs: ${LOG_PATH}`);
  }).on('error', err => {
    if (err.code === 'EADDRINUSE') {
      log(`❌ Porta ${PORT} já está em uso. Feche o outro processo e tente novamente.`);
    } else {
      log('Server error:', err.message);
    }
    process.exit(1);
  });
}

boot().catch(err => {
  log('Falha fatal no boot:', err.stack || err.message);
  process.exit(1);
});
