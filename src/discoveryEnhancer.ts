import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = url && key ? createClient(url, key) : null;

const logoBase = 'https://cdn.simpleicons.org/';
const esc = (value: string) => value.replace(/[&<>'"]/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[c] as string));
const num = (v: number) => new Intl.NumberFormat('en-US').format(v);

type Row = { id:string; title:string; body:string; slug:string; support_count:number; status:string; company_id:string; product_id:string };
type Company = { id:string; name:string; slug:string };
type Product = { id:string; name:string; slug:string; company_id:string };

function card(p: Row, company?: Company, product?: Product, rank?: number) {
  const href = `/pitch/${company?.slug ?? 'company'}/${product?.slug ?? 'product'}/${p.slug}`;
  const logo = company ? `${logoBase}${company.slug}` : '';
  return `<a class="discovery-card" href="${href}">
    <div class="discovery-card-top">
      <div class="discovery-identity">${logo ? `<img src="${logo}" alt="${esc(company?.name ?? '')} logo" loading="lazy" />` : ''}<div><span>${esc(company?.name ?? '')}</span><small>${esc(product?.name ?? '')}</small></div></div>
      ${rank ? `<span class="discovery-rank">${String(rank).padStart(2,'0')}</span>` : ''}
    </div>
    <h3>${esc(p.title)}</h3>
    <p>${esc(p.body)}</p>
    <div class="discovery-meta"><span>🔥 ${num(Number(p.support_count))} supporters</span><span>${esc(p.status)}</span></div>
  </a>`;
}

async function getData() {
  if (!supabase) return { pitches:[], companies:[], products:[], error:'Supabase is not configured.' };
  const [p,c,pr] = await Promise.all([
    supabase.from('pitches').select('*').neq('status','pending').order('support_count',{ascending:false}).limit(100),
    supabase.from('companies').select('id,name,slug').order('name'),
    supabase.from('products').select('id,name,slug,company_id').order('name'),
  ]);
  const error = p.error?.message || c.error?.message || pr.error?.message || '';
  return { pitches:(p.data ?? []) as Row[], companies:(c.data ?? []) as Company[], products:(pr.data ?? []) as Product[], error };
}

function renderHome(host: HTMLElement, pitches: Row[], companies: Company[], products: Product[]) {
  const top = pitches.slice(0,10);
  host.innerHTML = `<div class="discovery-shell">
    <div class="discovery-heading"><div><div class="section-kicker">Top pitches</div><h2>What people want changed.</h2><p>Community requests with the strongest support right now.</p></div><a class="button ghost" href="/discover">View all pitches <span>→</span></a></div>
    <div class="discovery-feed discovery-topten">${top.map((p,i)=>card(p,companies.find(c=>c.id===p.company_id),products.find(pr=>pr.id===p.product_id),i+1)).join('')}</div>
  </div>`;
}

function renderDiscover(host: HTMLElement, all: Row[], companies: Company[], products: Product[]) {
  let query=''; let sort='support'; let companyFilter='all';
  const draw=()=>{
    const filtered=all.filter(p=>{const c=companies.find(x=>x.id===p.company_id);const pr=products.find(x=>x.id===p.product_id);const hay=`${p.title} ${p.body} ${c?.name??''} ${pr?.name??''}`.toLowerCase();return hay.includes(query.toLowerCase()) && (companyFilter==='all'||c?.slug===companyFilter);});
    const sorted=[...filtered].sort((a,b)=>sort==='recent'?+new Date((b as any).created_at)-+new Date((a as any).created_at):Number(b.support_count)-Number(a.support_count));
    host.querySelector<HTMLElement>('.discovery-feed')!.innerHTML=sorted.map(p=>card(p,companies.find(c=>c.id===p.company_id),products.find(pr=>pr.id===p.product_id))).join('') || '<div class="discovery-empty">No pitches match your search.</div>';
  };
  host.innerHTML=`<div class="discovery-shell discovery-page"><div class="discovery-heading"><div><div class="section-kicker">Discover</div><h1>What people want changed.</h1><p>Browse the public requests people are backing.</p></div></div>
  <div class="discovery-toolbar"><label class="discovery-search"><span>⌕</span><input aria-label="Search pitches" placeholder="Search products, companies, pitches" /></label><select class="discovery-filter" aria-label="Filter company"><option value="all">All companies</option>${companies.map(c=>`<option value="${c.slug}">${esc(c.name)}</option>`).join('')}</select><select class="discovery-filter" aria-label="Sort"><option value="support">Most supported</option><option value="recent">Newest</option></select></div>
  <div class="discovery-feed"></div></div>`;
  host.querySelector<HTMLInputElement>('input')!.addEventListener('input',(e)=>{query=(e.target as HTMLInputElement).value;draw();});
  const selects=host.querySelectorAll<HTMLSelectElement>('select'); selects[0].addEventListener('change',(e)=>{companyFilter=(e.target as HTMLSelectElement).value;draw();}); selects[1].addEventListener('change',(e)=>{sort=(e.target as HTMLSelectElement).value;draw();});
  draw();
}

let lastPath='';
export function initDiscovery() {
  const run=async()=>{
    if(location.pathname===lastPath && document.querySelector('.discovery-shell')) return;
    lastPath=location.pathname;
    const data=await getData();
    if(data.error) return;
    if(location.pathname==='/' || location.pathname==='/discover') {
      const existing=Array.from(document.querySelectorAll('main > section, main > div')).find((el)=>el.querySelector('.discover-section')) as HTMLElement | undefined;
      if(location.pathname==='/' && existing) { existing.classList.add('legacy-discovery-hidden'); const host=document.createElement('section'); host.className='discover-enhanced'; existing.after(host); renderHome(host,data.pitches,data.companies,data.products); }
      if(location.pathname==='/discover') { const legacy=document.querySelector('main > .page-wrap') as HTMLElement | null; if(legacy){ legacy.classList.add('legacy-discovery-hidden'); const host=document.createElement('div'); host.className='discover-enhanced'; legacy.replaceWith(host); renderDiscover(host,data.pitches,data.companies,data.products); } }
    }
  };
  run();
  window.addEventListener('popstate',()=>setTimeout(run,50));
}
