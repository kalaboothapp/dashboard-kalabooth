# Kala Booth Dashboard

A professional administrative interface for managing the **Kala Booth** ecosystem. This dashboard enables management of frames, filters, themes, and global settings for photobooth terminals.

## ✨ Features

- 🖼️ **Frame Management**: Upload, edit, and organize photobooth frames.
- 🎨 **Filter Management**: Manage available filters for the photo sessions.
- ⚙️ **Theme Customization**: Configure UI themes, backgrounds, and assets for the booth terminal.
- 🔐 **Secure Access**: Protected admin routes with Supabase authentication.
- 📊 **Real-time Updates**: Instant synchronization with booth terminals via Supabase.

## 🚀 Tech Stack

- **Frontend**: React 19 + Vite
- **Styling**: Tailwind CSS 4
- **Backend/Database**: Supabase
- **Icons**: Phosphor Icons & Lucide React
- **Animations**: Framer Motion

## 🛠️ Getting Started

### Prerequisites

- Node.js (Latest LTS recommended)
- Supabase account and project

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/kalaboothapp/dashboard-kalabooth.git
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Copy `.env.example` to `.env` and fill in your Supabase credentials.

4. Start the development server:
   ```bash
   npm run dev
   ```

## 📂 Project Structure

- `src/components`: Reusable UI components.
- `src/pages`: Main page views (Admin, Login, etc.).
- `src/services`: API and Supabase service logic.
- `src/context`: React Context providers for state management.
- `database/`: SQL migration and setup scripts.

## 📄 License

This project is private and proprietary.
