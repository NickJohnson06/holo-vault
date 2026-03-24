# HoloVault - Pokemon Card Binder (Full-Stack)

A full-stack application for managing a digital binder of Pokemon cards, featuring a React frontend and a robust Python/FastAPI backend API.

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

1. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```
2. Start the React development server:
   ```bash
   cd frontend
   npm run dev
   ```
3. Open the app in your browser (usually `http://localhost:5173`).
4. To spin up the backend database, see the `docker-compose.yml` file and run `docker compose up -d`.

## Development Roadmap & Outlook


### Phase 1: High-Level Architecture & Backend Setup (In Progress)
- [x] Initialize Python FastAPI project directory (`/backend`)
- [x] Configure a PostgreSQL database via Docker
- [x] Define database models (`Users`, `Binders`, `Pages`, `CardSlots`)
- [x] Set up Alembic for handling database schema migrations
- [x] Set up Pydantic schemas for data validation

### Phase 2: Core API & Cloud Storage Integration 
- [ ] Build RESTful CRUD endpoints for Binders and Pages
- [ ] Implement image upload functionality via AWS S3
- [ ] Update frontend to use API instead of IndexedDB

### Phase 3: Authentication & Security 
- [ ] Implement User Registration and Login endpoints
- [ ] Secure API routes with JWT
- [ ] Create frontend login/register screens and auth state

### Phase 4: Portfolio Polish & Advanced Features
- [ ] Market & Pricing Integration (eBay/TCGPlayer background tasks)
- [ ] External Account Connection (OAuth/API)
- [ ] Pokémon TCG API Integration
- [ ] Redis Caching
- [ ] Sharing & Social public link endpoints
- [ ] WebSockets

### Phase 5: CI/CD & Deployment
- [ ] Containerize FastAPI backend
- [ ] GitHub Actions CI setup
- [ ] Backend and Frontend deployments
