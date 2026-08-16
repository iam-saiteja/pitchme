import { supabase } from './supabase';

const VISITOR_KEY = 'pitchme-anon-id';
const SUPPORT_SELECTOR = '.support-button';

function getVisitorId() {
  let value = localStorage.getItem(VISITOR_KEY);
  if (!value) {
    value = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`;
    localStorage.setItem(VISITOR_KEY, value);
  }
  return value;
}

async function getCurrentPitchId() {
  const match = window.location.pathname.match(/^\/pitch\/([^/]+)\/([^/]+)\/([^/]+)$/);
  if (!match || !supabase) return null;

  const [, companySlug, productSlug, pitchSlug] = match;
  const { data: company } = await supabase.from('companies').select('id').eq('slug', companySlug).maybeSingle();
  if (!company) return null;

  const { data: product } = await supabase.from('products').select('id').eq('company_id', company.id).eq('slug', productSlug).maybeSingle();
  if (!product) return null;

  const { data: pitch } = await supabase.from('pitches').select('id').eq('company_id', company.id).eq('product_id', product.id).eq('slug', pitchSlug).neq('status', 'pending').maybeSingle();
  return pitch?.id ?? null;
}

async function syncSupportButton(button: HTMLButtonElement) {
  if (!supabase || button.dataset.pitchmeSupportChecked === 'true') return;
  button.dataset.pitchmeSupportChecked = 'true';

  const pitchId = await getCurrentPitchId();
  if (!pitchId) return;

  const { data, error } = await supabase.rpc('has_supported', {
    p_pitch_id: pitchId,
    p_fingerprint: getVisitorId(),
  });

  if (!error && data === true) {
    button.disabled = true;
    button.classList.add('supported');
    button.innerHTML = '<span aria-hidden="true">✓</span> Supported';
    button.setAttribute('aria-pressed', 'true');
  }
}

function scan() {
  document.querySelectorAll<HTMLButtonElement>(SUPPORT_SELECTOR).forEach((button) => {
    void syncSupportButton(button);
  });
}

export function startSupportPersistence() {
  scan();
  const observer = new MutationObserver(scan);
  observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener('popstate', scan);
}
