import { FormEvent, useMemo, useState } from 'react';
import { BrowserRouter, Link, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Check, Flame, Search, ShieldCheck, Sparkles, ThumbsUp, X } from 'lucide-react';
import type { Company, Pitch, Product } from './types';

const companies: Company[] = [
  { id: 'google', name: 'Google', slug: 'google', description: 'Products we use every day.' },
  { id: 'spotify', name: 'Spotify', slug: 'spotify', description: 'Music and audio products.' },
  { id: 'whatsapp', name: 'WhatsApp', slug: 'whatsapp', description: 'Simple, reliable private messaging.' },
];

const products: Product[] = [
  { id: 'google-contacts', company_id: 'google', name: 'Google Contacts', slug: 'contacts' },
  { id: 'spotify', company_id: 'spotify', name: 'Spotify', slug: 'spotify' },
  { id: 'whatsapp', company_id: 'whatsapp', name: 'WhatsApp', slug: 'whatsapp' },
];

const seedPitches: Pitch[] = [
  {
    id: 'google-contacts-speed-dial', company_id: 'google', product_id: 'google-contacts',
    title: 'Add Speed Dial to Google Contacts', slug: 'speed-dial',
    body: 'Let people pin a few favorite contacts for one-tap calling and messaging.',
    support_count: 8421, status: 'open', email_milestones_sent: [1, 25, 50, 100, 500, 1000], created_at: '2026-08-17T00:00:00Z',
  },
  {
    id: 'spotify-smart-queue', company_id: 'spotify', product_id: 'spotify',
    title: 'Make the queue easier to reorder', slug: 'smart-queue',
    body: 'Give the queue a faster drag-and-drop workflow on mobile.',
    support_count: 1204, status: 'contacted', email_milestones_sent: [1, 25, 50, 100, 500, 1000], created_at: '2026-08-16T00:00:00Z',
  },
  {
    id: 'whatsapp-message-search', company_id: 'whatsapp', product_id: 'whatsapp',
    title: 'Search messages across all chats', slug: 'message-search',
    body: 'Allow one search box to find a phrase across every conversation.',
    support_count: 768, status: 'responded', email_milestones_sent: [1, 25, 50, 100, 500], created_at: '2026-08-14T00:00:00Z',
    company_response: 'Thanks for the suggestion. We are exploring better ways to make message search faster across conversations.',
    responded_at: '2026-08-16T00:00:00Z', company_response_verified: true,
  },
];

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/pitch/:company/:product/:slug" element={<PitchPage />} />
      <Route path="/submit" element={<SubmitPitch />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="brand">pitchme<span>.</span></Link>
        <nav>
          <Link to="/">Discover</Link>
          <Link to="/submit">Pitch a feature</Link>
          <Link to="/admin" className="admin-link">Admin</Link>
        </nav>
      </header>
      <main>{children}</main>
      <footer>
        <div><strong>pitchme.</strong> Make products better.</div>
        <div className="footer-note">Independent community feedback • No company affiliation implied</div>
      </footer>
    </div>
  );
}

function Home() {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return seedPitches;
    return seedPitches.filter((pitch) => `${pitch.title} ${companyName(pitch.company_id)} ${productName(pitch.product_id)}`.toLowerCase().includes(q));
  }, [query]);

  return <Layout>
    <section className="hero">
      <div className="eyebrow"><Sparkles size={15} /> Public feedback, made useful.</div>
      <h1>Something missing?<br /><span>Pitch it.</span></h1>
      <p className="hero-copy">Turn a product idea into a public request. Get people behind it. We send meaningful requests to the company and keep the response in the open.</p>
      <div className="hero-actions">
        <Link className="button primary" to="/submit">Pitch a feature <ArrowRight size={18} /></Link>
        <a className="button ghost" href="#discover">See what people want</a>
      </div>
    </section>

    <section id="discover" className="discover-section">
      <div className="section-head">
        <div>
          <div className="section-kicker">Discover</div>
          <h2>What people want changed.</h2>
        </div>
        <div className="searchbox"><Search size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products or pitches" /></div>
      </div>
      <div className="pitch-grid">
        {filtered.map((pitch) => <PitchCard key={pitch.id} pitch={pitch} />)}
      </div>
    </section>

    <section className="how-section">
      <div className="section-kicker">How it works</div>
      <div className="steps">
        <Step number="01" title="Pitch it" text="Describe the missing feature in plain language. No account needed." />
        <Step number="02" title="Get support" text="People who want the same thing can support and react to it." />
        <Step number="03" title="We reach out" text="When meaningful milestones are reached, PitchMe contacts the company." />
        <Step number="04" title="See the response" text="If the company replies, the response becomes part of the public record." />
      </div>
    </section>
  </Layout>;
}

function PitchCard({ pitch }: { pitch: Pitch }) {
  return <Link to={`/pitch/${companySlug(pitch.company_id)}/${productSlug(pitch.product_id)}/${pitch.slug}`} className="pitch-card">
    <div className="card-top"><span className="pill">{productName(pitch.product_id)}</span><StatusBadge status={pitch.status} /></div>
    <h3>{pitch.title}</h3>
    <p>{pitch.body}</p>
    <div className="card-footer"><span className="support-count"><Flame size={18} /> {formatNumber(pitch.support_count)} supporters</span><span>Open pitch <ArrowRight size={16} /></span></div>
  </Link>;
}

function PitchPage() {
  const { company, product, slug } = useParams();
  const pitch = seedPitches.find((item) => item.company_id === company && item.product_id === product && item.slug === slug);
  const [supported, setSupported] = useState(false);
  const [count, setCount] = useState(pitch?.support_count ?? 0);
  const [reaction, setReaction] = useState<string | null>(null);

  if (!pitch) return <NotFound />;
  const companyRecord = companies.find((item) => item.id === company);

  return <Layout>
    <div className="page-wrap">
      <Link to="/" className="back-link">← Back to discovery</Link>
      <div className="pitch-detail">
        <div className="detail-main">
          <div className="detail-kicker">{companyRecord?.name} / {productName(pitch.product_id)}</div>
          <h1>{pitch.title}</h1>
          <p className="detail-body">{pitch.body}</p>
          <div className="support-box">
            <div><strong>{formatNumber(count)}</strong><span>people want this</span></div>
            <button className={`button primary support-button ${supported ? 'supported' : ''}`} onClick={() => { setSupported(!supported); setCount((n) => n + (supported ? -1 : 1)); }}>
              {supported ? <Check size={18} /> : <ThumbsUp size={18} />} {supported ? 'Supported' : 'I want this too'}
            </button>
          </div>

          <div className="status-timeline">
            <TimelineItem label="Pitch created" active />
            <TimelineItem label="Community support grows" active={count >= 25} />
            <TimelineItem label="Company contacted" active={pitch.email_milestones_sent.length > 0} meta={pitch.email_milestones_sent.length ? `Milestones: ${pitch.email_milestones_sent.join(' · ')}` : undefined} />
            <TimelineItem label="Company response" active={Boolean(pitch.company_response)} />
          </div>

          {pitch.company_response && <section className="response-card">
            <div className="response-label"><ShieldCheck size={17} /> Official company response</div>
            <p>{pitch.company_response}</p>
            <div className="response-date">Responded {new Date(pitch.responded_at!).toLocaleDateString()}</div>
            <div className="reaction-row">
              {['Helpful', 'I agree', 'Not enough'].map((item) => <button key={item} className={reaction === item ? 'active' : ''} onClick={() => setReaction(item)}>{item}</button>)}
            </div>
          </section>}

          <section className="comments-placeholder">
            <div className="section-kicker">Community</div>
            <h2>What people are saying</h2>
            <p>Comments and reactions will live here. The goal is discussion around the product—not another comment section full of noise.</p>
          </section>
        </div>
      </div>
    </div>
  </Layout>;
}

function SubmitPitch() {
  const navigate = useNavigate();
  const [company, setCompany] = useState('google');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!accepted || !title.trim() || !body.trim()) return;
    setSubmitted(true);
  }

  if (submitted) return <Layout><div className="success-state"><div className="success-icon"><Check /></div><div className="section-kicker">Pitch received</div><h1>Your idea is in.</h1><p>It will be reviewed before it becomes public. There are no user accounts to manage and no inbox to watch.</p><button className="button primary" onClick={() => navigate('/')}>Back to PitchMe</button></div></Layout>;

  return <Layout><div className="form-page">
    <div className="section-kicker">Create a pitch</div>
    <h1>Give a product<br /><span>something better.</span></h1>
    <p className="form-intro">No account. No followers. Just a useful idea and the people who agree with you.</p>
    <form onSubmit={submit} className="pitch-form">
      <label>Company<select value={company} onChange={(e) => setCompany(e.target.value)}>{companies.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label>What should change?<input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Add Speed Dial to Contacts" maxLength={120} /></label>
      <label>Why does this matter?<textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} placeholder="Explain the problem and what you think would make the product better." maxLength={1200} /></label>
      <label className="consent"><input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} /><span>I understand this will be reviewed and, if accepted, publicly posted as a community pitch. I won't submit private, confidential, or abusive content.</span></label>
      <button className="button primary submit-button" disabled={!accepted || !title.trim() || !body.trim()} type="submit">Submit pitch <ArrowRight size={18} /></button>
    </form>
  </div></Layout>;
}

function Admin() {
  return <Layout><div className="admin-page">
    <div className="section-kicker">Private</div>
    <h1>Admin workspace</h1>
    <p className="form-intro">This area will be protected by Supabase Auth. V1 keeps company emails manual so you can review every request before anything leaves PitchMe.</p>
    <div className="admin-grid">
      <div className="admin-card"><span>Pending review</span><strong>0</strong><small>Connect Supabase to populate this.</small></div>
      <div className="admin-card"><span>Requests sent</span><strong>0</strong><small>Track 1 / 25 / 50 / 100 / 500 / 1000 milestones.</small></div>
      <div className="admin-card"><span>Responses</span><strong>0</strong><small>Store official company replies against pitches.</small></div>
    </div>
    <div className="milestone-panel">
      <h2>Email milestones</h2>
      <div className="milestones">{[1, 25, 50, 100, 500, 1000].map((n) => <div key={n}><b>{n}</b><span>supporters</span></div>)}</div>
      <p>Support counts remain public and continuous. Email notifications only happen at these milestones and only after your manual approval.</p>
    </div>
  </div></Layout>;
}

function TimelineItem({ label, active, meta }: { label: string; active?: boolean; meta?: string }) {
  return <div className={`timeline-item ${active ? 'active' : ''}`}><div className="timeline-dot">{active ? <Check size={13} /> : <X size={13} />}</div><div><strong>{label}</strong>{meta && <small>{meta}</small>}</div></div>;
}

function StatusBadge({ status }: { status: Pitch['status'] }) {
  const labels: Record<Pitch['status'], string> = { pending: 'Pending', open: 'Open', contacted: 'Contacted', responded: 'Responded', planned: 'Planned', in_progress: 'In progress', shipped: 'Shipped', declined: 'Declined' };
  return <span className={`status status-${status}`}>{labels[status]}</span>;
}

function Step({ number, title, text }: { number: string; title: string; text: string }) {
  return <div className="step"><span>{number}</span><h3>{title}</h3><p>{text}</p></div>;
}

function NotFound() { return <Layout><div className="success-state"><div className="section-kicker">404</div><h1>That pitch isn't here.</h1><p>Maybe it hasn't been created yet.</p><Link className="button primary" to="/">Discover pitches</Link></div></Layout>; }

function companyName(id: string) { return companies.find((item) => item.id === id)?.name ?? id; }
function companySlug(id: string) { return companies.find((item) => item.id === id)?.slug ?? id; }
function productName(id: string) { return products.find((item) => item.id === id)?.name ?? id; }
function productSlug(id: string) { return products.find((item) => item.id === id)?.slug ?? id; }
function formatNumber(n: number) { return new Intl.NumberFormat('en-US').format(n); }

export default App;
