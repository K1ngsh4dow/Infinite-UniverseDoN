
# Infinite Universe

This is a secure, AI-powered "Generative Desktop Environment" built with Next.js and Firebase. It leverages Google's Gemini API to provide a suite of AI-powered creative tools within a simulated desktop interface.

## Core Features

- **Secure Virtual Desktop**: A simulated desktop environment where all your creations are stored locally in your browser.
- **AI Command Orb**: An interactive AI assistant that can generate media, answer questions, and control the OS.
- **Generative Suite**: Create images, stories, music concepts, and video storyboards with AI.
- **Secure Vault**: Encrypt and decrypt files using client-side cryptography.
- **File Management**: A virtual file system to organize your creations.
- **PWA Enabled**: Installable as a Progressive Web App for an offline-first, native-like experience.

## Getting Started

To get started, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

The main splash screen is located at `src/app/welcome/page.tsx`. After unlocking with the master key ('don'), you will be directed to the main desktop environment at `src/app/desktop/page.tsx`.
