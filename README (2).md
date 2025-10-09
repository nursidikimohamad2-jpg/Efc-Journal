# RR Journal — Netlify (no-backend)

Single-page app untuk jurnal trading berbasis R-R, menyimpan data di `localStorage`.
Mendukung:
- Input trade, hitung TP1/TP2/TP3 otomatis dari jarak Entry–SL
- R bersusun, probabilitas ≥ TP1/TP2/TP3
- Simulasi Balance: set **Modal (USD)** & **Risk %/trade** → 1R, P/L, dan Equity dihitung otomatis (berdasar ΣR final)
- Projects (snapshot) dengan penyimpanan **trades + settings (modal & risk)** per project
- Export/Import JSON dan Export HTML report

## Deploy
1. Unduh ZIP lalu upload ke Netlify (drag&drop).
2. Atau gh-pages: push `index.html` & `app.js` ke repo Anda.

## Kustomisasi
- Ubah tampilan via Tailwind (CDN).
- Semua logika ada di `app.js`.
