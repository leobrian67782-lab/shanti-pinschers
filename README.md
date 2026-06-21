# Shanti Bryan Pinschers — Website + Admin Dashboard

A professional Miniature Pinscher breeder website with a full admin dashboard for
managing puppy listings, litters, customer inquiries, testimonials, and blog/care
guide posts. Built on the same stack as ZipCargo: **Node.js + Express + MongoDB**,
deployable on Render's free tier.

## What's included

**Public site**
- Home, Available Puppies (with filters), Puppy detail page, Litters, About,
  Testimonials (with public submission form), Care Guides/Blog, Contact form
- Every puppy and litter gets a pedigree-style ledger number automatically
- Contact form emails you immediately when someone inquires

**Admin dashboard** (`/admin`)
- Add/edit/delete puppies — multiple photos each, price, status (available/reserved/sold)
- Add/edit/delete litters — photos, sire/dam, expected or born date
- Review customer inquiries, mark read/replied, delete
- Approve or reject testimonials submitted by visitors, or add your own
- Write and publish blog/care guide posts with a cover image

## Before you deploy — accounts you need (all free)

1. **MongoDB Atlas** — your database. https://www.mongodb.com/cloud/atlas/register
   - Create a free (M0) cluster, create a database user, and get your connection string.
   - Same setup you already did for ZipCargo.

2. **Cloudinary** — for puppy/litter photos. https://cloudinary.com/users/register/free
   - **This is required, not optional.** Render's free tier wipes any files saved
     to disk every time the app restarts or redeploys — so without Cloudinary,
     every photo you upload would vanish within a day or two. Cloudinary stores
     them permanently and free tier (25 GB) is far more than this site needs.
   - After signing up, your dashboard shows: Cloud Name, API Key, API Secret.

3. **Brevo** (optional but recommended) — for the email notification you get when
   someone submits the contact form. You already use this for ZipCargo, so you can
   reuse the same Brevo account and just generate a new API key if you want, or
   reuse the existing one.

4. **Domain name** — you said you need this. Buy `shantibryanpinschers.com` (or
   whatever you decide on) from a registrar like Namecheap or domain.com
   (~$10–15/year for a .com). Cloudflare also sells domains at near cost-price if
   you want to manage DNS there too, like you did for ZipCargo.

5. **Render** — hosting, same as ZipCargo. https://render.com (free tier).

## Setting up locally first (recommended before deploying)

1. Install Node.js 18+ if you don't already have it.
2. Open a terminal in this folder and run:
   ```
   npm install
   ```
3. Copy `.env.example` to `.env` and fill in your real values:
   ```
   cp .env.example .env
   ```
4. Create your admin login (only needs to be run once):
   ```
   npm run create-admin
   ```
   This reads `ADMIN_EMAIL` and `ADMIN_PASSWORD` from your `.env` file and creates
   the account in MongoDB. You can change the password anytime by re-running this
   script with a new `ADMIN_PASSWORD` value.
5. Start the site:
   ```
   npm run dev
   ```
6. Visit `http://localhost:3000` for the public site and `http://localhost:3000/admin`
   to log in and start adding puppies.

## Deploying to Render

Same process as ZipCargo:

1. Push this project to a new GitHub repository (upload the files via GitHub's web
   interface like you usually do — every file and folder here needs to go up,
   keeping the same folder structure).
2. On Render: **New +** → **Web Service** → connect the GitHub repo.
3. Settings:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Add all the variables from your `.env` file under Render's **Environment**
   tab (Render does not read your local `.env` file — you re-enter them there).
5. Deploy. Once it's live, open a Render **Shell** (under the service page) and run:
   ```
   npm run create-admin
   ```
   This creates your admin login directly on the live database.

## Connecting your domain

1. In Render, go to your service → **Settings** → **Custom Domains** → add
   `shantibryanpinschers.com` (and `www.shantibryanpinschers.com`).
2. Render will give you DNS records to add at your domain registrar (or in
   Cloudflare, if you route DNS through there like ZipCargo).
3. Once DNS propagates (sometimes a few minutes, sometimes a few hours), the
   domain will point to your live site, and Render auto-issues a free SSL
   certificate so it loads securely.

## Day-to-day use

- Log in at `yourdomain.com/admin`.
- **New puppy arrived / ready to list:** Admin → Puppies → Add Puppy. Upload as
  many photos as you have — the first one becomes the cover photo shown on the
  public site.
- **Puppy sold:** Edit the puppy, change status to "Sold." It stays in your
  records but is excluded from default search filters.
- **New litter on the way:** Admin → Litters → Add Litter, status "Expected."
  Update to "Born" once whelped, then link puppies to it when you list them.
- **Customer messages:** Admin → Inquiries. New ones also land in your email
  inbox if Brevo is configured.
- **Testimonials:** visitor-submitted ones land as "Pending Review" — approve
  the ones you want shown publicly.

## A few notes on what's deliberately kept simple

- There's one shared admin login (matching how you manage ZipCargo). If you ever
  want separate logins for staff, that's a small addition we can make later.
- Pricing is shown in XAF. If you'd rather not show price publicly and only use
  "Price on request," just leave the price field blank when adding a puppy.
- The design uses a pedigree-ledger visual style (ledger numbers, wax-seal status
  badges) rather than a generic pastel "cute puppy" template — meant to read as
  a credible, established kennel rather than a hobby page.
