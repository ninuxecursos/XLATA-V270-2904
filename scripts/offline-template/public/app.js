const TOKEN = localStorage.getItem('xlata_token');
if (!TOKEN) location.href = '/';
document.getElementById('userLabel').textContent = localStorage.getItem('xlata_user') || '';
document.getElementById('logout').onclick = () => { localStorage.clear(); location.href='/'; };

const api = async (path, opts={}) => {
  const r = await fetch(path, {
    ...opts,
    headers: {'Content-Type':'application/json','x-session':TOKEN, ...(opts.headers||{})}
  });
  if (r.status === 401) { localStorage.clear(); location.href='/'; return; }
  return r.json();
};
const fmt = v => 'R$ ' + Number(v||0).toFixed(2).replace('.',',');
const app = document.getElementById('app');

document.querySelectorAll('.tabs button').forEach(b => {
  b.onclick = () => {
    document.querySelectorAll('.tabs button').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    render(b.dataset.tab);
  };
});

let cart = [];
let products = [];

async function loadProducts() { products = await api('/api/products') || []; }

async function render(tab) {
  if (tab === 'venda') return renderVenda();
  if (tab === 'produtos') return renderProdutos();
  if (tab === 'compras') return renderCompras();
  if (tab === 'historico') return renderHistorico();
  if (tab === 'relatorio') return renderRelatorio();
}

async function renderVenda() {
  await loadProducts();
  const total = cart.reduce((s,i)=>s+i.price*i.qty,0);
  app.innerHTML = `
    <div class="grid2">
      <div class="card">
        <h2>Adicionar produto</h2>
        <div class="field">
          <label>Produto</label>
          <select id="prodSel">
            <option value="">-- selecione --</option>
            ${products.map(p=>`<option value="${p.id}">${p.name} - ${fmt(p.price)} ${p.stock?'(estoque '+p.stock+')':''}</option>`).join('')}
          </select>
        </div>
        <div class="field"><label>Quantidade</label><input id="qty" type="number" min="0.01" step="0.01" value="1" /></div>
        <button class="btn" id="addBtn">Adicionar ao carrinho</button>
        ${products.length===0 ? '<p class="empty">Nenhum produto cadastrado. Va em "Produtos".</p>' : ''}
      </div>
      <div class="card">
        <h2>Carrinho</h2>
        ${cart.length===0 ? '<p class="empty">Carrinho vazio</p>' : `
          <table><thead><tr><th>Produto</th><th>Qtd</th><th>Subtotal</th><th></th></tr></thead><tbody>
            ${cart.map((i,idx)=>`<tr><td>${i.name}</td><td>${i.qty}</td><td>${fmt(i.price*i.qty)}</td><td><button class="btn-danger" data-rm="${idx}">x</button></td></tr>`).join('')}
          </tbody></table>
          <div class="cart-total"><span>Total</span><span>${fmt(total)}</span></div>
          <button class="btn" id="finalize" style="width:100%;margin-top:10px">Finalizar venda</button>
        `}
      </div>
    </div>`;
  document.getElementById('addBtn').onclick = () => {
    const id = document.getElementById('prodSel').value;
    const qty = parseFloat(document.getElementById('qty').value);
    if (!id || !qty) return alert('Selecione um produto e quantidade');
    const p = products.find(x=>String(x.id)===String(id));
    cart.push({productId:p.id, name:p.name, price:p.price, qty});
    renderVenda();
  };
  document.querySelectorAll('[data-rm]').forEach(b=>b.onclick=()=>{cart.splice(+b.dataset.rm,1);renderVenda();});
  const fin = document.getElementById('finalize');
  if (fin) fin.onclick = async () => {
    await api('/api/sales',{method:'POST',body:JSON.stringify({items:cart,total})});
    cart=[]; alert('Venda registrada com sucesso!'); renderVenda();
  };
}

async function renderProdutos() {
  await loadProducts();
  app.innerHTML = `
    <div class="grid2">
      <div class="card">
        <h2>Cadastrar produto</h2>
        <div class="field"><label>Nome</label><input id="pName" /></div>
        <div class="field"><label>Preco (R$)</label><input id="pPrice" type="number" step="0.01" min="0" /></div>
        <div class="field"><label>Estoque (opcional)</label><input id="pStock" type="number" step="0.01" min="0" placeholder="0" /></div>
        <button class="btn" id="saveProd">Salvar</button>
      </div>
      <div class="card">
        <h2>Produtos cadastrados (${products.length})</h2>
        ${products.length===0 ? '<p class="empty">Nenhum produto</p>' : `
          <table><thead><tr><th>Nome</th><th>Preco</th><th>Estoque</th><th></th></tr></thead><tbody>
            ${products.map(p=>`<tr><td>${p.name}</td><td>${fmt(p.price)}</td><td>${p.stock||0}</td><td><button class="btn-danger" data-del="${p.id}">Excluir</button></td></tr>`).join('')}
          </tbody></table>
        `}
      </div>
    </div>`;
  document.getElementById('saveProd').onclick = async () => {
    const name = document.getElementById('pName').value.trim();
    const price = parseFloat(document.getElementById('pPrice').value);
    const stock = parseFloat(document.getElementById('pStock').value)||0;
    if (!name || isNaN(price)) return alert('Preencha nome e preco');
    await api('/api/products',{method:'POST',body:JSON.stringify({name,price,stock})});
    renderProdutos();
  };
  document.querySelectorAll('[data-del]').forEach(b=>b.onclick=async()=>{
    if(!confirm('Excluir este produto?')) return;
    await api('/api/products/'+b.dataset.del,{method:'DELETE'});
    renderProdutos();
  });
}

async function renderCompras() {
  const list = await api('/api/purchases') || [];
  app.innerHTML = `
    <div class="grid2">
      <div class="card">
        <h2>Registrar compra</h2>
        <div class="field"><label>Descricao</label><input id="cDesc" placeholder="Ex.: 50kg de aluminio" /></div>
        <div class="field"><label>Valor (R$)</label><input id="cAmt" type="number" step="0.01" min="0" /></div>
        <button class="btn" id="saveBuy">Salvar compra</button>
      </div>
      <div class="card">
        <h2>Compras recentes</h2>
        ${list.length===0 ? '<p class="empty">Nenhuma compra</p>' : `
          <table><thead><tr><th>Data</th><th>Descricao</th><th>Valor</th></tr></thead><tbody>
            ${list.map(c=>`<tr><td>${(c.created_at||'').slice(0,16).replace('T',' ')}</td><td>${c.description}</td><td>${fmt(c.amount)}</td></tr>`).join('')}
          </tbody></table>
        `}
      </div>
    </div>`;
  document.getElementById('saveBuy').onclick = async () => {
    const description = document.getElementById('cDesc').value.trim();
    const amount = parseFloat(document.getElementById('cAmt').value);
    if (!description || isNaN(amount)) return alert('Preencha descricao e valor');
    await api('/api/purchases',{method:'POST',body:JSON.stringify({description,amount})});
    renderCompras();
  };
}

async function renderHistorico() {
  const sales = await api('/api/sales') || [];
  const purchases = await api('/api/purchases') || [];
  app.innerHTML = `
    <div class="grid2">
      <div class="card">
        <h2>Vendas (${sales.length})</h2>
        ${sales.length===0 ? '<p class="empty">Nenhuma venda</p>' : `
          <table><thead><tr><th>Data</th><th>Itens</th><th>Total</th></tr></thead><tbody>
            ${sales.map(s=>{const its=JSON.parse(s.items_json||'[]');return `<tr><td>${(s.created_at||'').slice(0,16).replace('T',' ')}</td><td>${its.length} item(s)</td><td>${fmt(s.total)}</td></tr>`}).join('')}
          </tbody></table>`}
      </div>
      <div class="card">
        <h2>Compras (${purchases.length})</h2>
        ${purchases.length===0 ? '<p class="empty">Nenhuma compra</p>' : `
          <table><thead><tr><th>Data</th><th>Descricao</th><th>Valor</th></tr></thead><tbody>
            ${purchases.map(c=>`<tr><td>${(c.created_at||'').slice(0,16).replace('T',' ')}</td><td>${c.description}</td><td>${fmt(c.amount)}</td></tr>`).join('')}
          </tbody></table>`}
      </div>
    </div>`;
}

async function renderRelatorio() {
  const today = new Date().toISOString().slice(0,10);
  app.innerHTML = `
    <div class="card no-print" style="margin-bottom:16px;display:flex;gap:12px;align-items:end">
      <div class="field" style="margin:0;flex:1"><label>Data do relatorio</label><input id="rDate" type="date" value="${today}" /></div>
      <button class="btn" id="loadRep">Carregar</button>
      <button class="btn-ghost" id="printRep">Imprimir / Salvar PDF</button>
    </div>
    <div id="repBody"></div>`;
  const load = async () => {
    const date = document.getElementById('rDate').value;
    const r = await api('/api/report/daily?date='+date);
    const products = await api('/api/products') || [];
    let stockKg = 0, stockCost = 0, stockProfit = 0;
    products.forEach(p => {
      const qty = Number(p.stock || p.stock_kg || 0);
      const cost = Number(p.price || p.purchase_price || 0);
      const sale = Number(p.sale_price || p.price || 0);
      if (qty > 0) {
        stockKg += qty;
        stockCost += qty * cost;
        stockProfit += qty * (sale - cost);
      }
    });
    const cash = (r.totalSales || 0) - (r.totalPurchases || 0);
    document.getElementById('repBody').innerHTML = `
      <div class="card" style="background:linear-gradient(135deg,#064e3b22,#0f172a);border-color:#10b98155;margin-bottom:14px">
        <h2 style="margin-bottom:4px">💰 Resumo Real do Seu Negócio</h2>
        <p style="color:var(--muted);font-size:12px;margin-bottom:14px">${date.split('-').reverse().join('/')}</p>
        <div class="kpi">
          <div class="card">
            <div class="label">Dinheiro que deveria estar em caixa</div>
            <div class="value ${cash>=0?'green':'red'}">${fmt(cash)}</div>
            <div style="font-size:11px;color:var(--muted);margin-top:4px">Vendas ${fmt(r.totalSales)} − Compras ${fmt(r.totalPurchases)}</div>
          </div>
          <div class="card">
            <div class="label">Material parado no estoque</div>
            <div class="value" style="color:#fbbf24">${stockKg.toFixed(2)} kg</div>
            <div style="font-size:12px;color:#fcd34d;margin-top:2px">≈ ${fmt(stockCost)} investidos</div>
          </div>
          <div class="card">
            <div class="label">Lucro que ainda vai realizar</div>
            <div class="value" style="color:#7dd3fc">≈ ${fmt(stockProfit)}</div>
            <div style="font-size:11px;color:var(--muted);margin-top:4px">Só vira caixa quando vender</div>
          </div>
        </div>
        <p style="font-size:11px;color:var(--muted);margin-top:10px;border-top:1px dashed var(--line);padding-top:8px">
          ℹ️ O caixa pode estar negativo mesmo com lucro positivo nas vendas — o dinheiro saiu mas virou estoque parado, que ainda vai ser vendido.
        </p>
      </div>
      <div class="card">
        <h2 style="margin-bottom:6px">Relatorio Diario - ${date.split('-').reverse().join('/')}</h2>
        <p style="color:var(--muted);font-size:13px;margin-bottom:18px">Cliente: ${r.client}</p>
        <div class="kpi">
          <div class="card"><div class="label">Total Vendas</div><div class="value green">${fmt(r.totalSales)}</div></div>
          <div class="card"><div class="label">Total Compras</div><div class="value red">${fmt(r.totalPurchases)}</div></div>
          <div class="card"><div class="label">Caixa do Dia (Vendas - Compras)</div><div class="value ${r.profit>=0?'green':'red'}">${fmt(r.profit)}</div></div>
        </div>
        <h2 style="margin-top:16px">Vendas do dia (${r.sales.length})</h2>
        ${r.sales.length===0 ? '<p class="empty">Nenhuma venda neste dia</p>' : `
          <table><thead><tr><th>Hora</th><th>Itens</th><th>Total</th></tr></thead><tbody>
            ${r.sales.map(s=>{const its=JSON.parse(s.items_json||'[]');return `<tr><td>${(s.created_at||'').slice(11,16)}</td><td>${its.map(i=>i.name+' x'+i.qty).join(', ')}</td><td>${fmt(s.total)}</td></tr>`}).join('')}
          </tbody></table>`}
        <h2 style="margin-top:20px">Compras do dia (${r.purchases.length})</h2>
        ${r.purchases.length===0 ? '<p class="empty">Nenhuma compra neste dia</p>' : `
          <table><thead><tr><th>Hora</th><th>Descricao</th><th>Valor</th></tr></thead><tbody>
            ${r.purchases.map(c=>`<tr><td>${(c.created_at||'').slice(11,16)}</td><td>${c.description}</td><td>${fmt(c.amount)}</td></tr>`).join('')}
          </tbody></table>`}
        <p style="text-align:center;color:var(--muted);font-size:11px;margin-top:24px;border-top:1px dashed var(--line);padding-top:12px">XLata PDV Offline - Gerado em ${new Date().toLocaleString('pt-BR')}</p>
      </div>`;
  };
  document.getElementById('loadRep').onclick = load;
  document.getElementById('printRep').onclick = () => window.print();
  load();
}

render('venda');
