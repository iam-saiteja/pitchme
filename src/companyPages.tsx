import { ArrowUpRight, Flame, Globe2, MessageSquare, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Company, Pitch, Product } from './types';

const fallbackLogo = (company: Company) => {
  const first = company.name.trim().charAt(0).toUpperCase();
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="24" fill="#18181b"/><text x="48" y="57" text-anchor="middle" font-family="Arial, sans-serif" font-size="40" font-weight="700" fill="#f4f4f5">${first}</text></svg>`)}`;
};

export function CompanyLogo({ company, size = 'md' }: { company: Company; size?: 'sm' | 'md' | 'lg' }) {
  const src = company.logo_url || fallbackLogo(company);
  return <img className={`company-logo company-logo-${size}`} src={src} alt="" loading="lazy" onError={(e) => { e.currentTarget.src = fallbackLogo(company); }} />;
}

export function CompanyCard({ company, pitches = [] }: { company: Company; pitches?: Pitch[] }) {
  const count = pitches.filter(p => p.company_id === company.id).length;
  const supporters = pitches.filter(p => p.company_id === company.id).reduce((sum, p) => sum + Number(p.support_count || 0), 0);
  return <Link to={`/company/${company.slug}`} className="company-card">
    <div className="company-card-top"><CompanyLogo company={company} size="md"/><span className="company-card-arrow"><ArrowUpRight size={17}/></span></div>
    <div className="company-card-copy"><h3>{company.name}</h3><p>{company.description || 'Explore the products people use and the changes they want next.'}</p></div>
    <div className="company-card-meta"><span>{count} {count === 1 ? 'pitch' : 'pitches'}</span><span>{supporters.toLocaleString()} supporters</span></div>
  </Link>;
}

export function CompanyPageView({ company, products, pitches }: { company: Company; products: Product[]; pitches: Pitch[] }) {
  const companyPitches = pitches.filter(p => p.company_id === company.id).sort((a,b) => Number(b.support_count) - Number(a.support_count));
  const totalSupport = companyPitches.reduce((sum,p) => sum + Number(p.support_count || 0), 0);
  const topProductIds = new Set(companyPitches.slice(0, 6).map(p => p.product_id));
  const companyProducts = products.filter(p => p.company_id === company.id);

  return <div className="company-page-wrap">
    <Link to="/companies" className="back-link">Back to companies</Link>
    <header className="company-hero">
      <div className="company-hero-identity"><div className="company-logo-frame"><CompanyLogo company={company} size="lg"/></div><div><div className="section-kicker">Company</div><h1>{company.name}</h1><p>{company.description || 'A public page for community product feedback.'}</p></div></div>
      <div className="company-hero-actions">{company.website && <a className="button ghost" href={company.website} target="_blank" rel="noreferrer"><Globe2 size={16}/> Website <ArrowUpRight size={15}/></a>}<Link className="button primary" to={`/submit`}>Pitch a feature</Link></div>
      <div className="company-stats"><div><strong>{companyProducts.length}</strong><span>products</span></div><div><strong>{companyPitches.length}</strong><span>public pitches</span></div><div><strong>{totalSupport.toLocaleString()}</strong><span>supporters</span></div></div>
    </header>

    <section className="company-section"><div className="company-section-head"><div><div className="section-kicker">Products</div><h2>Products people use.</h2></div><span>{companyProducts.length} listed</span></div><div className="company-products-grid">{companyProducts.map(product => { const count = companyPitches.filter(p => p.product_id === product.id).length; return <Link key={product.id} to={companyPitches.find(p => p.product_id === product.id)?.slug ? `/pitch/${company.slug}/${product.slug}/${companyPitches.find(p => p.product_id === product.id)!.slug}` : `/company/${company.slug}`} className={`company-product ${topProductIds.has(product.id) ? 'is-active' : ''}`}><div><span className="product-dot"><Sparkles size={14}/></span><strong>{product.name}</strong></div><span>{count} {count === 1 ? 'request' : 'requests'}</span></Link>; })}</div></section>

    <section className="company-section"><div className="company-section-head"><div><div className="section-kicker">Community</div><h2>What people want changed.</h2></div><span>{companyPitches.length} public requests</span></div>{companyPitches.length ? <div className="company-pitch-list">{companyPitches.map((pitch, index) => { const product = companyProducts.find(p => p.id === pitch.product_id); return <Link key={pitch.id} to={`/pitch/${company.slug}/${product?.slug ?? 'product'}/${pitch.slug}`} className="company-pitch-row"><div className="company-pitch-rank">{String(index + 1).padStart(2,'0')}</div><div className="company-pitch-main"><div className="company-pitch-product">{product?.name || 'Product'}</div><h3>{pitch.title}</h3><p>{pitch.body}</p><div className="company-pitch-meta"><span><Flame size={14}/> {Number(pitch.support_count).toLocaleString()} supporters</span><span><MessageSquare size={14}/> Community request</span></div></div><ArrowUpRight className="company-pitch-arrow" size={19}/></Link>; })}</div> : <div className="company-empty"><h3>No published pitches yet.</h3><p>Be the first person to suggest something that would make a product better.</p><Link className="button primary" to="/submit">Pitch a feature</Link></div>}</section>

    <section className="company-attribution"><CompanyLogo company={company} size="sm"/><p>Company name, product names, trademarks, and logos belong to their respective owners. PitchMe is an independent community project and is not affiliated with or endorsed by this company.</p></section>
  </div>;
}
