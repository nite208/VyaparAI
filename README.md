# VyaparAI 🔍

> Universal Business Intelligence Agent — upload any business data and get instant AI-powered insights, charts & reports. Built for Indian businesses.

![Dashboard](https://raw.githubusercontent.com/nite208/VyaparAI/main/screenshots/Dashboard.png)

## 🔴 Live Demo
**[vyapar-ai-cyan.vercel.app](https://vyapar-ai-cyan.vercel.app)**

Try it instantly — click **"Load Coaching Class Data"** or **"Load Restaurant Data"** on the dashboard. No signup needed, no API key needed for demo mode.

---

## 🎯 What It Does

Drop any business file → AI analyzes it instantly → Chat with your data in plain English or Hindi → Export professional PDF reports

**Works for any Indian business:**
- 🏫 **Coaching institutes** — fee tracking, pending payments, student analytics
- 🍕 **Restaurants** — sales trends, best-selling items, revenue by category
- 💼 **CA firms** — financial document summarization, key metrics extraction
- 🏪 **Retail shops** — inventory analysis, demand forecasting
- 🏥 **Clinics** — patient data, appointment analytics
- Any business with data they don't have time to analyze

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📂 Smart Upload | CSV, Excel, PDF, images up to 50MB |
| 🤖 AI Chat | Ask questions in plain English or Hindi — get instant answers |
| 📊 Auto Charts | Bar, line, pie charts generated automatically from your data |
| 📄 PDF Reports | Professional one-click report export |
| 🇮🇳 Hindi Support | Toggle between English and Hindi AI responses in Settings |
| 🎮 Demo Mode | Works without any API key — try with sample Indian business data |
| 🌙 Dark UI | Premium SaaS-grade dark theme |
| 📱 Mobile Ready | Responsive — works on phone, tablet, desktop |

---

## 📸 Screenshots

### Dashboard
![Dashboard](https://raw.githubusercontent.com/nite208/VyaparAI/main/screenshots/Dashboard.png)

### AI Chat with Live Charts
![AI Chat](https://raw.githubusercontent.com/nite208/VyaparAI/main/screenshots/AI_Chat.png)

### Reports
![Reports](https://raw.githubusercontent.com/nite208/VyaparAI/main/screenshots/Report.png)

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript |
| Routing | TanStack Router + TanStack Start |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Animations | Framer Motion |
| Charts | Recharts |
| AI Model | Groq API (LLaMA 3.3 70B) — free tier |
| Database | Neon PostgreSQL — serverless, never pauses |
| File Storage | Cloudinary |
| Deploy | Vercel |
| CSV Parsing | PapaParse |

---

## 🚀 Run Locally

```bash
# Clone the repo
git clone https://github.com/nite208/VyaparAI
cd VyaparAI

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

Fill in your `.env`:
```env
VITE_GROQ_API_KEY=your_groq_key_here
VITE_NEON_DATABASE_URL=your_neon_connection_string
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

```bash
# Start dev server
npm run dev
```

Open `http://localhost:8080`

> **Free APIs:** Get Groq key at [console.groq.com](https://console.groq.com) (free, no credit card). Get Neon DB at [neon.tech](https://neon.tech) (free forever, never pauses).

---

## 📊 Sample Data Included

Two real Indian business datasets built into Demo Mode:

**Sharma Coaching Classes**
- 20 students across Class 9–12
- Fee tracking: Paid / Partial / Pending
- Monthly collection analysis

**Spice Garden Restaurant**
- 10 days of sales data
- Revenue by item, category, day of week
- Best seller identification

---

## 🔑 Bring Your Own Key

VyaparAI uses a **bring-your-own-key** model:
- Go to the **Settings page** in the app
- Paste your Groq API key → click Test
- Paste your Neon connection string → click Test
- Keys are saved in your browser's localStorage — never sent to any server

This means your API keys stay private and you control your own usage.

---

## 🗄️ Database Schema

```sql
files      — uploaded file metadata + content
insights   — AI-generated insights per file
messages   — chat history per file
reports    — generated reports
stats      — dashboard event counters
```

All tables auto-created on first Neon connection test in Settings.

---

## 📁 Project Structure

```
VyaparAI/
├── src/
│   ├── components/     # shadcn/ui components
│   ├── lib/            # groq.ts, neon.ts, cloudinary.ts
│   ├── routes/         # dashboard, upload, chat, reports, settings
│   └── hooks/          # custom React hooks
├── screenshots/        # app screenshots
├── netlify.toml        # deployment config
├── vite.config.ts      # build config
└── .env                # local env vars (never committed)
```

---

## 👨‍💻 Built By

**Nitesh Kumawat**
Final Year, Computer Engineering — ISBM College of Engineering, Pune
Specialization: Data Science Honours

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Nitesh_Kumawat-0A66C2?style=flat&logo=linkedin)](https://www.linkedin.com/in/nitesh-kumawat-185356289/)
[![GitHub](https://img.shields.io/badge/GitHub-nite208-181717?style=flat&logo=github)](https://github.com/nite208)

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

<p align="center">Built with ❤️ for Indian businesses · <a href="https://vyapar-ai-cyan.vercel.app">Try Live Demo</a></p>