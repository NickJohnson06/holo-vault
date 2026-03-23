# Pokemon Card Binder

A frontend React application for managing a digital binder of Pokemon cards.

## Features

- **Interactive Binder Layout**: Visual representation of a card binder with 9-pocket pages, viewing two pages at a time (like an open binder).
- **Image Upload & Compression**: Click on slots to upload card images. Images are automatically compressed before saving to optimize storage.
- **Page Management**: Add new pages or remove existing ones seamlessly.
- **Customizable Page Titles**: Add titles to the top of each page to organize your collection.
- **Local Persistence**: All data (images, titles, and layout) is saved locally in your browser using IndexedDB (`idb-keyval`). This means your collection persists across reloads without needing a backend database.
- **Responsive Design**: Styled with a modern aesthetic, using Tailwind CSS and Lucide React icons.

## Tech Stack

- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS / Custom CSS
- **Storage**: IndexedDB (via `idb-keyval`)
- **Icons**: Lucide React

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open the app in your browser (usually `http://localhost:5173`).
