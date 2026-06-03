# Infinite Universe OS - Application Blueprint

This document serves as the master architectural blueprint for the Infinite Universe OS, a secure, AI-powered generative desktop environment. It is intended to be both human-readable and machine-readable for AI development assistants.

## 1. Core Architecture & Philosophy

-   **Technology Stack**: Next.js (App Router), React, TypeScript, Tailwind CSS, ShadCN UI, Genkit (for AI), Firebase (optional for cloud features), IndexedDB (for client-side storage).
-   **Core Metaphor**: A simulated desktop environment (`/desktop`) serves as the main user interface. All applications and files exist within this environment.
-   **AI-First Interaction**: The primary method of interaction is a conversational AI System Agent. This agent is capable of understanding user requests, using tools to perform actions, and generating complex content.
-   **Local-First Data**: All user-generated content ("Creations") and wallet information is stored exclusively on the client-side using IndexedDB. This ensures user privacy and offline functionality. The application is a Progressive Web App (PWA).

## 2. The AI System Agent

The brain of the OS is a Genkit-powered agent located at `/src/api/chat/route.ts`.

### 2.1. Agent Instructions & Logic

The agent operates based on a specific set of instructions (`DEFAULT_INSTRUCTIONS`). Its primary function is to interpret a user's prompt and decide on one of three response types:

1.  **General Conversation**: If the user is simply chatting, the agent responds as a helpful assistant without using a structured format.
2.  **Direct Execution (Tool Call)**: If the user's intent is clear and provides all necessary information, the agent responds **only** with a single JSON object in a markdown code block.
    -   **Format**:
        ```json
        {
          "tool": "<toolName>",
          "summary": "<A brief, friendly summary of the action being taken.>",
          "parameters": { ... }
        }
        ```
3.  **Guided Suggestions**: If the user's request is ambiguous or lacks detail, the agent must guide them by providing options. It responds **only** with a single JSON object.
    -   **Format**:
        ```json
        {
          "summary": "<A friendly message asking the user to choose an option.>",
          "suggestions": [
            { "tool": "<toolName1>", "label": "<User-friendly label 1>", "parameters": { ... } },
            { "tool": "<toolName2>", "label": "<User-friendly label 2>", "parameters": { ... } }
          ]
        }
        ```

### 2.2. Multi-modal Input

The agent is multi-modal and can process images provided by the user in the chat interface. The image is passed to the API as a Base64 data URI.

## 3. Defined AI Tools

The agent's capabilities are defined by a set of tools in `/src/ai/tools.ts`. These are the only actions the AI can perform.

| Tool Name            | Description                                                                                                                   | Input Schema (`zod`)             |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| `openApp`            | Opens a system application on the user's virtual desktop. Used for non-generative OS apps.                                      | `z.object({ appName: z.enum([...]) })` |
| `alibiArchives`      | Generates a complete murder mystery case file, including characters, clues, and a solution, based on a user-provided theme.       | `GenerateMysteryInputSchema`     |
| `itineraryPlanner`   | Creates a detailed, day-by-day travel itinerary based on a specified destination, duration, interests, and budget.                | `GenerateItineraryInputSchema`   |
| `worldWeaver`        | Designs a comprehensive, multi-dimensional blueprint for a brand-new application based on a high-level user concept.            | `WorldWeaverInputSchema`         |

## 4. Application Schematic

The following are the core applications within the Infinite Universe OS, which are launched via the desktop environment.

### 4.1. System Applications

-   **Desktop (`/desktop`)**: The main graphical user interface. Manages file display and windowing.
-   **Security Center (`app_vault`)**:
    -   **Function**: Manages the user's local wallet, file encryption/decryption, and secure file sharing.
    -   **Backend**: All cryptographic operations are performed client-side via the Web Crypto API. Wallet state is managed by `WalletContext`.
-   **Settings (`/settings`)**:
    -   **Function**: Configures API keys, generative models, PWA installation, and data backups.
-   **Terminal (`app_terminal`)**:
    -   **Function**: A command-line interface for interacting with the virtual file system (`ls`, `cd`, `mkdir`, `cat`) and running advanced AI flows (`architect`).
-   **Notes (`app_notes`)**:
    -   **Function**: A simple text and markdown editor for creating and editing notes stored on the virtual file system.

### 4.2. Generative & AI Applications

-   **Alibi Archives (`app_alibi_archives`)**:
    -   **Function**: A UI for viewing and interacting with murder mystery case files generated by the `alibiArchives` AI tool. It is a "viewer" for the AI's output.
-   **Atlas (`app_world_weaver`)**:
    -   **Function**: An interactive 3D globe for exploring countries. Integrates with the `itineraryPlanner` tool to generate travel plans.
-   **Copilots (`app_copilots`)**:
    -   **Function**: A system for creating, managing, and running custom AI agents (Copilots). Integrates with Firebase for cloud storage and a local-only fallback.
-   **Terraformer (`app_terraformer`)**:
    -   **Function**: A high-level world-building application that uses the `forgeWorld` Genkit flow to generate lore, materials, and a "Genesis Puzzle" for a new fictional universe.

### 4.3. Simulation & Game Applications

-   **Aetherium Exchange (`app_exchange`)**: A simulated stock market where prices are influenced by AI-generated news events.
-   **Echoes of Infinity (`app_echoes`)**: A life-simulation game where the user manages an AI being ("Echo") whose life events are generated by the AI based on its personality and needs.
-   **Quantum Ascent (`app_quantum_ascent`)**: A sci-fi roguelike deck-builder where enemy encounters and player abilities are generated by AI on the fly.
-   **Quantum Siege (`app_quantum_siege`)**: A tower defense game where enemy waves are designed by an AI based on the player's current game state.
-   **Strategic Command (`app_chess`)**: A chess application with modes for practicing against an AI and playing wager matches using the in-app "DoN" currency.
-   **Sovereign's Gambit (`app_sovereigns_gambit`)**: A narrative, choose-your-own-adventure chess puzzle.
-   **The Nine-Ball Enigma (`app_nine_ball_enigma`)**: A noir-themed puzzle game where sinking pool balls reveals clues to a mystery.
-   **Echoes of Pallet Town (`app_echoes_of_pallet_town`)**: A narrative puzzle game involving interacting with a mysterious creature to unlock memories.
