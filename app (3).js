/* =========================
   RR JOURNAL — APP.JS (UTUH + Export Presentasi + Gambar)
   ========================= */

/* ===== util DOM ===== */
const $ = q => document.querySelector(q);
const uid = () => Math.random().toString(36).slice(2,9);

/* ===== refs ===== */
const form = $('#tradeForm');
const rPointEl = $('#rPoint'), tp1El = $('#tp1Display'), tp2El = $('#tp2Display'), tp3El = $('#tp3Display');
const pBox1 = $('#pBox1'), pBox2 = $('#pBox2'), pBox3 = $('#pBox3'), totalTxBox = $('#totalTxBox');
const tradeList = $('#tradeList'), totR1El = $('#totR1'), totR2El = $('#totR2'), totR3El = $('#totR3');

const exportBtn = $('#exportBtn'), importInput = $('#importInput'), clearBtn = $('#clearBtn');
const exportHtmlBtn = $('#exportHtmlBtn');

/* ===== Simulasi Balance (editable input) ===== */
const baseInput = $('#baseInput');     // Modal (USD)
const riskInput = $('#riskInput');     // Risk % per trade
const rValBox = $('#rValBox');         // 1R (USD)
const simBalBox = $('#simBalBox');     // Equity (sim)
const pnlMoneyBox = $('#pnlMoneyBox'); // P/L (sim)

/* ===== Projects ===== */
const saveProjectBtn = $('#saveProjectBtn'), openProjectsBtn = $('#openProjectsBtn');
const saveToActiveBtn = $('#saveToActiveBtn');

const projectsModal = $('#projectsModal'), projectsList = $('#projectsList'), closeProjects = $('#closeProjects');

const saveProjectModal = $('#saveProjectModal');
const saveProjectName = $('#saveProjectName');
const saveProjectNotes = $('#saveProjectNotes');
const cancelSaveProject = $('#cancelSaveProject');
const confirmSaveProject = $('#confirmSaveProject');

/* ===== Edit Modal + Gambar ===== */
const editModal = $('#editModal'), editForm = $('#editForm'), editCancel = $('#editCancel');

// upload controls (already exist in HTML)
const editImgBefore = $('#editImgBefore');
const editImgBeforeData = $('#editImgBeforeData');
const editImgBeforePreview = $('#editImgBeforePreview');
const btnClearImgBefore = $('#btnClearImgBefore');
const btnViewImgBefore = $('#btnViewImgBefore');
const dropBefore = $('#dropBefore');

const editImgAfter = $('#editImgAfter');
const editImgAfterData = $('#editImgAfterData');
const editImgAfterPreview = $('#editImgAfterPreview');
const btnClearImgAfter = $('#btnClearImgAfter');
const btnViewImgAfter = $('#btnViewImgAfter');
const dropAfter = $('#dropAfter');

// Lightbox
const imgViewer = $('#imgViewer');
const imgViewerImg = $('#imgViewerImg');
const imgViewerClose = $('#imgViewerClose');

/* ===== storage keys ===== */
const STORE       = 'rr_journal_active_v1';
const STORE_PROJ  = 'rr_journal_projects_v1';
const ACTIVE_ID_KEY   = 'rr_active_project_id';
const ACTIVE_NAME_KEY = 'rr_active_project_name';
const STORE_SETTINGS  = 'rr_journal_settings_v1'; // { base, risk }

/* ===== storage helpers ===== */
const load       = () => JSON.parse(localStorage.getItem(STORE) || '[]');
const save       = d  => localStorage.setItem(STORE, JSON.stringify(d));
const loadProj   = () => { try { return JSON.parse(localStorage.getItem(STORE_PROJ) || '[]'); } catch { localStorage.removeItem(STORE_PROJ); return []; } };
const saveProj   = p  => localStorage.setItem(STORE_PROJ, JSON.stringify(p));
const loadSettings = () => { try { return JSON.parse(localStorage.getItem(STORE_SETTINGS) || '{}'); } catch { return {}; } };
const saveSettings = s  => localStorage.setItem(STORE_SETTINGS, JSON.stringify(s));

/* ===== helpers umum ===== */
const fmtDT     = s => s ? s.replace('T',' ') : '';
const toDTInput = s => !s ? '' : (s.includes('T') ? s : s.replace(' ', 'T'));
const nowISO    = () => new Date().toISOString();
const fmtMoney  = n => (isFinite(n) ? n.toLocaleString('id-ID',{minimumFractionDigits:2, maximumFractionDigits:2}) : '0.00');
const slugify   = s => (s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'') || 'report';

/* =========================================================
   LIST SYMBOL + DROPDOWN
   ========================================================= */
const SYMBOLS = [
  "EURUSD","GBPUSD","AUDUSD","NZDUSD","USDJPY","USDCHF","USDCAD",
  "EURGBP","EURCHF","EURJPY","EURCAD","EURAUD","EURNZD",
  "GBPJPY","GBPCHF","GBPAUD","GBPCAD","GBPNZD",
  "AUDJPY","AUDNZD","AUDCAD","AUDCHF",
  "NZDJPY","NZDCAD","NZDCHF",
  "CADJPY","CHFJPY","CADCHF",
  "XAUUSD","XAGUSD","US100"
];

/* Ganti input symbol → <select> pada form utama (tanpa edit index.html) */
function ensureSymbolDropdownForAdd(){
  if (!form) return;
  const old = form.querySelector('[name="symbol"]');
  if (!old) return;
  if (old.tagName.toLowerCase() === 'select') { populateSelectOptions(old, SYMBOLS); return; }

  const sel = document.createElement('select');
  sel.id = old.id || 'symbol'; sel.name = old.name || 'symbol';
  sel.className = old.className; sel.required = true;

  const ph = document.createElement('option');
  ph.value = ''; ph.textContent = '-- pilih symbol --'; ph.disabled = true; ph.selected = true;
  sel.appendChild(ph);

  populateSelectOptions(sel, SYMBOLS);

  const val = (old.value || '').toUpperCase().replace(/[^A-Z]/g,'');
  if (val && SYMBOLS.includes(val)) sel.value = val;

  old.replaceWith(sel);
}

/* Ganti input symbol → <select> pada modal edit */
function ensureSymbolDropdownForEdit(){
  if (!editForm) return;
  const old = editForm.querySelector('[name="symbol"]');
  if (!old) return;
  if (old.tagName.toLowerCase() === 'select') { populateSelectOptions(old, SYMBOLS); return; }

  const sel = document.createElement('select');
  sel.name = 'symbol'; sel.id = old.id || 'editSymbol';
  sel.className = old.className; sel.required = true;

  const ph = document.createElement('option');
  ph.value=''; ph.textContent='-- pilih symbol --'; ph.disabled=true; ph.selected=true;
  sel.appendChild(ph);

  populateSelectOptions(sel, SYMBOLS);
  const val = (old.value || '').toUpperCase().replace(/[^A-Z]/g,'');
  if (val && SYMBOLS.includes(val)) sel.value = val;

  old.replaceWith(sel);
}

function populateSelectOptions(selectEl, list){
  selectEl.innerHTML = '';
  const ph = document.createElement('option');
  ph.value=''; ph.textContent='-- pilih symbol --'; ph.disabled=true; ph.selected=true;
  selectEl.appendChild(ph);
  for (const s of list){
    const opt = document.createElement('option');
    opt.value = s; opt.textContent = s;
    selectEl.appendChild(opt);
  }
}

/* =========================================================
   FAIR-FOREX — NORMALISASI & PRESISI
   ========================================================= */
function normalizeSymbol(s){
  return (s||'').toUpperCase().replace(/[^A-Z]/g,'').trim();
}
function precisionForSymbol(symRaw){
  const s = normalizeSymbol(symRaw);
  if (!s) return 5;
  const MAP = { XAUUSD:2, XAGUSD:3, US100:1 };
  if (MAP[s] != null) return MAP[s];
  if (s.endsWith('JPY')) return 3;
  return 5;
}
function stepForPrecision(p){ return Number(`1e-${p}`); }
function roundTo(n, prec){ const f = Math.pow(10, prec); return Math.round(Number(n||0)*f)/f; }
function toFixedBy(n, prec){ return Number.isFinite(n) ? Number(n).toFixed(prec) : (0).toFixed(prec); }

/* Terapkan step & placeholder sesuai simbol — FORM TAMBAH */
function applyPriceFormatToAddForm(){
  if(!form) return;
  const p = precisionForSymbol(form.symbol.value);
  const step = stepForPrecision(p);
  const ph = p>0 ? ('0.' + '0'.repeat(p)) : '0';
  if(form.entry_price){ form.entry_price.step = step; form.entry_price.placeholder = ph; }
  if(form.stop_loss){   form.stop_loss.step   = step; form.stop_loss.placeholder   = ph; }
  calcPreview(Number(form.entry_price.value), Number(form.stop_loss.value), form.side.value, p);
}
/* Terapkan step & placeholder — MODAL EDIT */
function applyPriceFormatToEditForm(){
  if(!editForm) return;
  const p = precisionForSymbol(editForm.symbol.value);
  const step = stepForPrecision(p);
  const ph = p>0 ? ('0.' + '0'.repeat(p)) : '0';
  if(editForm.entry_price){ editForm.entry_price.step = step; editForm.entry_price.placeholder = ph; }
  if(editForm.stop_loss){   editForm.stop_loss.step   = step; editForm.stop_loss.placeholder   = ph; }
}

/* ===== Active Project Helpers ===== */
function setActiveProject(id='', name=''){
  localStorage.setItem(ACTIVE_ID_KEY, id || '');
  localStorage.setItem(ACTIVE_NAME_KEY, name || '');
  updateActiveProjectUI();
}
function getActiveProject(){
  return {
    id:   localStorage.getItem(ACTIVE_ID_KEY)   || '',
    name: localStorage.getItem(ACTIVE_NAME_KEY) || ''
  };
}
function updateActiveProjectUI(){
  const { id, name } = getActiveProject();
  if (id) {
    saveToActiveBtn?.classList.remove('hidden');
    if (saveToActiveBtn) saveToActiveBtn.textContent = `Simpan (${name})`;
  } else {
    saveToActiveBtn?.classList.add('hidden');
  }
}

/* ===== PREVIEW (mengikuti presisi simbol) ===== */
function calcPreview(entry, sl, side, _precFromSymbol){
  const ok = Number.isFinite(entry) && Number.isFinite(sl);
  const prec = (_precFromSymbol ?? precisionForSymbol(form?.symbol?.value || ''));
  if (!ok){
    rPointEl.textContent='0.00';
    tp1El.textContent=tp2El.textContent=tp3El.textContent='0.00';
    return;
  }
  const d = Math.abs(entry - sl);
  rPointEl.textContent = toFixedBy(roundTo(d, prec), prec);

  const tp1 = side==='LONG'? entry+d : entry-d;
  const tp2 = side==='LONG'? entry+2*d : entry-2*d;
  const tp3 = side==='LONG'? entry+3*d : entry-3*d;

  tp1El.textContent = toFixedBy(roundTo(tp1, prec), prec);
  tp2El.textContent = toFixedBy(roundTo(tp2, prec), prec);
  tp3El.textContent = toFixedBy(roundTo(tp3, prec), prec);
}

/* ===== R calc ===== */
function rByResult(res){
  switch(res){
    case 'SL':  return [-1,-1,-1];
    case 'TP1': return [ 1,-1,-1];
    case 'TP2': return [ 1, 2,-1];
    case 'TP3': return [ 1, 2, 3];
    default:    return [ 0, 0, 0];
  }
}
function levelFromResult(res){
  switch(res){ case 'TP3':return 3; case 'TP2':return 2; case 'TP1':return 1; case 'SL':return 0; default:return null; }
}
function netROf(res){
  if(res==='SL')  return -1;
  if(res==='TP1') return  1;
  if(res==='TP2') return  2;
  if(res==='TP3') return  3;
  return 0;
}
function rCell(n){
  const c = n>0 ? 'text-emerald-400' : (n<0 ? 'text-rose-400' : 'text-slate-400');
  return `<span class="${c}">${String(n)}</span>`;
}

/* ===== table row ===== */
function rowHTML(t){
  const [r1,r2,r3] = rByResult(t.result||'');
  const prec = precisionForSymbol(t.symbol);
  const fmt  = v => toFixedBy(Number(v), prec);
  const symbolClean = normalizeSymbol(t.symbol);

  const resultSel = `
    <select data-id="${t.id}" data-field="result"
      class="bg-slate-900/70 border border-slate-700 rounded-lg px-2 py-1">
      <option value=""   ${!t.result?'selected':''}>-</option>
      <option value="SL" ${t.result==='SL'?'selected':''}>SL</option>
      <option value="TP1"${t.result==='TP1'?'selected':''}>TP1</option>
      <option value="TP2"${t.result==='TP2'?'selected':''}>TP2</option>
      <option value="TP3"${t.result==='TP3'?'selected':''}>TP3</option>
    </select>`;
  const buttons = `
    <div class="flex items-center gap-2 justify-center">
      <button data-id="${t.id}" data-action="edit"
        class="bg-slate-900/70 border border-slate-700 rounded-lg px-2 py-1" title="Edit">✏️</button>
      <button data-id="${t.id}" data-action="del"
        class="bg-slate-900/70 border border-slate-700 rounded-lg px-2 py-1 hover:bg-rose-600 hover:text-white" title="Hapus">🗑</button>
    </div>`;
  return `
    <td class="px-3 py-2">${fmtDT(t.setup_date||'')}</td>
    <td class="px-3 py-2">${symbolClean}</td>
    <td class="px-3 py-2 text-center">${t.side}</td>
    <td class="px-3 py-2 text-right">${fmt(t.entry_price)}</td>
    <td class="px-3 py-2 text-right">${fmt(t.stop_loss)}</td>
    <td class="px-3 py-2 text-right">${rCell(r1)}</td>
    <td class="px-3 py-2 text-right">${rCell(r2)}</td>
    <td class="px-3 py-2 text-right">${rCell(r3)}</td>
    <td class="px-3 py-2 text-right">${resultSel}</td>
    <td class="px-3 py-2 text-left">${t.note || ''}</td>
    <td class="px-3 py-2">${buttons}</td>
  `;
}

/* ===== refresh UI + prob & sim ===== */
function refresh(){
  const data = load();
  tradeList.innerHTML = '';
  totalTxBox.textContent = String(data.length);

  let tR1=0,tR2=0,tR3=0, nDone=0, n1=0, n2=0, n3=0, rnet=0;

  for(const t of data){
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-900/40 transition-colors';
    tr.innerHTML = rowHTML(t);
    tradeList.appendChild(tr);

    const [r1,r2,r3] = rByResult(t.result||'');
    tR1+=r1; tR2+=r2; tR3+=r3;
    rnet += netROf(t.result||'');

    const lvl = levelFromResult(t.result||'');
    if(lvl!==null){ nDone++; if(lvl>=1) n1++; if(lvl>=2) n2++; if(lvl>=3) n3++; }
  }

  const setTot=(el,v)=>{ el.textContent=String(v); el.className='px-3 py-2 text-right font-semibold '+(v>0?'text-emerald-400':(v<0?'text-rose-400':'')); };
  setTot(totR1El,tR1); setTot(totR2El,tR2); setTot(totR3El,tR3);

  const pct = x => (nDone>0?Math.round(x/nDone*100):0)+'%';
  pBox1.textContent = pct(n1); pBox2.textContent = pct(n2); pBox3.textContent = pct(n3);

  calcSim(rnet); // update simulasi balance
}

/* ===== CRUD data ===== */
function addTrade(obj){ const data = load(); data.unshift(obj); save(data); }
function updateTrade(id, patch){ const data = load(); const i = data.findIndex(x=>x.id===id); if(i<0) return; data[i] = {...data[i], ...patch}; save(data); }
function deleteTrade(id){ save(load().filter(x=>x.id!==id)); }

/* ===== edit modal ===== */
function openEdit(id){
  const t = load().find(x=>x.id===id); if(!t) return;
  ensureSymbolDropdownForEdit();

  // isi form
  editForm.id.value = id;
  editForm.setup_date.value = toDTInput(t.setup_date || '');
  editForm.symbol.value = normalizeSymbol(t.symbol || '');
  editForm.side.value = t.side || 'LONG';
  editForm.entry_price.value = t.entry_price ?? 0;
  editForm.stop_loss.value  = t.stop_loss  ?? 0;

  // gambar (base64)
  setImagePreview('before', t.img_before_data || '');
  setImagePreview('after',  t.img_after_data  || '');

  applyPriceFormatToEditForm();
  editModal.classList.remove('hidden'); editModal.classList.add('flex');
}
function closeEdit(){ editModal.classList.add('hidden'); editModal.classList.remove('flex'); }

/* ===== projects modal ===== */
function renderProjects(){
  const items = loadProj();
  projectsList.innerHTML = '';
  if(items.length===0){
    projectsList.innerHTML = `<div class="text-slate-400">Belum ada project.</div>`;
    return;
  }
  for(const p of items){
    const div = document.createElement('div');
    const created = p.createdAt?.replace('T',' ').slice(0,16) || '-';
    const updated = p.updatedAt?.replace('T',' ').slice(0,16) || '-';
    div.className = 'bg-slate-900/70 ring-1 ring-white/10 rounded-xl p-4 flex flex-wrap items-center gap-3';
    div.innerHTML = `
      <div class="flex-1">
        <div class="font-semibold">${p.name}</div>
        <div class="text-slate-400 text-sm">Transaksi: ${p.trades.length} • Catatan: ${p.notes||'-'}</div>
        <div class="text-slate-500 text-xs">Dibuat: ${created} • Update: ${updated}</div>
      </div>
      <div class="flex items-center gap-2">
        <button data-id="${p.id}" data-act="open" class="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded-lg">Lanjut Journal</button>
        <button data-id="${p.id}" data-act="del" class="bg-rose-600 hover:bg-rose-500 text-white px-3 py-1 rounded-lg">Hapus</button>
      </div>
    `;
    projectsList.appendChild(div);
  }
}
function openProjects(){ renderProjects(); projectsModal.classList.remove('hidden'); projectsModal.classList.add('flex'); }
function closeProjectsModal(){ projectsModal.classList.add('hidden'); projectsModal.classList.remove('flex'); }

/* ===== save project modal ===== */
function openSaveProjectModal(){
  saveProjectName.value = '';
  saveProjectNotes.value = '';
  saveProjectModal.classList.remove('hidden'); saveProjectModal.classList.add('flex');
  setTimeout(()=>saveProjectName.focus(),50);
}
function closeSaveProjectModal(){ saveProjectModal.classList.add('hidden'); saveProjectModal.classList.remove('flex'); }

/* ===== events: ADD FORM ===== */
form?.addEventListener('input', ()=>{
  applyPriceFormatToAddForm();
});
form?.addEventListener('change', e=>{
  if (e.target && e.target.name === 'symbol') applyPriceFormatToAddForm();
});

/* validasi + tambah row  (TIDAK reset modal/risk) */
form?.addEventListener('submit', e=>{
  e.preventDefault();
  const keepSettings = getSettings();

  const symbol = normalizeSymbol(form.symbol.value || '');
  const side   = form.side.value;
  const entry  = Number(form.entry_price.value);
  const sl     = Number(form.stop_loss.value);
  const prec   = precisionForSymbol(symbol);

  if (!symbol || !Number.isFinite(entry) || !Number.isFinite(sl)) {
    alert('Isi minimal: Symbol, Entry, dan Stop Loss dengan nilai yang valid.');
    return;
  }
  if (entry === sl) {
    alert('Entry dan Stop Loss tidak boleh sama.');
    return;
  }

  addTrade({
    id: uid(),
    symbol,
    side,
    entry_price: roundTo(entry, prec),
    stop_loss:   roundTo(sl,   prec),
    setup_date: form.setup_date.value || '',
    note: form.note.value || '',
    result: '',
    // field lampiran default
    img_before_data: '',
    img_after_data: ''
  });

  form.reset();
  setSettings(keepSettings);
  calcSim();
  rPointEl.textContent = tp1El.textContent = tp2El.textContent = tp3El.textContent = '0.00';
  refresh();
});

/* tombol reset form -> jangan hapus modal/risk */
form?.addEventListener('reset', ()=>{
  const s = loadSettings();
  setTimeout(()=>{ setSettings(s); calcSim(); }, 0);
});

/* ===== events: TABLE & EDIT ===== */
tradeList.addEventListener('change', e=>{
  const sel = e.target.closest('select[data-id]');
  if(sel){ updateTrade(sel.dataset.id, { [sel.dataset.field||'result']: sel.value }); refresh(); }
});
tradeList.addEventListener('click', e=>{
  const btn = e.target.closest('button[data-action]'); if(!btn) return;
  const id = btn.dataset.id;
  if(btn.dataset.action==='del'){ deleteTrade(id); refresh(); }
  if(btn.dataset.action==='edit'){ openEdit(id); }
});

editCancel?.addEventListener('click', closeEdit);
editForm?.symbol?.addEventListener('input', applyPriceFormatToEditForm);
editForm?.addEventListener('change', e=>{
  if (e.target && (e.target.name === 'symbol')) applyPriceFormatToEditForm();
});
editForm?.addEventListener('submit', e=>{
  e.preventDefault();

  const symbol = normalizeSymbol(editForm.symbol.value || '');
  const prec   = precisionForSymbol(symbol);

  updateTrade(editForm.id.value, {
    setup_date: editForm.setup_date.value || '',
    symbol,
    side: editForm.side.value,
    entry_price: roundTo(Number(editForm.entry_price.value)||0, prec),
    stop_loss:   roundTo(Number(editForm.stop_loss.value)||0,  prec),
    // simpan lampiran base64 yang tertampung di hidden input
    img_before_data: (editImgBeforeData?.value || ''),
    img_after_data:  (editImgAfterData?.value || '')
  });
  closeEdit(); refresh();
});

document.addEventListener('keydown', e=>{
  if(e.key==='Escape'){ closeEdit(); closeProjectsModal(); closeSaveProjectModal(); closeLightbox(); }
});

/* ===== Export/Import/Clear ===== */
exportBtn?.addEventListener('click', ()=>{
  const blob = new Blob([JSON.stringify(load(), null, 2)], {type:'application/json'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download='rr-journal.json';
  document.body.appendChild(a);
  a.click();
  setTimeout(()=>{ document.body.removeChild(a); URL.revokeObjectURL(a.href); },0);
});
importInput?.addEventListener('change', async e=>{
  const f = e.target.files[0]; if(!f) return;
  try { const txt = await f.text(); const data = JSON.parse(txt); if(Array.isArray(data)) save(data); } catch {}
  importInput.value=''; refresh();
});
clearBtn?.addEventListener('click', ()=>{
  if(confirm('Hapus semua data jurnal aktif?')){
    localStorage.removeItem(STORE);
    refresh();
  }
});

/* ===== Projects: Save / Open / Delete ===== */
saveProjectBtn?.addEventListener('click', openSaveProjectModal);
cancelSaveProject?.addEventListener('click', closeSaveProjectModal);

confirmSaveProject?.addEventListener('click', ()=>{
  const trades = load();
  if (!trades.length) {
    alert('Belum ada data jurnal untuk disimpan.');
    return;
  }

  const name = (saveProjectName.value||'').trim();
  if (!name) {
    alert('Nama Project wajib diisi.');
    saveProjectName.focus();
    return;
  }

  const notes = (saveProjectNotes.value||'').trim();
  const projects = loadProj();
  const existing = projects.find(p => p.name.toLowerCase() === name.toLowerCase());
  const snapshot = JSON.parse(JSON.stringify(trades));
  const settings = getSettings();

  if (existing) {
    if(!confirm(`Project "${existing.name}" sudah ada.\nUpdate isi project ini?`)) return;
    existing.trades = snapshot;
    existing.notes  = notes;
    existing.settings = settings;
    existing.updatedAt = nowISO();
    saveProj(projects);
    setActiveProject(existing.id, existing.name);
  } else {
    const newItem = {
      id: uid(), name,
      createdAt: nowISO(), updatedAt: nowISO(),
      notes, trades: snapshot,
      settings
    };
    projects.unshift(newItem);
    saveProj(projects);
    setActiveProject(newItem.id, newItem.name);
  }

  save([]);       // kosongkan jurnal aktif
  refresh();
  closeSaveProjectModal();
  openProjects(); // tampilkan daftar setelah simpan
});

/* buka/tutup modal projects */
openProjectsBtn?.addEventListener('click', openProjects);
closeProjects?.addEventListener('click', closeProjectsModal);

/* tombol dalam daftar projects */
projectsList?.addEventListener('click', e=>{
  const btn = e.target.closest('button[data-act]'); if(!btn) return;
  const id = btn.dataset.id; const projects = loadProj(); const item = projects.find(p=>p.id===id); if(!item) return;

  if(btn.dataset.act==='open'){
    save(item.trades); refresh(); closeProjectsModal();
    setActiveProject(item.id, item.name);
    if(item.settings){ setSettings(item.settings); calcSim(); }
  }else if(btn.dataset.act==='del'){
    if(confirm(`Hapus project "${item.name}"?`)){
      saveProj(projects.filter(p=>p.id!==id));
      const act = getActiveProject();
      if(act.id===id) setActiveProject('', '');
      renderProjects();
    }
  }
});

/* ===== Simulasi Balance ===== */
function getSettings(){
  return {
    base: parseFloat(baseInput?.value) || 0,
    risk: parseFloat(riskInput?.value) || 0
  };
}
function setSettings({base=0, risk=0}={}){
  if(baseInput) baseInput.value = (base ?? '');
  if(riskInput) riskInput.value = (risk ?? '');
  saveSettings({base, risk});
}
function currentOneR(){
  const s = getSettings();
  return s.base * (s.risk/100);
}
function calcSim(){
  const s = getSettings();
  saveSettings(s);

  const oneR = currentOneR();
  const rTotal = load().reduce((acc,t)=>{ const [x1,x2,x3]=rByResult((t.result||'')); return acc + x1 + x2 + x3; }, 0);
  const pnl  = oneR * rTotal;
  const eq   = s.base + pnl;

  if(rValBox)     rValBox.textContent     = fmtMoney(oneR);
  if(pnlMoneyBox) pnlMoneyBox.textContent = (pnl>=0? '+' : '') + fmtMoney(pnl);
  if(simBalBox)   simBalBox.textContent   = fmtMoney(eq);

  [pnlMoneyBox, simBalBox].forEach(el=>{
    if(!el) return;
    el.classList.remove('text-emerald-400','text-rose-400');
    const v = el===pnlMoneyBox ? pnl : eq - s.base;
    el.classList.add(v>=0 ? 'text-emerald-400' : 'text-rose-400');
  });
}

/* ===== Apply URL params ke form & preview ===== */
(function applyURLParams(){
  if (!window.URLSearchParams || !form) return;
  const q = new URLSearchParams(location.search);

  const set = (name, conv = v => v) => {
    if (q.has(name) && form[name] !== undefined) {
      form[name].value = conv(q.get(name));
    }
  };

  set('symbol', v => v || '');
  set('side', v => (v==='SHORT'?'SHORT':'LONG'));
  set('setup_date', v => v || '');
  set('entry_price', v => v || '');
  set('stop_loss', v => v || '');
  set('note', v => v || '');

  ensureSymbolDropdownForAdd();
  applyPriceFormatToAddForm();
})();

/* =====================================================
   EXPORT HTML (ringkasan + simulasi balance) — versi lama
   ===================================================== */

function downloadTextFile(filename, text, mime = 'text/html') {
  try {
    const blob = new Blob([text], { type: mime });
    if (window.navigator && window.navigator.msSaveOrOpenBlob) {
      window.navigator.msSaveOrOpenBlob(blob, filename);
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(()=>{ document.body.removeChild(a); URL.revokeObjectURL(url); },0);
  } catch (err) {
    console.error('Download failed:', err);
    alert('Gagal membuat file export. Cek Console untuk detail error.');
  }
}

/* ===== hitung statistik + simulasi (dipakai kedua export) ===== */
function computeStats(trades){
  let nDone=0,n1=0,n2=0,n3=0;
  let r1=0,r2=0,r3=0,rnet=0;
  const dates=[];
  const resultCounts = { SL:0, TP1:0, TP2:0, TP3:0 };

  for (const t of trades){
    if (t.setup_date) dates.push(t.setup_date);

    const res = t.result || '';
    const [x1,x2,x3] = rByResult(res);
    r1 += x1; r2 += x2; r3 += x3;
    rnet += netROf(res);

    const lvl = levelFromResult(res);
    if (lvl !== null){ nDone++; if(lvl>=1)n1++; if(lvl>=2)n2++; if(lvl>=3)n3++; }

    if (res==='SL')  resultCounts.SL++;
    if (res==='TP1') resultCounts.TP1++;
    if (res==='TP2') resultCounts.TP2++;
    if (res==='TP3') resultCounts.TP3++;
  }

  const cumulativeWin = {
    ge_tp1: resultCounts.TP1 + resultCounts.TP2 + resultCounts.TP3,
    ge_tp2: resultCounts.TP2 + resultCounts.TP3,
    ge_tp3: resultCounts.TP3
  };

  const pct=(x,b)=>b>0?Math.round(x/b*100):0;

  let minDate='', maxDate='';
  if (dates.length){
    const arr = dates.slice().sort();
    minDate = (arr[0]||'').replace('T',' ');
    maxDate = (arr[arr.length-1]||'').replace('T',' ');
  }

  const { base, risk } = getSettings();
  const oneR = base * (risk/100);

  const sim1   = { sumR:r1,             pnl: oneR*r1,             equity: base + oneR*r1 };
  const sim2   = { sumR:r2,             pnl: oneR*r2,             equity: base + oneR*r2 };
  const sim3   = { sumR:r3,             pnl: oneR*r3,             equity: base + oneR*r3 };
  const simAll = { sumR:r1+r2+r3,       pnl: oneR*(r1+r2+r3),     equity: base + oneR*(r1+r2+r3) };

  const seq = trades.map(t=>netROf(t.result||'')).filter(v=>v!==0);

  let curW=0,curL=0,maxW=0,maxL=0;
  for (const v of seq){
    if (v>0){ curW++; if(curW>maxW)maxW=curW; curL=0; }
    else if (v<0){ curL++; if(curL>maxL)maxL=curL; curW=0; }
  }

  let equity=base, peak=base, maxDD=0, minEq=base, maxEq=base;
  for (const v of seq){
    equity += oneR*v;
    peak = Math.max(peak, equity);
    maxDD = Math.max(maxDD, peak - equity);
    minEq = Math.min(minEq, equity);
    maxEq = Math.max(maxEq, equity);
  }
  const ddPct = peak>0 ? +(maxDD/peak*100).toFixed(2) : 0;

  let curProfitR=0, maxProfitR=0;
  for (const v of seq){
    if (v>0){ curProfitR += v; if(curProfitR>maxProfitR) maxProfitR=curProfitR; }
    else { curProfitR=0; }
  }

  const wins   = resultCounts.TP1 + resultCounts.TP2 + resultCounts.TP3;
  const losses = resultCounts.SL;

  return {
    total: trades.length,
    prob: { tp1:pct(n1,nDone), tp2:pct(n2,nDone), tp3:pct(n3,nDone) },
    rsum: { r1, r2, r3 },
    rsumTotal: rnet,
    rsumComponentsTotal: r1 + r2 + r3,
    range: { min:minDate, max:maxDate },
    results: { counts: resultCounts, cumulative: cumulativeWin, wins, losses },
    sim: {
      base, risk, oneR,
      pnl: oneR*rnet,
      equity: base + oneR*rnet,
      scenarios: { rr1:sim1, rr2:sim2, rr3:sim3, combined:simAll }
    },
    streak: {
      maxConsecWin: maxW,
      maxConsecLoss: maxL,
      maxConsecProfitR: maxProfitR,
      maxConsecProfitUSD: oneR*maxProfitR
    },
    drawdown: { maxAbs:maxDD, maxPct:ddPct, minEquity:minEq, maxEquity:maxEq }
  };
}

/* ===== template laporan HTML lama (rapi & seragam) ===== */
function buildReportHTML({ projectName, createdAt, stats }) {
  const css = `
  :root{--bg:#0b1220;--panel:#0f172a;--text:#e2e8f0;--muted:#94a3b8;--pos:#10b981;--neg:#f43f5e}
  *{box-sizing:border-box}
  body{margin:0;background:linear-gradient(#0b1220,#0a1020);color:var(--text);font:14px/1.45 system-ui,Inter,Segoe UI,Roboto}
  .wrap{max-width:1024px;margin:0 auto;padding:24px}
  .grid{display:grid;gap:12px}
  .g-4{grid-template-columns:repeat(4,1fr);align-items:stretch}
  .g-3{grid-template-columns:repeat(3,1fr);align-items:stretch}  /* <— tambahkan grid 3 kolom */
  .card{
    background:rgba(15,23,42,.9);
    border:1px solid rgba(255,255,255,.08);
    border-radius:12px;
    padding:16px;
    display:flex;flex-direction:column;justify-content:space-between;
    min-height:150px
  }
  h1{font-size:22px;margin:0 0 8px}
  .muted{color:var(--muted)} .big{font-size:22px;font-weight:700}
  .row{display:flex;gap:12px;align-items:center}
  .bar{height:8px;background:#0b7180;border-radius:2px;overflow:hidden;flex:1}
  .bar>i{display:block;height:100%;background:linear-gradient(90deg,#0ea5e9,#10b981)}
  .pos{color:var(--pos)} .neg{color:var(--neg)}
  .footer{color:#6b7280;font-size:12px;text-align:right;margin-top:24px}
  .r-list{display:flex;flex-direction:column;gap:6px;line-height:1.4}
  @media print{body{background:#fff;color:#000}.card{background:#fff;border-color:#ddd}}
  `;
  const fmt  = n => (+n).toLocaleString('id-ID',{minimumFractionDigits:2, maximumFractionDigits:2});
  const sign = n => n>=0?'pos':'neg';

  return `<!doctype html>
  <html lang="id"><head><meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Laporan — ${projectName}</title><style>${css}</style></head>
  <body><div class="wrap">

    <!-- Header -->
    <div class="card" style="margin-bottom:12px;min-height:auto">
      <h1>${projectName}</h1>
      <div class="muted">Dibuat: ${createdAt} • Rentang: ${stats.range.min||'-'} — ${stats.range.max||'-'}</div>
    </div>

    <!-- Ringkas atas: 4 kartu -->
    <div class="grid g-4" style="margin-bottom:12px">
      <div class="card"><div class="muted">Jumlah Transaksi</div><div class="big">${stats.total}</div></div>
      <div class="card"><div class="muted">Prob ≥ TP1</div><div class="row"><div class="big">${stats.prob.tp1}%</div><div class="bar"><i style="width:${stats.prob.tp1}%"></i></div></div></div>
      <div class="card"><div class="muted">Prob ≥ TP2</div><div class="row"><div class="big">${stats.prob.tp2}%</div><div class="bar"><i style="width:${stats.prob.tp2}%"></i></div></div></div>
      <div class="card"><div class="muted">Prob ≥ TP3</div><div class="row"><div class="big">${stats.prob.tp3}%</div><div class="bar"><i style="width:${stats.prob.tp3}%"></i></div></div></div>
    </div>

    <!-- RINGKAS TENGAH: dibikin 3 kolom seragam -->
    <div class="grid g-3" style="margin-bottom:12px">
      <div class="card">
        <div class="muted">ΣR Komponen (R1+R2+R3)</div>
        <div class="big ${sign(stats.rsumComponentsTotal)}">${stats.rsumComponentsTotal}</div>
      </div>

      <div class="card">
        <div class="muted">Akumulasi R</div>
        <div class="r-list">
          <div>R1: <b class="${sign(stats.rsum.r1)}">${stats.rsum.r1}</b></div>
          <div>R2: <b class="${sign(stats.rsum.r2)}">${stats.rsum.r2}</b></div>
          <div>R3: <b class="${sign(stats.rsum.r3)}">${stats.rsum.r3}</b></div>
        </div>
      </div>

      <div class="card">
        <div class="muted">Simulasi Balance</div>
        <div>Modal: <b>$${Number(stats.sim.base).toLocaleString('id-ID')}</b></div>
        <div>Risk/trade: <b>${(+stats.sim.risk).toFixed(2)}%</b> • 1R: <b>$${fmt(stats.sim.oneR)}</b></div>
      </div>
    </div>

    <!-- Skenario TP1 / TP2 / TP3 / Semua R -->
    <div class="grid g-4" style="margin-bottom:12px">
      ${['rr1','rr2','rr3','combined'].map(k=>{
        const label={rr1:'TP1',rr2:'TP2',rr3:'TP3',combined:'Semua R'}[k];
        const s=stats.sim.scenarios[k];
        return `<div class="card">
          <div class="muted">${label}</div>
          <div>Equity: <b>$${fmt(s.equity)}</b></div>
          <div>P/L: <b class="${sign(s.pnl)}">$${fmt(s.pnl)}</b></div>
          <div>ΣR: <b class="${sign(s.sumR)}">${s.sumR}</b></div>
        </div>`;
      }).join('')}
    </div>

    <!-- Statistik bawah -->
    <div class="grid g-4">
      <div class="card">
        <div class="muted">Win (kumulatif ≥ TP)</div>
        <div class="r-list">
          <div>≥ TP1: <b class="pos">${stats.results.cumulative.ge_tp1}</b>
            <span class="muted" style="font-size:12px"> (exact TP1: ${stats.results.counts.TP1})</span>
          </div>
          <div>≥ TP2: <b class="pos">${stats.results.cumulative.ge_tp2}</b>
            <span class="muted" style="font-size:12px"> (exact TP2: ${stats.results.counts.TP2})</span>
          </div>
          <div>≥ TP3: <b class="pos">${stats.results.cumulative.ge_tp3}</b>
            <span class="muted" style="font-size:12px"> (exact TP3: ${stats.results.counts.TP3})</span>
          </div>
          <div>Total Win: <b class="pos">${stats.results.wins}</b></div>
          <div class="muted">Win Streak: <b>${stats.streak.maxConsecWin}</b></div>
        </div>
      </div>

      <div class="card">
        <div class="muted">Loss</div>
        <div class="r-list">
          <div>SL: <b class="neg">${stats.results.counts.SL}</b></div>
          <div>Total Loss: <b class="neg">${stats.results.losses}</b></div>
          <div class="muted">Loss Streak: <b class="${stats.streak.maxConsecLoss>0?'neg':''}">${stats.streak.maxConsecLoss}</b></div>
        </div>
      </div>

      <div class="card">
        <div class="muted">Consec. Profit (maks)</div>
        <div><b class="pos">$${fmt(stats.streak.maxConsecProfitUSD)}</b></div>
        <div><b class="pos">${stats.streak.maxConsecProfitR}R</b></div>
      </div>

      <div class="card">
        <div class="muted">Max Drawdown</div>
        <div><b class="neg">$${fmt(stats.drawdown.maxAbs)}</b></div>
        <div><b class="neg">${stats.drawdown.maxPct}%</b></div>
      </div>
    </div>

    <div class="footer">RR Journal — Export HTML</div>
  </div></body></html>`;
}

/* ===== handler tombol Export HTML (lama) ===== */
exportHtmlBtn?.addEventListener('click', () => {
  try {
    const trades=load();
    const {name:activeName}=getActiveProject();
    const projectName=activeName||'Jurnal Aktif';

    const stats=computeStats(trades);
    const html=buildReportHTML({
      projectName,
      createdAt:new Date().toLocaleString('id-ID'),
      stats
    });
    const fname=`rr-report-${slugify(projectName)}.html`;
    downloadTextFile(fname,html,'text/html');
  } catch (e) {
    console.error('Export HTML error:', e);
    alert('Export HTML gagal: ' + (e?.message || e));
  }
});

/* =====================================================
   EXPORT PRESENTASI (baru) — dengan gambar & card per trade
   ===================================================== */

(function injectExportPresentasiButton(){
  if (!exportHtmlBtn) return;

  // 1) Kalau sudah ada tombol resmi kita, hapus dulu (supaya tidak dobel
  //    jika file JS ter-load 2x karena cache/bundle)
  const old = document.querySelector('#exportPresentBtn');
  if (old) old.remove();

  // 2) Hapus tombol "kembar" lain yang kebetulan teksnya sama tapi bukan milik kita
  //    (misal ada tombol manual di HTML). Aman karena kita sisakan hanya yang ber-ID.
  [...document.querySelectorAll('button')]
    .filter(b => b.textContent.trim() === 'Export Presentasi' && b.id !== 'exportPresentBtn')
    .forEach(b => b.remove());

  // 3) Buat tombol resmi
  const btn = document.createElement('button');
  btn.id = 'exportPresentBtn';
  btn.type = 'button';
  btn.className = 'bg-slate-900/70 ring-1 ring-white/10 px-3 py-1 rounded-lg';
  btn.textContent = 'Export Presentasi';

  // sisipkan tepat setelah "Export HTML"
  exportHtmlBtn.insertAdjacentElement('afterend', btn);

  // 4) Pasang handler
  btn.addEventListener('click', exportPresentationHTML);
})();


function exportPresentationHTML(){
  try {
    const trades = load();
    const { name:activeName } = getActiveProject();
    const projectName = activeName || 'Jurnal Aktif';
    const stats = computeStats(trades);

    const html = buildPresentationHTML({ projectName, createdAt: new Date().toLocaleString('id-ID'), trades, stats });
    const fname=`rr-presentasi-${slugify(projectName)}.html`;
    downloadTextFile(fname, html, 'text/html');
  } catch (e){
    console.error('Export Presentasi error:', e);
    alert('Export Presentasi gagal: ' + (e?.message || e));
  }
}

function buildPresentationHTML({ projectName, createdAt, trades, stats }){
  const css = `
  :root{--bg:#0b1220;--panel:#0f172a;--text:#e2e8f0;--muted:#94a3b8;--ring:rgba(255,255,255,.08);--pos:#10b981;--neg:#f43f5e;--cyan:#22d3ee;--amber:#f59e0b}
  *{box-sizing:border-box}
  body{margin:0;background:#07111f;color:var(--text);font:14px/1.5 system-ui,Inter,Segoe UI,Roboto}
  .wrap{max-width:1180px;margin:0 auto;padding:28px}
  h1{font-size:28px;margin:0 0 4px}
  .muted{color:var(--muted)}
  .cards{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin:16px 0 22px}
  .card{background:rgba(15,23,42,.88);border:1px solid var(--ring);border-radius:12px;padding:14px;min-height:72px;display:flex;flex-direction:column;gap:6px}
  .k{font-size:12px;color:var(--muted)} .v{font-size:18px;font-weight:700}
  .pos{color:var(--pos)} .neg{color:var(--neg)}
  .block{background:rgba(15,23,42,.88);border:1px solid var(--ring);border-radius:14px;padding:16px;margin:14px 0}
  .row{display:grid;grid-template-columns:1fr 1fr;gap:16px}
  .thumb{background:#0b1628;border:1px solid var(--ring);height:260px;border-radius:12px;display:flex;align-items:center;justify-content:center;overflow:hidden}
  .thumb>img{max-width:100%;max-height:100%;object-fit:contain}
  .cap{font-size:12px;color:var(--muted);margin-top:6px}
  .badge{display:inline-flex;align-items:center;gap:6px;padding:.2rem .55rem;border-radius:999px;border:1px solid var(--ring);font-size:12px}
  .LONG{background:#032a3a;color:#aaf; border-color:#0ea5e9}
  .SHORT{background:#3a1a1a;color:#ffd6d6;border-color:#f97316}
  .TP1,.TP2,.TP3{background:rgba(16,185,129,.1);color:#a7f3d0;border-color:#10b981}
  .SL{background:rgba(244,63,94,.1);color:#fecaca;border-color:#f43f5e}
  table.meta{width:100%;border-collapse:separate;border-spacing:0 8px}
  table.meta td{padding:8px 10px;border-radius:8px;background:#0c172a;border:1px solid var(--ring)}
  table.meta td.k{width:25%;color:#9fb1c5}
  table.meta td.v{text-align:right;font-weight:600}
  .eval{background:#0c172a;border:1px solid var(--ring);border-radius:8px;padding:10px 12px;min-height:120px}
  .head{display:flex;align-items:center;gap:8px;margin-bottom:12px}
  .sym{font-size:18px;font-weight:700}
  .time{font-size:12px;color:var(--muted)}
  .flex{display:flex;gap:16px}
  .grow{flex:1}
  .right{text-align:right}
  .sep{height:1px;background:var(--ring);margin:10px 0}
  @media (max-width:900px){ .row{grid-template-columns:1fr} .cards{grid-template-columns:repeat(2,1fr)} }
  @media print{ body{background:#fff;color:#000} .card,.block,.thumb,.eval{background:#fff;border-color:#ddd} }
  `;
  const fmt = n => (+n).toLocaleString('id-ID',{minimumFractionDigits:2, maximumFractionDigits:2});
  const fmt0 = n => (+n).toLocaleString('id-ID',{maximumFractionDigits:0});
  const signClass = n => n>=0 ? 'pos' : 'neg';

  const win = stats.results.wins;
  const loss = stats.results.counts.SL;

  const header = `
    <div>
     <h1>${projectName}</h1>
<div class="muted">
  Rentang: ${stats.range.min || '-'} — ${stats.range.max || '-'} • Disusun otomatis dari RR Journal
</div>
</div>

<div class="cards">
  <div class="card">
    <div class="k">Transaksi</div>
    <div class="v">${fmt0(stats.total)}</div>
  </div>

  <div class="card">
    <div class="k">Win / Loss</div>
    <div class="v">${fmt0(win)} / ${fmt0(loss)}</div>
  </div>

  <div class="card">
    <div class="k">ΣR (R1+R2+R3)</div>
    <div class="v ${signClass(stats.rsumComponentsTotal)}">${stats.rsumComponentsTotal}</div>
  </div>

  <div class="card">
    <div class="k">1R (USD)</div>
    <div class="v">$${fmt(stats.sim.oneR)}</div>
  </div>

  <div class="card">
    <div class="k">P/L (USD)</div>
    <div class="v ${signClass(stats.sim.pnl)}">$${fmt(stats.sim.pnl)}</div>
  </div>
</div>
`;

  // running P/L & Equity
  const oneR = stats.sim.oneR;
  let runR = 0;
  let runPnlUSD = 0;
  let runEq = stats.sim.base;

  // build trade cards
  const tradeCards = (trades||[]).map(t=>{
    const sym = normalizeSymbol(t.symbol);
    const prec = precisionForSymbol(sym);
    const entry = +t.entry_price || 0;
    const sl    = +t.stop_loss || 0;
    const d     = Math.abs(entry - sl);
    const tp1   = t.side==='LONG'? entry+d   : entry-d;
    const tp2   = t.side==='LONG'? entry+2*d : entry-2*d;
    const tp3   = t.side==='LONG'? entry+3*d : entry-3*d;

    const [r1,r2,r3] = rByResult(t.result||'');
    const rnet = netROf(t.result||'');

    // update running
    runR += rnet;
    runPnlUSD = runR * oneR;
    runEq = stats.sim.base + runPnlUSD;

    const imgBefore = t.img_before_data || '';
    const imgAfter  = t.img_after_data  || '';

    const price = v => toFixedBy(v, prec);

    return `
      <div class="block">
        <div class="head">
          <div class="sym">${sym}</div>
          <span class="badge ${t.side}">${t.side}</span>
          ${t.result ? `<span class="badge ${t.result}">${t.result}</span>` : ''}
          <div class="time">• ${fmtDT(t.setup_date||'')}</div>
        </div>

        <div class="row">
          <div>
            <div class="thumb">${imgBefore ? `<img src="${imgBefore}" alt="Sebelum">` : `<svg width="100%" height="100%" viewBox="0 0 600 260" preserveAspectRatio="xMidYMid meet"><path d="M20,90 L140,130 L280,60 L420,170 L580,110" fill="none" stroke="#22d3ee" stroke-width="3" stroke-linecap="round"/></svg>`}</div>
            <div class="cap">Sebelum — (placeholder/chart atau gambar sebelum)</div>
          </div>
          <div>
            <div class="thumb">${imgAfter ? `<img src="${imgAfter}" alt="Sesudah">` : `<svg width="100%" height="100%" viewBox="0 0 600 260" preserveAspectRatio="xMidYMid meet"><path d="M20,140 L210,150 L360,160 L580,110" fill="none" stroke="#22d3ee" stroke-width="3" stroke-linecap="round"/></svg>`}</div>
            <div class="cap">Sesudah — (placeholder/chart atau gambar sesudah)</div>
          </div>
        </div>

        <div class="flex" style="margin-top:12px">
          <div class="grow">
            <table class="meta">
              <tr><td class="k">Entry</td><td class="v">${price(entry)}</td><td class="k">TP1 (harga)</td><td class="v">${price(tp1)}</td><td class="k">R1</td><td class="v ${r1===0?'':(r1>0?'pos':'neg')}">${r1}</td></tr>
              <tr><td class="k">Stop Loss</td><td class="v">${price(sl)}</td><td class="k">TP2 (harga)</td><td class="v">${price(tp2)}</td><td class="k">R2</td><td class="v ${r2===0?'':(r2>0?'pos':'neg')}">${r2}</td></tr>
              <tr><td class="k">Δ (Entry–SL)</td><td class="v">${price(d)}</td><td class="k">TP3 (harga)</td><td class="v">${price(tp3)}</td><td class="k">R3</td><td class="v ${r3===0?'':(r3>0?'pos':'neg')}">${r3}</td></tr>
              <tr><td class="k">R (Net)</td><td class="v ${signClass(rnet)}">${rnet}</td><td class="k">Equity (sim)</td><td class="v">$${fmt(runEq)}</td><td class="k">P/L (sim)</td><td class="v ${signClass(runPnlUSD)}">${runPnlUSD>=0?'+':''}$${fmt(runPnlUSD)}</td></tr>
            </table>
          </div>
          <div class="eval grow">
            <div class="k" style="margin-bottom:6px">Evaluasi</div>
            <div>${(t.note||'—').replace(/\n/g,'<br>')}</div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  return `<!doctype html>
  <html lang="id"><head><meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${projectName} — Presentasi</title>
  <style>${css}</style></head>
  <body><div class="wrap">
    ${header}
    ${tradeCards || ''}
    <div class="muted" style="text-align:right;margin-top:10px">Dibuat: ${createdAt}</div>
  </div></body></html>`;
}

/* =====================================================
   Gambar: preview, drag & drop, lightbox + (BARU) PASTE / URL LINK
   ===================================================== */

const MAX_IMG_BYTES = 3 * 1024 * 1024; // ~3MB aman untuk localStorage
let lastImgKind = 'before'; // target default untuk paste URL

function isLikelyImageURL(t){
  try{
    if(!t) return false;
    if(t.startsWith('data:image/')) return true;
    const u = new URL(t);
    return ['http:','https:'].includes(u.protocol) && /\.(png|jpe?g|webp|gif|bmp|svg)(\?.*)?$/i.test(u.pathname);
  }catch{ return false; }
}

async function blobToDataURL(blob){
  return await new Promise((resolve,reject)=>{
    const fr = new FileReader();
    fr.onload = ()=>resolve(fr.result);
    fr.onerror = reject;
    fr.readAsDataURL(blob);
  });
}

async function fetchToDataURL(url){
  try{
    const res = await fetch(url, { mode:'cors' });
    if(!res.ok) throw new Error('HTTP '+res.status);
    const blob = await res.blob();
    if (blob.size > MAX_IMG_BYTES){
      alert('Ukuran gambar dari URL terlalu besar (> ~3MB). Gunakan gambar yang lebih kecil.');
      return '';
    }
    return await blobToDataURL(blob);
  }catch(err){
    console.error('Gagal fetch URL gambar:', err);
    alert('Tidak bisa memuat link gambar (mungkin CORS diproteksi atau link tidak valid).');
    return '';
  }
}

async function urlToBase64Smart(url){
  if(url.startsWith('data:image/')) return url; // sudah base64
  return await fetchToDataURL(url);
}

async function fileToBase64(file){
  if (!file) return '';
  if (file.size > MAX_IMG_BYTES){
    alert('Ukuran gambar terlalu besar. Maksimal sekitar 2–3MB.');
    return '';
  }
  return new Promise((resolve,reject)=>{
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}

function setImagePreview(kind, base64){
  if (kind==='before'){
    if (base64){
      editImgBeforeData.value = base64;
      editImgBeforePreview.src = base64;
      editImgBeforePreview.classList.remove('hidden');
      btnClearImgBefore.classList.remove('hidden');
      btnViewImgBefore.classList.remove('hidden');
    } else {
      editImgBeforeData.value = '';
      editImgBeforePreview.src = '';
      editImgBeforePreview.classList.add('hidden');
      btnClearImgBefore.classList.add('hidden');
      btnViewImgBefore.classList.add('hidden');
    }
  } else {
    if (base64){
      editImgAfterData.value = base64;
      editImgAfterPreview.src = base64;
      editImgAfterPreview.classList.remove('hidden');
      btnClearImgAfter.classList.remove('hidden');
      btnViewImgAfter.classList.remove('hidden');
    } else {
      editImgAfterData.value = '';
      editImgAfterPreview.src = '';
      editImgAfterPreview.classList.add('hidden');
      btnClearImgAfter.classList.add('hidden');
      btnViewImgAfter.classList.add('hidden');
    }
  }
}

async function handlePickFile(inputEl, kind){
  const file = inputEl.files?.[0];
  if (!file) return;
  const b64 = await fileToBase64(file);
  if (b64) setImagePreview(kind, b64);
  inputEl.value = '';
}

function setupDragDrop(areaEl, inputEl, kind){
  if (!areaEl || !inputEl) return;
  ['dragenter','dragover'].forEach(ev=> areaEl.addEventListener(ev, e=>{ e.preventDefault(); e.stopPropagation(); areaEl.classList.add('drop-active'); lastImgKind = kind; }));
  ['dragleave','dragend','drop'].forEach(ev=> areaEl.addEventListener(ev, e=>{ e.preventDefault(); e.stopPropagation(); areaEl.classList.remove('drop-active'); }));
  areaEl.addEventListener('drop', async e=>{
    const dt = e.dataTransfer; if(!dt) return;
    const file = dt.files?.[0];
    if(file){
      const b64 = await fileToBase64(file);
      if (b64) setImagePreview(kind, b64);
      return;
    }
    // Text/URL drop
    const t = dt.getData('text');
    if(isLikelyImageURL(t)){
      const b64 = await urlToBase64Smart(t.trim());
      if (b64) setImagePreview(kind, b64);
    }
  });
  areaEl.addEventListener('click', ()=> { lastImgKind = kind; inputEl.click(); });
}

/* lightbox */
function openLightbox(src){
  if (!src) return;
  imgViewerImg.src = src;
  imgViewer.classList.remove('hidden'); imgViewer.classList.add('flex');
}
function closeLightbox(){
  imgViewer.classList.add('hidden'); imgViewer.classList.remove('flex');
  imgViewerImg.src = '';
}

editImgBefore?.addEventListener('change', ()=> { lastImgKind='before'; handlePickFile(editImgBefore,'before'); });
editImgAfter?.addEventListener('change',  ()=> { lastImgKind='after';  handlePickFile(editImgAfter,'after'); });
btnClearImgBefore?.addEventListener('click', ()=> setImagePreview('before',''));
btnClearImgAfter?.addEventListener('click',  ()=> setImagePreview('after',''));
btnViewImgBefore?.addEventListener('click',   ()=> openLightbox(editImgBeforeData.value));
btnViewImgAfter?.addEventListener('click',    ()=> openLightbox(editImgAfterData.value));
imgViewerClose?.addEventListener('click', closeLightbox);
imgViewer?.addEventListener('click', e=>{ if(e.target===imgViewer) closeLightbox(); });

// drag-n-drop on labels
setupDragDrop(dropBefore, editImgBefore, 'before');
setupDragDrop(dropAfter,  editImgAfter,  'after');

/* ===== (BARU) — Tambah field URL untuk gambar + Paste global ===== */
function injectUrlBarUnder(areaEl, kind){
  if(!areaEl) return;
  const id = kind==='before' ? 'editImgBeforeUrl' : 'editImgAfterUrl';
  if (document.getElementById(id)) return; // sudah dibuat

  const wrap = document.createElement('div');
  wrap.className = 'mt-2 flex gap-2';
 wrap.innerHTML = `
  <input id="${id}" type="url" 
    placeholder="Tempel link gambar (https://… atau data:image/…)" 
    class="w-full rounded-xl border border-slate-300 bg-white text-slate-900 
           px-3 py-2 text-sm placeholder-slate-500 
           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
  <button type="button" 
    class="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-500">
    Muat
  </button>
`;

  areaEl.insertAdjacentElement('afterend', wrap);

  const input = wrap.querySelector('input');
  const btn   = wrap.querySelector('button');

  const loader = async () => {
    const url = (input.value||'').trim();
    if (!isLikelyImageURL(url)) { alert('Link tidak valid. Pakai URL file gambar langsung.'); return; }
    const b64 = await urlToBase64Smart(url);
    if (b64) setImagePreview(kind, b64);
  };

  input.addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); loader(); }});
  btn.addEventListener('click', loader);

  input.addEventListener('focus', ()=>{ lastImgKind = kind; });
}

// inject URL bar bila ada drop zone
injectUrlBarUnder(dropBefore, 'before');
injectUrlBarUnder(dropAfter,  'after');

// Global paste: jika ada URL gambar di clipboard, muat ke area terakhir yang aktif
window.addEventListener('paste', async (e)=>{
  const t = (e.clipboardData || window.clipboardData)?.getData?.('text') || '';
  if (isLikelyImageURL(t)){
    const b64 = await urlToBase64Smart(t.trim());
    if (b64) setImagePreview(lastImgKind, b64);
  }
});

/* ===== Init ===== */
(function init(){
  ensureSymbolDropdownForAdd();
  ensureSymbolDropdownForEdit();

  const s = loadSettings();
  if(baseInput) baseInput.value = (s.base ?? '');
  if(riskInput) riskInput.value = (s.risk ?? '');
  baseInput?.addEventListener('input', ()=> calcSim());
  riskInput?.addEventListener('input', ()=> calcSim());

  applyPriceFormatToAddForm();
  refresh();
  updateActiveProjectUI();
  calcSim();
})();
