# Archive

A minimalist, personal memory, experience, and consumption tracking system. Effortlessly organize your thoughts, media, and activities in a single workspace.

## Features

- **Quick Add (`Cmd + K` / `Ctrl + K`)**: A fast, keyboard-driven command interface for capturing new entries instantly.
  - **Inline Hashtags**: Type `#tag` inside the input field to automatically associate tags.
  - **Smart Autocomplete**: Pressing `Space` while typing a hashtag auto-selects or creates the tag immediately without disrupting your typing flow.
- **Dynamic Collections**: Group your entries into custom, curated lists.
  - Collections automatically group items that are either explicitly added or contain a matching tag (e.g., a collection titled "#movies" matches all items with the `#movies` tag).
  - Dynamically calculates total item count per collection.
- **Personalized Space**: Displays a personalized greeting (e.g., "Keshav's Archive") dynamically based on your logged-in user profile.
- **Modern UI/UX**: Fast, beautiful, and dark-mode friendly user interface built with smooth transitions (Framer Motion) and a clean layout.

## Tech Stack

- **Framework**: Next.js (App Router)
- **Database & Auth**: Firebase (Firestore, Auth, Storage)
- **State & Queries**: React Query (TanStack Query) & Zustand
- **Animations**: Framer Motion
- **Icons**: Lucide React

## Getting Started

### 1. Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed (v18+ recommended).

### 2. Configuration

Create a `.env` file in the root directory and add your Firebase configuration variables. Do not wrap values in trailing quotes or commas:

```env
NEXT_PUBLIC_API_KEY=your_api_key
NEXT_PUBLIC_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_PROJECT_ID=your_project_id
NEXT_PUBLIC_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_APP_ID=your_app_id
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.
