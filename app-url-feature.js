/* =====================================================================
   app-url-feature.js
   Fitur: Tempel URL gambar (TradingView & file gambar), simpan base64,
          inject bar URL di bawah drop area, global paste handler.
   NON-INVASIF: semua nama diprefix __urlx_, dibungkus IIFE, guard init.
   Prasyarat: window.setImagePreview(kind, src), dropBefore, dropAfter ada.
   Optional: Netlify Function /api/get-image untuk bypass CORS.
   ===================================================================== */
(() => {
  if (window.__urlx_inited) return; window.__urlx_inited = true;
  const __urlx_MAX_BYTES = 3 * 1024 * 1024;

  function __urlx_tvToPng(raw){
    const m = String(raw).trim().match(/^https?:\/\/(www\.)?tradingview\.com\/x\/([a-z0-9]+)\/?$/i);
    return m ? `https://s3.tradingview.com/snapshots/x/${m[2]}.png` : raw;
  }
  function __urlx_looksLikeImageOrTV(raw){
    if(!raw) return false;
    if(/^data:image\//i.test(raw)) return true;
    if(/^https?:\/\/(www\.)?tradingview\.com\/x\/[a-z0-9]+\/?$/i.test(raw)) return true;
    try{
      const u = new URL(raw);
      return ['http:','https:'].includes(u.protocol) && /\.(png|jpe?g|webp|gif|bmp|svg)(\?.*)?$/i.test(u.pathname);
    }catch{ return false; }
  }
  async function __urlx_blobToDataURL(b){
    return await new Promise((res,rej)=>{ const fr=new FileReader(); fr.onloadend=()=>res(fr.result); fr.onerror=rej; fr.readAsDataURL(b); });
  }
  async function __urlx_fetchAsB64(rawUrl){
    const url = __urlx_tvToPng(rawUrl);
    try{
      const ctrl=new AbortController(); const to=setTimeout(()=>ctrl.abort(),8000);
      const r = await fetch(url,{mode:'cors',signal:ctrl.signal}); clearTimeout(to);
      if(!r.ok) throw new Error('HTTP '+r.status);
      const blob = await r.blob();
      if(blob.size>__urlx_MAX_BYTES){ alert('Ukuran gambar > ~3MB. Gunakan gambar yang lebih kecil.'); return ''; }
      return await __urlx_blobToDataURL(blob);
    }catch{
      try{
        const api=`/api/get-image?url=${encodeURIComponent(url)}`;
        const ctrl=new AbortController(); const to=setTimeout(()=>ctrl.abort(),10000);
        const r=await fetch(api,{signal:ctrl.signal}); clearTimeout(to);
        if(!r.ok) throw new Error('proxy '+r.status);
        const j=await r.json(); return j?.dataURL||'';
      }catch{ return ''; }
    }
  }

  if (typeof window.lastImgKind === 'undefined') window.lastImgKind = 'before';
  function __urlx_setImagePreviewSafe(kind, src){
    if(typeof window.setImagePreview==='function'){ window.setImagePreview(kind, src); return; }
    const id = kind==='before' ? 'editImgBeforePreview' : 'editImgAfterPreview';
    const img = document.getElementById(id); if(img){ img.src=src; img.classList.remove('hidden'); }
  }

  function __urlx_injectUrlBarUnder(areaEl, kind){
    if(!areaEl) return;
    const id = kind==='before' ? 'editImgBeforeUrl' : 'editImgAfterUrl';
    if(document.getElementById(id)) return;
    const wrap=document.createElement('div'); wrap.className='mt-2 flex gap-2';
    wrap.innerHTML=`
      <input id="${id}" type="url"
        placeholder="Tempel link (TradingView / .png / .jpg / data:image/…)"
        class="w-full rounded-xl border border-slate-300 bg-white text-slate-900
               px-3 py-2 text-sm placeholder-slate-500
               focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
      <button type="button" class="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-500">Muat</button>
    `;
    areaEl.insertAdjacentElement('afterend', wrap);
    const input=wrap.querySelector('input'); const btn=wrap.querySelector('button');

    const loader = async ()=>{
      const raw=(input.value||'').trim();
      if(!raw){ alert('Link kosong.'); return; }
      if(!__urlx_looksLikeImageOrTV(raw)){ alert('Link tidak valid. Gunakan .png/.jpg/.webp atau link share TradingView.'); return; }
      const b64=await __urlx_fetchAsB64(raw);
      if(b64) __urlx_setImagePreviewSafe(kind,b64); else __urlx_setImagePreviewSafe(kind,__urlx_tvToPng(raw));
    };
    input.addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); loader(); }});
    btn.addEventListener('click', loader);
    input.addEventListener('focus', ()=>{ window.lastImgKind = kind; });
  }

  __urlx_injectUrlBarUnder(window.dropBefore, 'before');
  __urlx_injectUrlBarUnder(window.dropAfter,  'after');

  window.addEventListener('paste', async (e)=>{
    const t=(e.clipboardData||window.clipboardData)?.getData?.('text')||'';
    if(!__urlx_looksLikeImageOrTV(t)) return;
    const raw=t.trim(); const b64=await __urlx_fetchAsB64(raw);
    if(b64) __urlx_setImagePreviewSafe(window.lastImgKind,b64); else __urlx_setImagePreviewSafe(window.lastImgKind,__urlx_tvToPng(raw));
  });

  try{ console.log('[app-url-feature] aktif'); }catch{}
})();
