import { supabase } from './supabase';

// Demo Instagram/Facebook data for presentations.
// Every row is tagged with an id starting with "demo-" so it can be removed cleanly.

const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();
const img = (id: string) => `https://images.unsplash.com/${id}?w=600&q=80`;

const POSTS = [
  { platform: 'instagram', external_id: 'demo-post-1', caption: '🏠 4-Bedroom Fully Detached Duplex for Sale — Lekki Phase 1. BQ, fitted kitchen, 24hr power. 💰 ₦250M. DM for inspection 📲', media_url: img('photo-1600596542815-ffad4c1539a9'), like_count: 184, comment_count: 37, posted_at: hoursAgo(120) },
  { platform: 'instagram', external_id: 'demo-post-2', caption: '✨ Newly built 3-Bedroom Terrace — Ikate, Lekki. Swimming pool, gym, serviced estate. Comment PRICE for details 👇', media_url: img('photo-1600585154340-be6161a56a0c'), like_count: 256, comment_count: 52, posted_at: hoursAgo(96) },
  { platform: 'facebook', external_id: 'demo-post-3', caption: '2-Bedroom Apartment for Rent — Yaba. Close to UNILAG. ₦4.5M per annum. Serious enquiries only.', media_url: img('photo-1512917774080-9991f1c4c750'), like_count: 73, comment_count: 21, posted_at: hoursAgo(72) },
  { platform: 'instagram', external_id: 'demo-post-4', caption: '🔑 5-Bedroom Mansion with Cinema & Pool — Banana Island. Price on request. Inspection strictly by appointment.', media_url: img('photo-1568605114967-8130f3a36994'), like_count: 412, comment_count: 64, posted_at: hoursAgo(48) },
  { platform: 'facebook', external_id: 'demo-post-5', caption: 'Land for Sale — Ibeju-Lekki, 600sqm, C of O. Flexible payment plan available. Close to Dangote Refinery.', media_url: img('photo-1564013799919-ab600027ffc6'), like_count: 129, comment_count: 45, posted_at: hoursAgo(24) },
  { platform: 'instagram', external_id: 'demo-post-6', caption: '🏡 3-Bedroom Semi-Detached Duplex — Ajah. ₦85M. Payment plan: 30% initial deposit. Comment INTERESTED 👇', media_url: img('photo-1580587771525-78b9dba3b914'), like_count: 98, comment_count: 28, posted_at: hoursAgo(6) },
];

const LEADS: [platform: string, name: string, comment: string, post: string, status: string, hrs: number][] = [
  ['instagram', 'Chioma Okafor', 'Price please? Is it still available? 🙏', '4-Bedroom Fully Detached Duplex — Lekki Phase 1', 'new', 0.3],
  ['instagram', 'Tunde Bakare', 'PRICE', '3-Bedroom Terrace — Ikate, Lekki', 'new', 1],
  ['instagram', 'Amaka Eze', 'Interested. Can I do an inspection this Saturday?', '3-Bedroom Semi-Detached Duplex — Ajah', 'new', 3],
  ['facebook', 'Ibrahim Musa', 'Is the land dry? Send me the payment plan details', 'Land for Sale — Ibeju-Lekki, 600sqm', 'new', 5],
  ['instagram', 'Funmi Adeyemi', 'DM sent ✅ please check', '5-Bedroom Mansion — Banana Island', 'new', 8],
  ['instagram', 'Emeka Nwosu', 'How much is the service charge per year?', '3-Bedroom Terrace — Ikate, Lekki', 'contacted', 14],
  ['facebook', 'Blessing Johnson', 'I need a 2 bed in Yaba for my sister, is this negotiable?', '2-Bedroom Apartment for Rent — Yaba', 'contacted', 24],
  ['instagram', 'Segun Oladipo', "Price pls. I'm in the UK, can I do a virtual inspection?", '4-Bedroom Fully Detached Duplex — Lekki Phase 1', 'qualified', 28],
  ['instagram', 'Aisha Bello', 'INTERESTED', '3-Bedroom Semi-Detached Duplex — Ajah', 'new', 33],
  ['facebook', 'Kelechi Obi', 'What documents does the land have? C of O or Gazette?', 'Land for Sale — Ibeju-Lekki, 600sqm', 'qualified', 48],
  ['instagram', 'Ngozi Uche', 'Can I pay in installments?', '3-Bedroom Terrace — Ikate, Lekki', 'new', 54],
  ['instagram', 'David Adebayo', 'Location exactly? Inside an estate?', '4-Bedroom Fully Detached Duplex — Lekki Phase 1', 'contacted', 72],
  ['facebook', 'Halima Sani', 'Still available for rent? When can I move in?', '2-Bedroom Apartment for Rent — Yaba', 'new', 77],
  ['instagram', 'Oluwaseun Ajayi', 'Nice one 🔥', '5-Bedroom Mansion — Banana Island', 'ignored', 80],
  ['instagram', 'Precious Ekanem', 'Send price to my DM please', '5-Bedroom Mansion — Banana Island', 'new', 96],
  ['facebook', 'Yusuf Abdullahi', 'Is the price fixed? I have ₦70M cash ready', '3-Bedroom Semi-Detached Duplex — Ajah', 'qualified', 102],
];

/** Removes demo rows. Returns an error message, or null on success. */
export async function clearDemoSocialData(): Promise<string | null> {
  const a = await supabase.from('social_leads').delete().like('commenter_id', 'demo-%');
  if (a.error) return `Could not remove demo leads: ${a.error.message}`;
  const b = await supabase.from('social_posts').delete().like('external_id', 'demo-%');
  if (b.error) return `Could not remove demo posts: ${b.error.message}`;
  return null;
}

/** Adds demo posts and leads for the given company. Returns an error message, or null on success. */
export async function loadDemoSocialData(companyId: string | null | undefined): Promise<string | null> {
  const cleared = await clearDemoSocialData();
  if (cleared) return cleared;

  const company_id = companyId ?? null;

  const posts = await supabase.from('social_posts').insert(
    POSTS.map(p => ({ ...p, company_id, media_type: 'IMAGE', permalink: null })),
  );
  if (posts.error) return `Could not add demo posts: ${posts.error.message}`;

  const leads = await supabase.from('social_leads').insert(
    LEADS.map(([platform, name, comment, post, status, hrs], i) => ({
      company_id,
      platform,
      commenter_name: name,
      commenter_id: `demo-lead-${String(i + 1).padStart(2, '0')}`,
      comment_text: comment,
      post_caption: post,
      post_permalink: null,
      status,
      created_at: hoursAgo(hrs),
    })),
  );
  if (leads.error) return `Could not add demo leads: ${leads.error.message}`;

  return null;
}
