# Scholarship Atlas 🌍🎓

A transparent, fully funded scholarship discovery platform for international students with zero ads, verified official sources, and offline PWA capability.

---

## How to Run in VS Code (Simple 3 Steps)

You do **not** need any special software or paid tools. All you need is **Node.js** installed on your computer.

### Step 1: Open the Project in VS Code
1. Unzip `scholarship-atlas.zip`.
2. Open **VS Code**.
3. Click **File > Open Folder...** and select the unzipped `scholarship-atlas` folder.

### Step 2: Open the Built-in Terminal
1. In VS Code, press **`Ctrl + ~`** (or go to top menu: **Terminal > New Terminal**).
2. Install dependencies by typing:
   ```bash
   npm install
   ```
   *(This takes about 30 seconds and installs React, Tailwind, and Express into `node_modules`).*

### Step 3: Start the App
1. Type in the terminal:
   ```bash
   npm run dev
   ```
2. You will see:
   ```
   [Scholarship Atlas] Full-stack server running on port 3000
   ```
3. Open your browser and go to:
   👉 **http://localhost:3000**

That's it! The complete app with search, filters, application tracker, and offline mode will run on your machine.

---

## Optional: Gemini AI Scholarship Extraction (Free)
If you want to use the editorial AI extraction tool in the Admin Portal:
1. Create a `.env` file in the project root:
   ```env
   PORT=3000
   ADMIN_PASSWORD=AtlasAdmin2026!
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
2. You can get a free Gemini API key from [Google AI Studio](https://aistudio.google.com/).
3. If you don't provide a Gemini key, the app still works 100% fine using its structured rule-based parser fallback!

---

## Project Structure
* `src/` — React frontend components, filters, tracker, and types.
* `server.ts` — Lightweight Express server with security tokens and API routes.
* `public/` — PWA icons, manifest, and offline assets.
* `data/` — Initial scholarship dataset.
* `netlify.toml` — Configuration for free 1-click deployment on Netlify.
