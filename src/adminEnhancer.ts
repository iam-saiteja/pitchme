import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = url && key ? createClient(url, key) : null;
const milestones = [1,25,50,100,500,1000];
const esc = (v:string) => v.replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c] as string));
const fmt = (v:number) => new Intl.NumberFormat('en-US').format(v);

let activeHost: HTMLElement | null = null;
let loading = false;

async function load() {
  if (!supabase || loading || location.pathname !== '/admin') return;
  const host = document.querySelector<HTMLElement>('.admin-page');
  if (!host) return;
  loading = true;
  try {
    const { data: admin } = await supabase.rpc('is_pitchme_admin');
    if (!admin) return;

    const [activityRes, commentsRes, pitchesRes] = await Promise.all([
      supabase.rpc('admin_get_activity', { p_limit: 50 }),
      supabase.rpc('admin_get_pending_comments', { p_limit: 100 }),
      supabase.rpc('admin_get_pending_pitches', { p_limit: 100 }),
    ]);
    const activity = (activityRes.data ?? []) as any[];
    const comments = (commentsRes.data ?? []) as any[];
    const pitches = (pitchesRes.data ?? []) as any[];

    activeHost?.remove();
    const section = document.createElement('section');
    section.className = 'admin-command-center';
    activeHost = section;
    section.innerHTML = `
      <div class="admin-command-head">
        <div><div class="section-kicker">Command center</div><h2>What needs your attention.</h2></div>
        <button class="button ghost" type="button" data-mark-all>Mark all read</button>
      </div>
      <div class="admin-command-stats" aria-label="Admin summary">
        <div><span>Unread</span><strong>${fmt(activity.filter(a=>!a.read).length)}</strong></div>
        <div><span>Pending pitches</span><strong>${fmt(pitches.length)}</strong></div>
        <div><span>Pending comments</span><strong>${fmt(comments.length)}</strong></div>
      </div>
      <div class="admin-command-grid">
        <div class="admin-command-panel"><div class="panel-head"><h3>Activity</h3><small>Latest events</small></div><div class="admin-activity-list">${activity.length ? activity.map(a=>`<button class="admin-activity ${a.read?'is-read':''}" type="button" aria-label="${esc(a.message)}" data-activity="${a.id}"><span class="activity-dot" aria-hidden="true"></span><span><strong>${esc(a.kind.replaceAll('_',' '))}</strong><small>${esc(a.message)}</small><time>${new Date(a.created_at).toLocaleString()}</time></span></button>`).join('') : '<p class="muted">Nothing new yet.</p>'}</div></div>
        <div class="admin-command-panel"><div class="panel-head"><h3>Comments to approve</h3><small>Human moderation</small></div><div class="admin-comment-list">${comments.length ? comments.map(c=>`<article class="admin-comment"><p>${esc(c.body)}</p><time>${new Date(c.created_at).toLocaleString()}</time><div><button class="button primary" type="button" data-approve-comment="${c.id}">Approve</button><button class="button ghost" type="button" data-reject-comment="${c.id}">Reject</button></div></article>`).join('') : '<p class="muted">No comments waiting for review.</p>'}</div></div>
      </div>
      <div class="admin-command-panel admin-pending-panel"><div class="panel-head"><h3>Pitches waiting for review</h3><small>Publish only when you are happy with the request and slug</small></div><div class="admin-pending-list">${pitches.length ? pitches.map(p=>`<article class="admin-pending"><div><span class="admin-pitch-meta">${esc(p.status)}</span><h3>${esc(p.title)}</h3><p>${esc(p.body)}</p><small>Suggested URL: /${esc(p.slug)}</small></div><div class="admin-pending-actions"><label class="sr-only" for="slug-${p.id}">Public slug</label><input id="slug-${p.id}" value="${esc(p.slug)}" aria-label="Public slug" data-slug="${p.id}"/><button class="button primary" type="button" data-publish="${p.id}">Publish</button></div></article>`).join('') : '<p class="muted">No pitches waiting for review.</p>'}</div></div>
      <div class="admin-command-panel"><div class="panel-head"><h3>Outreach thresholds</h3><small>Manual email workflow</small></div><div class="admin-thresholds">${milestones.map(m=>`<div><strong>${m}</strong><span>supporters</span></div>`).join('')}</div><p class="muted">When a request reaches a threshold, send one manual company email. Then record that milestone in the existing pitch controls.</p></div>
    `;
    host.appendChild(section);

    section.querySelector<HTMLButtonElement>('[data-mark-all]')?.addEventListener('click', async () => {
      await supabase!.rpc('admin_mark_all_activity_read');
      await load();
    });
    section.querySelectorAll<HTMLElement>('[data-activity]').forEach(el => el.addEventListener('click', async () => {
      await supabase!.rpc('admin_mark_activity_read', { p_id: el.dataset.activity });
      el.classList.add('is-read');
    }));
    section.querySelectorAll<HTMLButtonElement>('[data-approve-comment]').forEach(btn => btn.addEventListener('click', async () => {
      btn.disabled = true;
      await supabase!.rpc('admin_approve_comment', { p_comment_id: btn.dataset.approveComment });
      await load();
    }));
    section.querySelectorAll<HTMLButtonElement>('[data-reject-comment]').forEach(btn => btn.addEventListener('click', async () => {
      btn.disabled = true;
      await supabase!.rpc('admin_reject_comment', { p_comment_id: btn.dataset.rejectComment });
      await load();
    }));
    section.querySelectorAll<HTMLButtonElement>('[data-publish]').forEach(btn => btn.addEventListener('click', async () => {
      const id=btn.dataset.publish;
      const input=section.querySelector<HTMLInputElement>(`[data-slug="${id}"]`);
      const slug=input?.value.trim() ?? '';
      if (!id || !slug) return;
      btn.disabled = true;
      await supabase!.rpc('admin_publish_pitch', { p_id:id, p_slug:slug, p_status:'open' });
      await load();
    }));
  } finally {
    loading = false;
  }
}

export function initAdminEnhancer() {
  if (location.pathname !== '/admin') return;
  void load();
  const observer = new MutationObserver(() => {
    if (!document.querySelector('.admin-command-center')) void load();
  });
  observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener('popstate', () => void load());
  return () => observer.disconnect();
}
