# MediaConvertor

This project was created with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack), a modern TypeScript stack that combines Next.js, Hono, and more.

## Features

- **TypeScript** - For type safety and improved developer experience
- **Next.js** - Full-stack React framework
- **React Native** - Build mobile apps using React
- **Expo** - Tools for React Native development
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **Shared UI package** - shadcn/ui primitives live in `packages/ui`
- **Hono** - Lightweight, performant server framework
- **Bun** - Runtime environment
- **Turborepo** - Optimized monorepo build system

## Getting Started

First, install the dependencies:

```bash
bun install
```

Then, run the development server:

```bash
bun run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser to see the web application.
Use the Expo Go app to run the mobile application.
The API is running at [http://localhost:3000](http://localhost:3000).

## Backend Requirements (Open Source)

The converter backend uses:

- **FFmpeg** (open source, LGPL/GPL)
- **FFprobe** (bundled with FFmpeg)

Both binaries must be available on your machine for conversion jobs to run.

### Install FFmpeg on Windows

Option 1 (Winget):

```powershell
winget install Gyan.FFmpeg
```

Option 2 (Chocolatey):

```powershell
choco install ffmpeg
```

After install, open a new terminal and verify:

```powershell
ffmpeg -version
ffprobe -version
```

### Environment Variables (Server)

Set these in your shell or an `.env` file before running the server:

```bash
CORS_ORIGIN=http://localhost:3001
FFMPEG_PATH=ffmpeg
FFPROBE_PATH=ffprobe
MAX_CONCURRENT_JOBS=2
```

If FFmpeg is installed in a custom location, set absolute paths:

```bash
FFMPEG_PATH=C:\\tools\\ffmpeg\\bin\\ffmpeg.exe
FFPROBE_PATH=C:\\tools\\ffmpeg\\bin\\ffprobe.exe
```

### Runtime Health Check

Use this endpoint to confirm backend binary availability:

```text
GET /health/runtime
```

## UI Customization

React web apps in this stack share shadcn/ui primitives through `packages/ui`.

- Change design tokens and global styles in `packages/ui/src/styles/globals.css`
- Update shared primitives in `packages/ui/src/components/*`
- Adjust shadcn aliases or style config in `packages/ui/components.json` and `apps/web/components.json`

### Add more shared components

Run this from the project root to add more primitives to the shared UI package:

```bash
npx shadcn@latest add accordion dialog popover sheet table -c packages/ui
```

Import shared components like this:

```tsx
import { Button } from "@MediaConvertor/ui/components/button";
```

### Add app-specific blocks

If you want to add app-specific blocks instead of shared primitives, run the shadcn CLI from `apps/web`.

## Project Structure

```
MediaConvertor/
├── apps/
│   ├── web/         # Frontend application (Next.js)
│   ├── native/      # Mobile application (React Native, Expo)
│   └── server/      # Backend API (Hono)
├── packages/
│   ├── ui/          # Shared shadcn/ui components and styles
```

## Available Scripts

- `bun run dev`: Start all applications in development mode
- `bun run build`: Build all applications
- `bun run dev:web`: Start only the web application
- `bun run dev:server`: Start only the server
- `bun run check-types`: Check TypeScript types across all apps
- `bun run dev:native`: Start the React Native/Expo development server
