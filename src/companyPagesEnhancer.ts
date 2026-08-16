import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = url && key ? createClient(url, key) : null;
const logoMap: Record<string, string> = {
  google: 'google', openai: 'openai', anthropic: 'claude', netflix: 'netflix', apple: 'apple', microsoft: 'microsoft', github: 'github', spotify: 'spotify', whatsapp: 'whatsapp', notion: 'notion', figma: 'figma', discord: 'discord', slack: 'slack', youtube: 'youtube', amazon: 'amazon', duolingo: 'duolingo', linear: 'linear', canva: 'canva', dropbox: 'dropbox', zoom: 'zoom',
};
const logoUrl = (slug: string) => `https://cdn.simpleicons.org/${logoMap[slug] || slug}`;
const esc = (v: string) => v.replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c] as string));
const fmt = (v: number) => new Intl.NumberFormat('en-US').format(v);
function fallback(name: string) { const first = name.trim().charAt(0).toUpperCase(); return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" rx="24" fill="#18181b"/><text x="48" y="58" text-anchor="middle" font-family="Arial" font-size="40" font-weight="700" fill="#f4f4f5">${first}</text></svg>`)}`; }
function logo(slug: string, name: string, size = 72) { return `<img class="cp-logo" style="width:${size}px;height:${size}px" src="${logoUrl(slug)}" alt="${esc(name)} logo" onerror="this.onerror=null;this.src='${fallback(name)}'" />`; }

async function load() {
  if (!supabase) return;
  const pathname = location.pathname;
  if (!pathname.startsWith('/company') && pathname !== '/companies') return;
  const host = document.querySelector<HTMLElement>('main');
  if (!host || host.dataset.companyEnhanced === pathname) return;
  const [companiesRes, productsRes, pitchesRes] = await Promise.all([
    supabase.from('companies').select('*').order('name'),
    supabase.from('products').select('*').order('name'),
    supabase.from('pitches').select('*').neq('status','pending').order('support_count',{ascending:false}).limit(200),
  ]);
  if (companiesRes.error || productsRes.error || pitchesRes.error) return;
  const companies = (companiesRes.data ?? []) as any[];
  const products = (productsRes.data ?? []) as any[];
  const pitches = (pitchesRes.data ?? []) as any[];
  host.dataset.companyEnhanced = pathname;

  if (pathname === '/companies') {
    const old = host.querySelector('.page-wrap'); if (!old) return;
    const wrap = document.createElement('div'); wrap.className = 'cp-directory page-wrap';
    wrap.innerHTML = `<div class="cp-eyebrow">Directory</div><div class="cp-directory-head"><div><h1>Companies people pitch.</h1><p>Explore products, see what their users are asking for, and open the conversation.</p></div><a class="button primary" href="/submit">Pitch a feature</a></div><div class="cp-company-grid">${companies.map(c => { const ps = pitches.filter(p=>p.company_id===c.id); const total=ps.reduce((s,p)=>s+Number(p.support_count||0),0); return `<a class="cp-company-card" href="/company/${c.slug}"><div class="cp-company-top">${logo(c.slug,c.name)}<span class="cp-open">Open <span>↗</span></span></div><h2>${esc(c.name)}</h2><p>${esc(c.description || 'Community feedback and product requests.')}</p><div class="cp-meta"><span>${ps.length} ${ps.length===1?'pitch':'pitches'}</span><span>${fmt(total)} supporters</span></div></a>`; }).join('')}</div><div class="cp-attribution">Company names and logos belong to their respective owners. Logos are displayed for identification only. Logo icons provided by <a href="https://simpleicons.org/" target="_blank" rel="noreferrer">Simple Icons</a>.</div>`;
    old.replaceWith(wrap);
    return;
  }

  const slug = pathname.split('/')[2];
  const company = companies.find(c=>c.slug===slug); if (!company) return;
  const old = host.querySelector('.page-wrap'); if (!old) return;
  const companyProducts = products.filter(p=>p.company_id===company.id);
  const companyPitches = pitches.filter(p=>p.company_id===company.id);
  const totalSupport = companyPitches.reduce((s,p)=>s+Number(p.support_count||0),0);
  const top = [...companyPitches].sort((a,b)=>Number(b.support_count)-Number(a.support_count)).slice(0,5);
  const productCount = companyProducts.length;
  const wrap = document.createElement('div'); wrap.className='cp-page page-wrap';
  wrap.innerHTML = `<a href="/companies" class="back-link">Back to companies</a><header class="cp-hero"><div class="cp-hero-main"><div class="cp-logo-hero">${logo(company.slug,company.name,88)}</div><div><div class="cp-eyebrow">Company</div><h1>${esc(company.name)}</h1><p>${esc(company.description || 'A public space for community product feedback.')}</p><div class="cp-hero-links">${company.website?`<a class="button ghost" href="${esc(company.website)}" target="_blank" rel="noreferrer">Visit website ↗</a>`:''}<a class="button primary" href="/submit">Pitch a feature</a></div></div></div><div class="cp-stats"><div><strong>${productCount}</strong><span>products</span></div><div><strong>${companyPitches.length}</strong><span>public pitches</span></div><div><strong>${fmt(totalSupport)}</strong><span>supporters</span></div></div></header><section class="cp-section"><div class="cp-section-head"><div><div class="cp-eyebrow">Products</div><h2>Products people use.</h2></div><span>${productCount} listed</span></div><div class="cp-products">${companyProducts.map(p=>{const count=companyPitches.filter(x=>x.product_id===p.id).length; return `<a href="/company/${company.slug}${count?`#product-${p.slug}`:''}" class="cp-product" id="product-${p.slug}"><span class="cp-product-mark">✦</span><div><strong>${esc(p.name)}</strong><small>${count} ${count===1?'request':'requests'}</small></div><span>↗</span></a>`;}).join('')}</div></section><section class="cp-section"><div class="cp-section-head"><div><div class="cp-eyebrow">Community demand</div><h2>Top requests.</h2></div><span>${companyPitches.length} total</span></div>${top.length?`<div class="cp-pitches">${top.map((p,i)=>{const pr=companyProducts.find(x=>x.id===p.product_id); return `<a class="cp-pitch" href="/pitch/${company.slug}/${pr?.slug||'product'}/${p.slug}"><div class="cp-rank">${String(i+1).padStart(2,'0')}</div><div class="cp-pitch-copy"><div class="cp-product-label">${esc(pr?.name||'Product')}</div><h3>${esc(p.title)}</h3><p>${esc(p.body)}</p><div class="cp-pitch-meta"><span>🔥 ${fmt(Number(p.support_count))} supporters</span><span>${esc(p.status)}</span></div></div><span class="cp-pitch-arrow">↗</span></a>`;}).join('')}</div>`:'<div class="cp-empty"><h3>No published pitches yet.</h3><p>Be the first person to suggest a useful change.</p><a class="button primary" href="/submit">Pitch a feature</a></div>'}</section><section class="cp-note">${logo(company.slug,company.name,28)}<p>Company names, product names, trademarks, and logos belong to their respective owners. PitchMe is an independent community project and is not affiliated with or endorsed by ${esc(company.name)}. Logos shown for identification only.</p></section>`;
  old.replaceWith(wrap);
}

let last = '';
export function initCompanyPages() {
  const run = () => { if (location.pathname !== last) { last = location.pathname; void load(); } };
  run();
  window.addEventListener('popstate', () => setTimeout(run, 50));
  const timer = window.setInterval(run, 250);
  return () => window.clearInterval(timer);
}
