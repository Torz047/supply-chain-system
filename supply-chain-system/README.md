# 🏭 Supply Chain Management System

A full-featured SCM with Inventory, Purchasing, Logistics, and Planning modules.
Built with **Next.js 14**, **Supabase**, **Tesseract.js OCR**, and **Tailwind CSS**.

---

## ✨ Features

- 📊 **Dashboard** — Live KPIs, order charts, low-stock alerts
- 📦 **Inventory** — Stock management with receive/issue transactions
- 🛒 **Purchasing** — Purchase orders with line items and supplier management
- 🚚 **Logistics** — Shipment creation and real-time tracking history
- 🔍 **OCR Upload** — Auto-encode customer orders from images using Tesseract.js

---

## 🚀 Step-by-Step Deployment

### Step 1 — Install dependencies locally (optional test)

```bash
npm install
npm run dev
# Open http://localhost:3000
```

---

### Step 2 — Set up Supabase

1. Go to **https://supabase.com** → click **New Project**
2. Fill in project name, password, region → click **Create project** (wait ~2 min)
3. Go to **SQL Editor** (left sidebar)
4. Click **New query**
5. Open the file `supabase/schema.sql` → copy everything → paste it → click **Run**
6. You should see "Success. No rows returned"
7. Go to **Project Settings → API**
8. Copy:
   - **Project URL** (looks like `https://xxxx.supabase.co`)
   - **anon public** key (long JWT string under "Project API keys")

---

### Step 3 — Push to GitHub

```bash
# In the project folder:
git init
git add .
git commit -m "Initial commit: Supply Chain SCM"

# Create a new repo at https://github.com/new  (don't initialize with README)
# Then:
git remote add origin https://github.com/YOUR_USERNAME/supply-chain-system.git
git branch -M main
git push -u origin main
```

---

### Step 4 — Deploy to Vercel

1. Go to **https://vercel.com** → Sign in with GitHub
2. Click **Add New → Project**
3. Find and click **Import** on your `supply-chain-system` repo
4. In **Environment Variables**, add these three:

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
   | `HUGGINGFACE_API_KEY` | `hf_` + your token (or leave blank for now) |

5. Click **Deploy** — Vercel builds and deploys automatically (~2 min)
6. Your app is live at `https://your-project.vercel.app` 🎉

---

### Step 5 — (Optional) Hugging Face API Key

For improved OCR parsing with AI:
1. Go to **https://huggingface.co** → Sign up free
2. Go to **Settings → Access Tokens** → New token (read)
3. Copy the token (starts with `hf_`)
4. Add it to Vercel env vars as `HUGGINGFACE_API_KEY`

> Note: The app works without this key — OCR still works using regex parsing.

---

## 📁 Project Structure

```
supply-chain-system/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── dashboard/page.tsx
│   │   ├── inventory/page.tsx
│   │   ├── purchasing/page.tsx
│   │   ├── logistics/page.tsx
│   │   └── planning/ocr/page.tsx
│   ├── components/             # React components
│   │   ├── Sidebar.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Inventory.tsx
│   │   ├── Purchasing.tsx
│   │   ├── Logistics.tsx
│   │   └── OCRUploader.tsx
│   ├── lib/
│   │   ├── supabase.ts         # Supabase client
│   │   ├── ocr.ts              # Tesseract OCR logic
│   │   └── ai.ts               # HuggingFace AI helper
│   └── types/index.ts          # TypeScript types
├── supabase/schema.sql          # Database schema
├── .env.local                   # Environment variables (never commit!)
└── package.json
```

---

## ⚙️ Environment Variables

Create a `.env.local` file (already included as template):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
HUGGINGFACE_API_KEY=hf_your_free_token_here
```

> ⚠️ Never commit `.env.local` to GitHub — it's in `.gitignore` already.

---

## 🔄 Updating After Deployment

```bash
# Make changes, then:
git add .
git commit -m "Your change description"
git push
# Vercel auto-deploys on every push to main ✓
```
