# Plandoo

AI-powered goal planner that breaks big goals into concrete, actionable steps.

Describe a goal, set a deadline, and pick an intensity level - Plandoo generates a structured plan and tracks your progress as you complete each task.

**Live Demo:** https://focus-forge-mvp.vercel.app/

---

## Tech Stack

- **Frontend:** React + TypeScript + Tailwind CSS
- **AI:** Google Gemini API (`gemini-2.0-flash`)
- **Backend:** Secure server-side functions (Lovable / Supabase) - the AI API key never reaches the browser
- **Storage:** Browser `localStorage` (no database, no accounts - MVP scope)
- **Hosting:** Vercel
- **Built with:** [Lovable](https://lovable.dev)

---

## Features

- Create a plan from a goal, deadline, and difficulty/intensity level
- AI-generated, structured task breakdown (title, description, priority, estimated time)
- Task completion tracking with a live progress indicator
- Persistent storage in the browser - your plans survive a page refresh
- Loading and error states for the AI generation step
- Responsive UI, ready for desktop and mobile

---

## How It Works

1. User enters a goal (e.g. *"Learn Python"*), a deadline, and an intensity (Light / Steady / Intense).
2. The request is sent to a secure server-side function - never directly from the browser.
3. That server function calls the Google Gemini API with the goal details and asks for a structured JSON plan.
4. The plan (title, description, and a list of tasks with priority and estimated time) is returned to the frontend and rendered.
5. The user can check tasks off; progress is saved locally and persists across sessions.

---

## Setup / Run Locally

```bash
# Clone the repository
git clone https://github.com/NembisNetwork/focus-forge-mvp.git
cd focus-forge-mvp

# Install dependencies
npm install

# Add your Gemini API key as an environment variable
# (create a .env file or set it in your deployment platform)
GEMINI_API_KEY=your_key_here

# Run the app locally
npm run dev
```

To deploy your own copy, connect the repository to Vercel and add `GEMINI_API_KEY` under **Project Settings тЖТ Environment Variables** before deploying.

---

## Security

- The Gemini API key is **never** hardcoded or exposed in frontend/client code.
- All AI calls happen in secure server-side code; the browser only ever receives the finished plan data.
- Verified: no API keys appear anywhere in the client-side bundle.

---

## AI Tools Used & Process Notes

This project was built during a hackathon using **Lovable** as the primary AI development tool, with **Google Gemini** powering the plan-generation feature.

**Notable issues encountered and fixed along the way:**
- Initially integrated with the OpenAI API; hit a credit-exhaustion error in testing. Switched to the Google Gemini API (free tier) instead, keeping the same secure server-side architecture and JSON output structure.
- Ran into a temporary GitHub/Vercel connection step requiring an organization to be created before a project could be provisioned - resolved by creating a new Supabase/GitHub organization and re-authorizing.
- Confirmed no hardcoded API keys remained in the frontend after switching AI providers.

---

## About the Developer

My name is Aktan. I'm 21 years old and currently in my fourth year at Manas University. I recently discovered an interest in programming and artificial intelligence - a field I had never explored before - and built Plandoo as my first hands-on project in this space. I'm looking to continue growing in AI and software development going forward.

