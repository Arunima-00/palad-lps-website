# Palad Lower Primary School — Official Website

Live website: [palad-lps-website.vercel.app](https://palad-lps-website.vercel.app)

---

## About

Official website for **Palad Lower Primary School (Palad LPS)**, Kodolipuram, Mattanur, Kannur, Kerala.  
Built with a full bilingual (Malayalam / English) interface and a complete admin panel for school authorities.

---

## Features

- Bilingual — Malayalam and English (auto-translate)
- Fully dynamic — all content editable by school authorities
- Announcements, Events, Staff directory
- Photo Gallery
- Achievements, Testimonials, PTA meetings
- LSS Hall of Fame, Circulars, Study Resources
- Activities (category-based)
- Admissions and Academics pages
- Contact form
- AI Chatbot (answers in Malayalam and English)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Firebase Firestore |
| File Storage | Cloudinary |
| Hosting | Vercel |
| i18n | next-intl (Malayalam + English) |

---

## Getting Started (Local Development)

### 1. Clone the repository

```bash
git clone https://github.com/Arunima-00/palad-lps-website.git
cd palad-lps-website
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the root folder and add:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Deployment

The website is automatically deployed to Vercel on every push to the `main` branch.

To deploy manually:
1. Push changes to GitHub
2. Vercel picks it up and rebuilds automatically

---

## Project Structure

```
palad-lps-website/
├── app/
│   └── [locale]/          # Bilingual pages (en / ml)
│       ├── page.tsx        # Home page
│       └── layout.tsx      # Root layout
├── components/
│   ├── layout/             # Navbar, Footer
│   └── shared/             # Chatbot, reusable UI
├── lib/
│   └── db.ts               # Firestore + Cloudinary helpers
├── messages/
│   ├── en.json             # English translations
│   └── ml.json             # Malayalam translations
└── public/                 # Static assets
```

---

## License

This project is private and maintained by Palad Lower Primary School.  
© 2025 Palad LPS. All rights reserved.
