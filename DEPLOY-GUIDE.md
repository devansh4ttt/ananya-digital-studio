# Ananya Digital Studio — Production Deployment Guide (Cloudflare Free Tier)

Everything runs on **₹0/month** using Cloudflare Workers (Static Assets) + Cloudflare D1 SQLite. No external database, no S3 bucket, no exposed API keys.

## Step 1: Create the D1 Database (1 Minute)
1. Open **Cloudflare Dashboard → Storage & Databases → D1 SQL Database → Create**.
2. Name it **`ananya-studio-db`** and click **Create**.
3. Copy the **Database ID** shown on the overview page.
4. Open **`wrangler.jsonc`** and replace `REPLACE_WITH_YOUR_D1_DATABASE_ID` with that ID.

*(Tables and initial plans/photos are created and seeded automatically on the very first visit—no manual SQL needed!)*

## Step 2: Deploy to Cloudflare Workers (2 Minutes)
1. Push this folder to a new private GitHub repository (e.g. `ananya-digital-studio`).
2. In **Cloudflare Dashboard → Workers & Pages → Create → Import a repository**, select that repository.
3. Click **Save and Deploy**. Your live URL will be `https://ananya-digital-studio.<your-subdomain>.workers.dev` (or attach a custom `.in` domain under **Settings → Domains & Routes**).

## Step 3: Set the Secret Admin Password (30 Seconds)
1. Open the deployed Worker → **Settings → Variables and Secrets → Add**.
2. Add a **Secret**:
   - **Variable name:** `ADMIN_PASSWORD`
   - **Value:** Choose a strong password for Ananya Digital Studio's owner (e.g., 12+ characters).
3. Click **Deploy** to activate the secret.

## Step 4: Verify Live Health & Admin Panel
1. Open `https://<your-site>/api/v1/health` — verify it returns `{"ok":true,"version":"1.0.0","db":true,"admin":true}`.
2. Open `https://<your-site>/#/admin`, sign in with `ADMIN_PASSWORD`, and test:
   - Viewing **Analytics & Most Trending Plan**
   - Adding/editing a photography plan or toggling the **Live Offer**
   - Uploading a real studio photo from your phone to **Home**, **About Us**, or **Photo Gallery**
3. Test `https://<your-site>/#/booking` to verify the pre-filled WhatsApp message opens directly to **`+91 72668 38737`**.
