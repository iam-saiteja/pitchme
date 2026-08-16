import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ArrowRight, Check, Flame, LogOut, Search, ShieldCheck, Sparkles, ThumbsUp, X } from 'lucide-react';
import { Link, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import type { Company, Pitch, Product, PitchStatus } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
const milestones = [1, 25, 50, 100, 500, 1000];

function fingerprint() {
  const key = 'pitchme-anon-id';
  let value = localStorage.getItem(key);
  if (!value) { value = crypto.randomUUID(); localStorage.setItem(key, value); }
  return value;
}
function slugify(value: string) { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }
function formatNumber(value: number) { return new Intl.NumberFormat('en-US').format(value); }

function App() {
  return <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/pitch/:company/:product/:slug" element={<PitchPage />} />
    <Route path="/submit" element={<SubmitPitch />} />
    <Route path="/admin" element={<Admin />} />
    <Route path="*" element={<NotFound />} />
  </Routes>;
}

function Layout({ children }: { children: React.ReactNode }) {
  return <div className="app-shell">
    <header className="topbar"><Link to="/" className="brand">pitchme<span>.</span></Link><nav><Link to="/">Discover</Link><Link to="/submit">Pitch a feature</Link><Link to="/admin" className="admin-link">Admin</Link></nav></header>
    <main>{children}</main>
    <footer><div><strong>pitchme.</strong> Make products better.</div><div className="footer-note">Independent community feedback • No company affiliation implied</div></footer>
  </div>;
}

function Home() {
  const [query, setQuery] = useState('');
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  useEffect(() => { loadDiscovery(); }, []);
  async function loadDiscovery() {
    if (!supabase) return;
    const [{ data: ps }, { data: cs }, { data: prs }] = await Promise.all([
      supabase.from('pitches').select('*').neq('status', 'pending').order('support_count', { ascending: false }).limit(50),
      supabase.from('companies').select('*').order('name'),
      supabase.from('products').select('*').order('name'),
    ]);
    setPitches((ps ?? []) as Pitch[]); setCompanies((cs ?? []) as Company[]); setProducts((prs ?? []) as Product[]);
  }
  const filtered = useMemo(() => pitches.filter(p => `${p.title} ${companies.find(c => c.id === p.company_id)?.name ?? ''} ${products.find(x => x.id === p.product_id)?.name ?? ''}`.toLowerCase().includes(query.toLowerCase().trim())), [pitches, companies, products, query]);
  return <Layout>
    <section className="hero"><div className="eyebrow"><Sparkles size={15} /> Public feedback, made useful.</div><h1>Something missing?<br /><span>Pitch it.</span></h1><p className="hero-copy">Turn a product idea into a public request. Get people behind it. When meaningful milestones are reached, we contact the company and keep its response in the open.</p><div className="hero-actions"><Link className="button primary" to="/submit">Pitch a feature <ArrowRight size={18} /></Link><a className="button ghost" href="#discover">See what people want</a></div></section>
    <section id="discover" className="discover-section"><div className="section-head"><div><div className="section-kicker">Discover</div><h2>What people want changed.</h2></div><div className="searchbox"><Search size={17} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search products or pitches" /></div></div>
      {!supabase ? <Empty text="Supabase is not configured for this deployment yet." /> : filtered.length === 0 ? <Empty text="No published pitches yet. Be the first to pitch something." /> : <div className="pitch-grid">{filtered.map(p => <PitchCard key={p.id} pitch={p} companies={companies} products={products} />)}</div>}
    </section>
    <section className="how-section"><div className="section-kicker">How it works</div><div className="steps"><Step number="01" title="Pitch it" text="Describe the missing feature in plain language. No account needed." /><Step number="02" title="Get support" text="People who want the same thing can support it without signing up." /><Step number="03" title="We reach out" text="At 1, 25, 50, 100, 500 and 1000 supporters, the admin can contact the company manually." /><Step number="04" title="See the response" text="If the company replies, its response becomes part of the public record." /></div></section>
  </Layout>;
}
function Empty({ text }: { text: string }) { return <div className="comments-placeholder"><p>{text}</p></div>; }
function PitchCard({ pitch, companies, products }: { pitch: Pitch; companies: Company[]; products: Product[] }) {
  const company = companies.find(c => c.id === pitch.company_id); const product = products.find(p => p.id === pitch.product_id);
  return <Link to={`/pitch/${company?.slug ?? pitch.company_id}/${product?.slug ?? pitch.product_id}/${pitch.slug}`} className="pitch-card"><div className="card-top"><span className="pill">{product?.name ?? 'Product'}</span><StatusBadge status={pitch.status} /></div><h3>{pitch.title}</h3><p>{pitch.body}</p><div className="card-footer"><span className="support-count"><Flame size={18} /> {formatNumber(pitch.support_count)} supporters</span><span>Open pitch <ArrowRight size={16} /></span></div></Link>;
}

function PitchPage() {
  const { company, product, slug } = useParams();
  const [pitch, setPitch] = useState<Pitch | null>(null); const [companyRecord, setCompany] = useState<Company | null>(null); const [productRecord, setProduct] = useState<Product | null>(null); const [supported, setSupported] = useState(false); const [reaction, setReaction] = useState<string | null>(null); const [comment, setComment] = useState(''); const [message, setMessage] = useState('');
  useEffect(() => { loadPitch(); }, [company, product, slug]);
  async function loadPitch() {
    if (!supabase) return;
    const { data: cs } = await supabase.from('companies').select('*').eq('slug', company).maybeSingle();
    const { data: ps } = await supabase.from('products').select('*').eq('slug', product).maybeSingle();
    if (!cs || !ps) return;
    const { data: p } = await supabase.from('pitches').select('*').eq('company_id', cs.id).eq('product_id', ps.id).eq('slug', slug).neq('status', 'pending').maybeSingle();
    if (p) setPitch(p as Pitch); setCompany(cs as Company); setProduct(ps as Product);
  }
  async function support() {
    if (!supabase || !pitch || supported) return;
    const { data } = await supabase.rpc('increment_support', { p_pitch_id: pitch.id, p_fingerprint: fingerprint() });
    if (data !== null) { setPitch({ ...pitch, support_count: Number(data) }); setSupported(true); }
  }
  async function reactTo(kind: string) {
    if (!supabase || !pitch) return;
    const { error } = await supabase.from('pitch_reactions').upsert({ pitch_id: pitch.id, fingerprint: fingerprint(), reaction: kind }, { onConflict: 'pitch_id,fingerprint' });
    if (!error) setReaction(kind);
  }
  async function addComment(e: FormEvent) {
    e.preventDefault(); if (!supabase || !pitch || !comment.trim()) return;
    const { error } = await supabase.from('comments').insert({ pitch_id: pitch.id, fingerprint: fingerprint(), body: comment.trim(), approved: false });
    setMessage(error ? 'Could not submit the comment.' : 'Comment submitted for review.'); if (!error) setComment('');
  }
  if (!supabase) return <NotFound />;
  if (!pitch) return <Layout><div className="success-state"><div className="section-kicker">Loading</div><h1>Finding that pitch.</h1></div></Layout>;
  return <Layout><div className="page-wrap"><Link to="/" className="back-link">← Back to discovery</Link><div className="pitch-detail"><div className="detail-main"><div className="detail-kicker">{companyRecord?.name} / {productRecord?.name}</div><h1>{pitch.title}</h1><p className="detail-body">{pitch.body}</p><div className="support-box"><div><strong>{formatNumber(pitch.support_count)}</strong><span>people want this</span></div><button className="button primary support-button" onClick={support}>{supported ? <Check size={18} /> : <ThumbsUp size={18} />} {supported ? 'Supported' : 'I want this too'}</button></div>
    <div className="status-timeline"><TimelineItem label="Pitch created" active /><TimelineItem label="Community support grows" active={pitch.support_count >= 25} /><TimelineItem label="Company contacted" active={pitch.email_milestones_sent?.length > 0} meta={pitch.email_milestones_sent?.length ? `Milestones: ${pitch.email_milestones_sent.join(' · ')}` : 'Waiting for a milestone'} /><TimelineItem label="Company response" active={Boolean(pitch.company_response)} /></div>
    {pitch.company_response && <section className="response-card"><div className="response-label"><ShieldCheck size={17} /> Official company response</div><p>{pitch.company_response}</p><div className="response-date">Responded {pitch.responded_at ? new Date(pitch.responded_at).toLocaleDateString() : ''}</div><div className="reaction-row">{[['helpful','Helpful'],['agree','I agree'],['not_enough','Not enough']].map(([value,label]) => <button key={value} className={reaction === value ? 'active' : ''} onClick={() => reactTo(value)}>{label}</button>)}</div></section>}
    <section className="comments-placeholder"><div className="section-kicker">Community</div><h2>What people are saying</h2><form className="pitch-form" onSubmit={addComment}><textarea value={comment} onChange={e => setComment(e.target.value)} rows={4} maxLength={1000} placeholder="Add something useful to the discussion..." /><button className="button ghost submit-button" disabled={!comment.trim()}>Post comment</button></form>{message && <p>{message}</p>}</section>
  </div></div></div></Layout>;
}

function SubmitPitch() {
  const navigate = useNavigate(); const [companies, setCompanies] = useState<Company[]>([]); const [products, setProducts] = useState<Product[]>([]); const [companyId, setCompanyId] = useState(''); const [productId, setProductId] = useState(''); const [title, setTitle] = useState(''); const [body, setBody] = useState(''); const [suggestedSlug, setSuggestedSlug] = useState(''); const [accepted, setAccepted] = useState(false); const [done, setDone] = useState(false); const [error, setError] = useState('');
  useEffect(() => { if (!supabase) return; Promise.all([supabase.from('companies').select('*').order('name'), supabase.from('products').select('*').order('name')]).then(([c,p]) => { const cs=(c.data??[]) as Company[]; setCompanies(cs); setProducts((p.data??[]) as Product[]); if(cs[0]) setCompanyId(cs[0].id); }); }, []);
  const availableProducts = products.filter(p => p.company_id === companyId);
  useEffect(() => { if (availableProducts[0]) setProductId(availableProducts[0].id); else setProductId(''); }, [companyId, products.length]);
  async function submit(e: FormEvent) { e.preventDefault(); setError(''); if (!supabase || !accepted || !companyId || !productId) return; const { data, error: err } = await supabase.rpc('submit_pitch', { p_company_id: companyId, p_product_id: productId, p_title: title, p_body: body, p_suggested_slug: suggestedSlug || null }); if (err || !data) setError(err?.message ?? 'Could not submit the pitch.'); else setDone(true); }
  if (done) return <Layout><div className="success-state"><div className="success-icon"><Check /></div><div className="section-kicker">Pitch received</div><h1>Your idea is in.</h1><p>It will be reviewed before becoming public. There is no account to manage.</p><button className="button primary" onClick={() => navigate('/')}>Back to PitchMe</button></div></Layout>;
  return <Layout><div className="form-page"><div className="section-kicker">Create a pitch</div><h1>Give a product<br /><span>something better.</span></h1><p className="form-intro">No account. No followers. Just a useful idea and the people who agree with you.</p><form onSubmit={submit} className="pitch-form"><label>Company<select value={companyId} onChange={e => setCompanyId(e.target.value)}>{companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Product<select value={productId} onChange={e => setProductId(e.target.value)}>{availableProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label>What should change?<input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Add Speed Dial to Contacts" maxLength={140} /></label><label>Preferred URL slug <span style={{fontWeight:400,color:'#71717a'}}>(optional — admin has final say)</span><input value={suggestedSlug} onChange={e => setSuggestedSlug(slugify(e.target.value))} placeholder="speed-dial" maxLength={80} /></label><label>Why does this matter?<textarea value={body} onChange={e => setBody(e.target.value)} rows={7} placeholder="Explain the problem and what would make the product better." maxLength={2000} /></label><label className="consent"><input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} /><span>I understand this will be reviewed and, if accepted, publicly posted. I won't submit private, confidential, or abusive content.</span></label>{error && <p style={{color:'#fda4af'}}>{error}</p>}<button className="button primary submit-button" disabled={!accepted || !title.trim() || body.trim().length < 20 || !companyId || !productId}>Submit pitch <ArrowRight size={18} /></button></form></div></Layout>;
}

function Admin() {
  const [session, setSession] = useState<any>(null); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [pending, setPending] = useState<Pitch[]>([]); const [companies, setCompanies] = useState<Company[]>([]); const [products, setProducts] = useState<Product[]>([]); const [selected, setSelected] = useState<Pitch | null>(null); const [response, setResponse] = useState('');
  useEffect(() => { if (!supabase) return; supabase.auth.getSession().then(({data}) => setSession(data.session)); const {data:listener}=supabase.auth.onAuthStateChange((_e,s)=>setSession(s)); return ()=>listener.subscription.unsubscribe(); }, []);
  useEffect(() => { if (session) loadAdmin(); }, [session]);
  async function login(e: FormEvent) { e.preventDefault(); if (!supabase) return; const {data,error:err}=await supabase.auth.signInWithPassword({email,password}); if(err) setError(err.message); else setSession(data.session); }
  async function loadAdmin() { if (!supabase) return; const {data:ps}=await supabase.from('pitches').select('*').eq('status','pending').order('created_at',{ascending:false}); const {data:cs}=await supabase.from('companies').select('*').order('name'); const {data:prs}=await supabase.from('products').select('*').order('name'); setPending((ps??[]) as Pitch[]); setCompanies((cs??[]) as Company[]); setProducts((prs??[]) as Product[]); }
  async function publish(p: Pitch) { if (!supabase) return; const preferred = p.slug || slugify(p.title); const {error:err}=await supabase.rpc('publish_pitch',{p_id:p.id,p_slug:preferred,p_status:'open'}); if(err) setError(err.message); else {setSelected(null); loadAdmin();} }
  async function markMilestone(p: Pitch, milestone: number) { if (!supabase) return; const {error:err}=await supabase.from('email_milestone_events').insert({pitch_id:p.id,milestone,notes:'Manually sent by PitchMe admin.'}); if(err) setError(err.message); else { await supabase.from('pitches').update({email_milestones_sent:[...(p.email_milestones_sent??[]),milestone],last_email_milestone:milestone,status:'contacted',contacted_at:new Date().toISOString()}).eq('id',p.id); loadAdmin(); setSelected(null); } }
  async function saveResponse(p: Pitch) { if (!supabase || !response.trim()) return; const now=new Date().toISOString(); const {error:err}=await supabase.from('company_responses').insert({pitch_id:p.id,body:response.trim(),verified:true,published_at:now,received_at:now}); if(err) setError(err.message); else {await supabase.from('pitches').update({company_response:response.trim(),company_response_verified:true,responded_at:now,status:'responded'}).eq('id',p.id); setResponse(''); setSelected(null); loadAdmin();} }
  if (!session) return <Layout><div className="form-page"><div className="section-kicker">Private workspace</div><h1>Admin<br /><span>sign in.</span></h1><p className="form-intro">Only your Supabase-authenticated admin account can manage pitches and company outreach.</p><form className="pitch-form" onSubmit={login}><label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" /></label><label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" /></label>{error&&<p style={{color:'#fda4af'}}>{error}</p>}<button className="button primary">Sign in</button></form></div></Layout>;
  return <Layout><div className="admin-page"><div style={{display:'flex',justifyContent:'space-between',gap:15,alignItems:'center'}}><div><div className="section-kicker">Private</div><h1>Admin workspace</h1></div><button className="button ghost" onClick={()=>supabase?.auth.signOut()}><LogOut size={16}/> Sign out</button></div><p className="form-intro">Review first. Publish when ready. Send company email manually at each milestone, then record it here.</p><div className="admin-grid"><div className="admin-card"><span>Pending review</span><strong>{pending.length}</strong><small>New pitches waiting for you.</small></div><div className="admin-card"><span>Milestones</span><strong>{milestones.length}</strong><small>1 / 25 / 50 / 100 / 500 / 1000</small></div><div className="admin-card"><span>Products</span><strong>{products.length}</strong><small>{companies.length} companies in the directory.</small></div></div><div className="milestone-panel"><h2>Pending pitches</h2>{pending.length===0?<p>No pitches waiting. Nice.</p>:pending.map(p=><div key={p.id} style={{padding:'18px 0',borderTop:'1px solid #24242b'}}><strong>{p.title}</strong><p style={{color:'#71717a',fontSize:12}}>{companies.find(c=>c.id===p.company_id)?.name} / {products.find(x=>x.id===p.product_id)?.name} · suggested slug: {p.slug}</p><div style={{display:'flex',gap:8,flexWrap:'wrap'}}><button className="button primary" onClick={()=>publish(p)}>Publish</button><button className="button ghost" onClick={()=>setSelected(p)}>Review</button></div></div>)}</div>{selected&&<div className="milestone-panel" style={{marginTop:16}}><h2>{selected.title}</h2><p>{selected.body}</p><p style={{color:'#71717a',fontSize:12}}>Suggested slug: {selected.slug}</p><div className="milestones">{milestones.map(m=><button key={m} disabled={(selected.email_milestones_sent??[]).includes(m)} onClick={()=>markMilestone(selected,m)}>{m}<span>supporters</span></button>)}</div><textarea value={response} onChange={e=>setResponse(e.target.value)} rows={5} placeholder="Paste an official company response here when one arrives." style={{width:'100%',background:'#0f0f13',border:'1px solid #282830',color:'#fff',borderRadius:10,padding:12}} /><div style={{display:'flex',gap:8,marginTop:12}}><button className="button primary" onClick={()=>saveResponse(selected)} disabled={!response.trim()}>Publish response</button><button className="button ghost" onClick={()=>setSelected(null)}>Close</button></div></div>}</div></Layout>;
}
function TimelineItem({label,active,meta}:{label:string;active?:boolean;meta?:string}){return <div className={`timeline-item ${active?'active':''}`}><div className="timeline-dot">{active?<Check size={13}/>:<X size={13}/>}</div><div><strong>{label}</strong>{meta&&<small>{meta}</small>}</div></div>}
function StatusBadge({status}:{status:PitchStatus}){const labels:Record<PitchStatus,string>={pending:'Pending',open:'Open',contacted:'Contacted',responded:'Responded',planned:'Planned',in_progress:'In progress',shipped:'Shipped',declined:'Declined'};return <span className={`status status-${status}`}>{labels[status]}</span>}
function Step({number,title,text}:{number:string;title:string;text:string}){return <div className="step"><span>{number}</span><h3>{title}</h3><p>{text}</p></div>}
function NotFound(){return <Layout><div className="success-state"><div className="section-kicker">404</div><h1>That pitch isn't here.</h1><p>Maybe it hasn't been published yet.</p><Link className="button primary" to="/">Discover pitches</Link></div></Layout>}
export default App;
