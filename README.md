# Feature Feedback Hub

You are taking over an existing product called PitchMe.

IMPORTANT:
This is NOT a greenfield project.

You have access to:
1. Existing GitHub repository:
   https://github.com/iam-saiteja/pitchme

2. Existing Supabase project/database connected to this project.

Use the existing GitHub repository and the existing Supabase project as the source of truth.

DO NOT create a separate Supabase project.
DO NOT create a second database.
DO NOT replace the backend with mock data.
DO NOT create a separate authentication system.
DO NOT throw away the existing product functionality.
DO NOT casually rewrite the database schema.
DO NOT invent fake company responses, fake support counts, fake users, or fake partnerships.

You are taking over and substantially improving the existing PitchMe application.

==================================================
1. PRODUCT
==================================================

PitchMe is an independent public feedback platform.

The basic idea:

A person uses a product and thinks:

"I wish this product had X."

They can come to PitchMe and create a public pitch for that feature/change.

Other people can support the pitch.

The support count is public.

When a pitch reaches important support milestones, the PitchMe administrator manually contacts the company.

The milestones are:

1
25
50
100
500
1000

IMPORTANT:
Email sending is MANUAL for now.

Do NOT build automatic email sending.

The administrator will personally send the email and then record the milestone as sent in the admin dashboard.

If a company replies, the administrator can publish the verified company response on the pitch page.

The public community can then react to the company response.

The ultimate loop is:

User identifies problem
→ creates pitch
→ community supports it
→ milestone reached
→ PitchMe contacts company manually
→ company may respond
→ response is verified
→ response is published
→ community reacts
→ eventually the feature may be shipped

PitchMe is independent and is not an official support channel for any company.

==================================================
2. EXISTING STACK
==================================================

Preserve the existing architecture where practical.

Frontend:
React + TypeScript + Vite

Backend:
Supabase PostgreSQL
Supabase Auth for administrators

Hosting:
Cloudflare Pages

Repository:
GitHub

The production site is currently intended to run on:

https://pitchme.pages.dev

Cloudflare is already connected to the GitHub main branch with automatic deployments.

Do not introduce unnecessary CI/CD infrastructure.

The normal deployment flow is:

GitHub main
→ Cloudflare Pages
→ npm run build
→ dist
→ pitchme.pages.dev

Keep the project compatible with that.

==================================================
3. SUPABASE IS THE REAL BACKEND
==================================================

Use the existing Supabase database.

There are already tables/functions for concepts including:

companies
products
pitches
supports
pitch_reactions
comments
company_responses
email_milestone_events
admin_users
admin activity/notification data

There are already public and admin-safe RPC functions.

Before modifying anything:

1. Inspect the current Supabase schema.
2. Inspect current tables.
3. Inspect current RLS policies.
4. Inspect existing RPC functions.
5. Inspect current data.
6. Inspect the existing GitHub repository.
7. Understand what already works.

Do not recreate existing infrastructure just because you would design it differently.

Only modify schema/functions when genuinely required.

Whenever possible:
- reuse existing tables
- reuse existing RPC functions
- preserve existing IDs/data
- preserve existing public URLs

==================================================
4. ADMIN
==================================================

There is one administrator account already configured in Supabase.

The administrator user UUID is:

94d8812b-3a37-427b-a765-5731a01760be

The admin dashboard must be available at:

/admin

IMPORTANT:
Do not show an Admin button in the public navigation.
The administrator will navigate directly to /admin.

Normal users do not need accounts.

Only administrators authenticate.

==================================================
5. PUBLIC USERS
==================================================

Normal visitors must NOT be forced to register.

No email login.
No password login.
No social login.
No account creation.

A visitor should be able to:

Browse
Search
Open company pages
Open pitch pages
Support pitches
Comment
React
Submit a pitch

without creating an account.

For anonymous interactions, use the existing anonymous browser identity mechanism and Supabase backend state.

Do not maintain a giant list of supported pitch IDs in localStorage.

The browser should have one anonymous identifier.

The database should determine whether that visitor already supported the pitch.

Once a visitor supports a pitch:

The button must remain:

"Supported"

after refresh.

It must not allow the same anonymous visitor to support that pitch again.

==================================================
6. PITCH CREATION
==================================================

Users can submit a pitch without an account.

Fields:

Company
Product
Pitch title
Preferred URL slug (optional)
Why does this matter?

Users may suggest a slug.

However:

ADMIN HAS FINAL CONTROL OVER THE PUBLIC SLUG.

Reason:

Prevent:
duplicate URLs
impersonation
bad slugs
reserved words
company confusion
SEO abuse

The user can suggest a slug, but the admin may change it before publishing.

New pitches start as:

pending

They do not immediately become public.

Admin reviews them.

Admin can:

Approve/publish
Reject
Edit slug
Edit wording where appropriate
Keep pending

==================================================
7. PITCH STATUS
==================================================

Supported statuses include:

pending
open
contacted
responded
planned
in_progress
shipped
declined

Show these clearly but tastefully.

The user should be able to see the progress of a pitch.

Example:

Pitch published
↓
Community support
↓
Company contacted
↓
Company response
↓
Potentially planned
↓
Potentially in development
↓
Potentially shipped

Do not imply a feature is planned/in development/shipped unless the administrator has actually marked it that way.

==================================================
8. SUPPORT MILESTONES
==================================================

Public support count can increase continuously.

Example:

1,437 supporters

But the administrator only contacts the company at:

1
25
50
100
500
1000

The dashboard should clearly show:

Milestone
Reached?
Email sent?
Date sent?

Example:

1       ✓ sent
25      ✓ sent
50      ✓ sent
100     ready
500     locked
1000    locked

IMPORTANT:

Reaching 37 supporters does NOT mean sending 37 emails.

Only milestone emails are sent.

Email sending remains manual.

Admin can click:

"Mark 25 email sent"

after personally sending the company email.

==================================================
9. COMPANY RESPONSES
==================================================

Company responses must NEVER be fabricated.

The administrator manually receives a company email and can paste the actual response into the admin panel.

Only responses verified by the administrator can be shown publicly as:

"Company response"

Use clear language such as:

"Verified company response"

Do not imply that PitchMe has an official relationship with the company.

If there is no response:

"No company response yet."

==================================================
10. COMPANY DIRECTORY
==================================================

This is one of the MOST IMPORTANT frontend areas.

Do not treat company pages as generic cards.

Create a real company directory.

Route:

/companies

Each company should have:

logo
company name
short description
website
number of products
number of public pitches
total supporters across public pitches
link to company page

Use clean editorial layout.

Avoid huge generic SaaS cards everywhere.

==================================================
11. COMPANY PAGE
==================================================

Route:

/company/:slug

This page should feel like a real product/company directory page.

Example structure:

--------------------------------------------------
Back to companies

[ COMPANY LOGO ]

Google

Products people use and requests people make.

[Visit website] [Pitch a feature]

42 products
126 public pitches
18,421 supporters
--------------------------------------------------

Products

Google Contacts
Gmail
Google Maps
Chrome
etc.

Each product can show:

Product name
number of requests
support total

--------------------------------------------------

Top requests

1.
Add Speed Dial to Google Contacts
1,204 supporters

2.
Improve duplicate contact handling
842 supporters

3.
...
--------------------------------------------------

All community requests

Filter by product
Sort by support
Search

--------------------------------------------------

IMPORTANT:

Company pages should not look like a copy of the pitch page.

Make them feel like an actual company profile/directory.

==================================================
12. COMPANY LOGOS
==================================================

Company logos are important.

Some current companies do not reliably display their logos.

Fix this.

Do NOT depend on a naive dynamically constructed URL like:

https://cdn.simpleicons.org/company-slug

for every company.

Instead use explicit metadata per company.

For each company store:

logo_url
logo_source
logo_source_url

When possible use Simple Icons as the logo source.

Simple Icons:
https://simpleicons.org/

If a logo cannot be loaded:

1. use a stable fallback
2. never display a broken image icon
3. show a clean company initial/avatar fallback

Google MUST display correctly.

OpenAI MUST display correctly.

Anthropic MUST display correctly.

Netflix MUST display correctly.

Apple
Microsoft
GitHub
Spotify
WhatsApp
Notion
Figma
Discord
Slack
YouTube
Amazon
Duolingo
Linear
Canva
Dropbox
Zoom

and other seeded companies must also have working visual identities.

Do not invent logos.

==================================================
13. LOGO ATTRIBUTION / DISCLAIMER
==================================================

PitchMe is NOT affiliated with these companies.

The company logos, product names, trademarks, etc. belong to their respective owners.

The site must clearly state:

"Company names, product names, trademarks, and logos belong to their respective owners. PitchMe is an independent community project and is not affiliated with or endorsed by the companies shown here. Logos are displayed for identification purposes only."

Also include a source/attribution mechanism.

For logos sourced from Simple Icons, state that appropriately.

Do not make it visually aggressive.

It should be clear but quiet.

==================================================
14. HOMEPAGE
==================================================

The homepage should NOT feel like an "AI startup landing page."

Avoid:
massive gradients
unnecessary glowing effects
generic AI marketing language
excessive rounded cards
"Revolutionary platform" language
fake social proof
fake statistics

The homepage should be minimal, credible, editorial, and product-focused.

Main message:

Something missing?
Pitch it.

Supporting message:

Describe what you want changed.
Get people behind it.
Let the company hear it.

Primary button:

Pitch a feature

Secondary button:

Discover pitches

Then show:

TOP PITCHES

Top 10 community pitches based on support.

Each item:

rank
company logo
company
product
pitch title
support count
status

Button:

View all pitches

==================================================
15. DISCOVER
==================================================

Route:

/discover

This should feel like a community feed.

Think:

Reddit-style information density
Product Hunt-like clarity
Modern editorial design

But NOT a Reddit clone.

Features:

Search
Company filter
Product filter
Sort by most supported
Sort by newest

Pitch cards should be clean.

Each pitch should show:

company logo
company
product
title
short description
support count
status

Click opens:

/pitch/:company/:product/:slug

==================================================
16. PITCH PAGE
==================================================

This is the most important content page.

Structure:

Back to company

Company logo + company name
Product name

Pitch title

Pitch explanation

Support count

"I want this too"

After clicking:

"Supported"

The state must persist after refresh.

Then:

Status timeline

Pitch published
Community support
Company contacted
Company response

Then:

Company response

Only if verified.

Then:

Community discussion

Users can comment anonymously.

Comments initially enter:

pending moderation

Admin must approve them.

Only approved comments are public.

Users can see:

"Your comment was submitted for review."

Do not expose pending comments publicly.

==================================================
17. REACTIONS
==================================================

Allow community reactions where appropriate.

Examples:

Helpful
I agree
Not enough

Do not allow a person to spam the same reaction repeatedly.

Use the anonymous browser identity already used for support.

==================================================
18. COMMENTS
==================================================

Comments must work properly.

Anonymous users:

write comment
submit
database stores it as pending

Admin:

Approve
Reject

After approval:

comment becomes public.

Admin dashboard must clearly show:

Comments awaiting approval

==================================================
19. ADMIN COMMAND CENTER
==================================================

The administrator's /admin page should be a genuine operating dashboard.

Header:

PitchMe Admin

Then summary:

Unread activity
Pending pitches
Comments awaiting approval
Milestones reached
Responses awaiting publication

Activity feed:

New pitch
New comment
Pitch reached 25 supporters
Pitch reached 50 supporters
Pitch reached 100 supporters
Company contacted
Company response received/published
Pitch published
Pitch rejected

Admin should be able to mark activity as read.

There should be:

Mark all read

==================================================
20. ADMIN PITCH REVIEW
==================================================

Admin needs:

Pending pitches list

Each item:

company
product
title
body
suggested slug
support count
submitted time

Actions:

Publish
Reject
Edit slug
Edit content where appropriate

Before publishing, the admin can change the final public slug.

==================================================
21. ADMIN COMMENT MODERATION
==================================================

Create a dedicated moderation section.

Pending comment:

show comment
show pitch
show company/product
timestamp

Buttons:

Approve
Reject

After approval:

remove from pending list
create activity event if appropriate
show publicly

Do not require refreshing the entire page manually.

==================================================
22. ADMIN RESPONSE MANAGEMENT
==================================================

Admin needs a clear interface to:

select a pitch
paste company response
mark response verified
publish it

Also record:

received_at
published_at

Public page should show the response only after verification/publishing.

==================================================
23. NOTIFICATIONS
==================================================

There should be an activity/notification system in admin.

Unread items should be visually obvious but restrained.

Do not implement browser push notifications.

Do not implement email notifications to me.

Just an internal admin activity feed for now.

==================================================
24. DESIGN DIRECTION
==================================================

THIS IS VERY IMPORTANT.

The current site should look LESS like an AI startup.

I want:

minimal
editorial
credible
calm
modern
high information density
strong typography
excellent whitespace
subtle borders
subtle motion

Use Motion Primitives as the interaction reference:

https://motion-primitives.com/docs

Use motion only where it improves comprehension.

Examples:

cards subtly animate into view
support count changes smoothly
button transitions
hover states
page transitions
filter changes
moderation actions

Avoid:

huge animated backgrounds
constant floating particles
excessive glowing gradients
everything bouncing
every section having a fancy animation

The motion should feel like a high-quality product interface.

==================================================
25. VISUAL SYSTEM
==================================================

Prefer:

neutral dark interface
off-black background
soft white typography
muted secondary text
subtle borders
restrained accent color

Use typography hierarchy more than decoration.

Avoid:

giant rounded panels containing everything
too many pills
too many gradients
too many drop shadows

Cards should be used when structurally helpful, not because every element needs a box.

Company pages should feel especially editorial.

==================================================
26. MOBILE
==================================================

Everything must work extremely well on mobile.

Check:

navbar
company directory
company page
pitch page
support button
comment form
discover filters
admin dashboard
legal pages

No horizontal overflow.

Buttons must be easily tappable.

Long pitch titles should wrap gracefully.

Company logos must not collapse or disappear.

==================================================
27. SEO
==================================================

Each public company page needs unique title/description.

Example:

Google | PitchMe

Google Contacts feature requests and community feedback | PitchMe

Each pitch page:

Add Speed Dial to Google Contacts | PitchMe

Use useful meta descriptions.

Generate Open Graph metadata.

Do not use generic:

"PitchMe - the world's best..."

Use actual page content.

Company and pitch pages should have stable canonical URLs.

==================================================
28. LEGAL / TRUST
==================================================

Keep:

/about
/terms
/privacy
/community-guidelines
/copyright-trademark

The footer should contain:

About
Terms
Privacy
Community Guidelines
Copyright & Trademarks
GitHub

Contact:

iamsaitejathanniru@gmail.com

GitHub:

https://github.com/iam-saiteja/pitchme

The legal/footer pages need proper spacing.

IMPORTANT:
Do NOT use concatenated inline links.

The links must have actual layout spacing and responsive wrapping.

Example visual structure:

PitchMe
Independent community feedback.

About     Terms     Privacy     Community Guidelines
Copyright & Trademarks     GitHub

==================================================
29. NO EM DASH
==================================================

Do not use the em dash character anywhere in the product copy.

Do not use:

—

Use commas, periods, parentheses, colons, or simple hyphens instead.

==================================================
30. COMPANY DATA
==================================================

The initial database already contains recognizable companies and products.

Keep and improve the existing seeded companies.

The ecosystem should include recognizable companies such as:

OpenAI
Anthropic
Google
Apple
Microsoft
Netflix
GitHub
Spotify
WhatsApp
Notion
Figma
Discord
Slack
YouTube
Amazon
Duolingo
Linear
Canva
Dropbox
Zoom

Do not claim these companies are partners.

Do not claim these companies have responded unless the database contains a real verified response entered by the administrator.

Do not create fake supporter counts for production.

==================================================
31. CONTENT QUALITY
==================================================

Seeded pitches should be realistic and useful.

A good pitch looks like:

"Add Speed Dial to Google Contacts"

Then explain:

what is missing
why it matters
who benefits
what the proposed change is

Avoid vague pitches such as:

"Make Google better"

Avoid spam.

Avoid fake user stories.

==================================================
32. ACCESSIBILITY
==================================================

Use:

semantic HTML
proper labels
keyboard navigation
visible focus states
alt text
aria-labels where necessary
reduced motion support

Do not rely only on color to indicate state.

==================================================
33. ERROR STATES
==================================================

Never silently fail.

For:

Supabase unavailable
network failure
submission error
support error
comment error
admin authorization failure
logo load failure

show useful, human-readable feedback.

Do not expose raw SQL errors directly to normal users.

==================================================
34. SECURITY
==================================================

Preserve Supabase RLS.

Never expose the Supabase service-role key in frontend code.

Only use the public anon key in the client.

Admin-only content must only be accessible through authenticated/admin-safe mechanisms.

Pending comments must NOT be public.

Pending pitches must NOT be public.

Admin activity must NOT be public.

Company responses must only be public when verified/published.

==================================================
35. URL PRESERVATION
==================================================

Keep these routes:

/
 /discover
 /companies
 /company/:slug
 /pitch/:company/:product/:slug
 /submit
 /admin
 /about
 /terms
 /privacy
 /community-guidelines
 /copyright-trademark

Do not randomly rename routes.

==================================================
36. IMPORTANT IMPLEMENTATION PROCESS
==================================================

Before changing the UI:

1. Inspect GitHub repository.
2. Inspect Supabase schema.
3. Inspect existing data.
4. Inspect current RLS.
5. Inspect existing RPCs.
6. Identify what is reusable.
7. Make a written internal plan.

Then implement.

Do not rewrite working functionality just to make the code "cleaner."

Do not create duplicate tables when an existing table works.

Do not create fake API responses.

Do not use static arrays when real Supabase data exists.

Do not replace Supabase data with mock JSON.

==================================================
37. DESIGN REFERENCE
==================================================

Use:

Motion Primitives
https://motion-primitives.com/docs

as a motion and interaction reference.

The final visual result should feel:

minimal
fast
calm
editorial
credible
community-driven

It should NOT feel like:

another generic AI SaaS landing page.

==================================================
38. FINAL QA
==================================================

Before considering the work complete, test:

Homepage
Discover
Companies
Google company page
OpenAI company page
Anthropic company page
Netflix company page
Pitch page
Submit pitch
Support pitch
Refresh after support
Comment submission
Admin login
Admin access denial
Pending comments
Approve comment
Reject comment
Pending pitch
Publish pitch
Change slug
Milestone tracking
Company response publication
Legal pages
Footer
Mobile layout

Also verify:

Google logo works
OpenAI logo works
Anthropic logo works
Netflix logo works

No broken images.

No broken routes.

No missing spacing in footer.

No em dash character in UI copy.

No fake company response.

No fake partnership claim.

No admin link visible publicly.

==================================================
39. MOST IMPORTANT INSTRUCTION
==================================================

Do not give me a design mockup only.

Actually modify the existing GitHub repository and existing Supabase project.

Use the existing backend.

Build the working product.

Keep it deployable on Cloudflare Pages.

The goal is a real usable PitchMe MVP, not a demo.

==================================================
40. FINAL PRODUCT FEEL
==================================================

When someone opens PitchMe, they should immediately understand:

"Something is missing from a product I use."

"I can pitch that here."

"Other people can support it."

"If enough people support it, PitchMe will contact the company."

"If the company responds, I can see the response."

That should be obvious within seconds.

Build toward that.


you have access to supabase and also github use them

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ff97875e-8379-4078-8efb-39d2b03eb8b3).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
