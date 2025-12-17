# AI Research Analyst

A powerful research assistant powered by Google Gemini 2.5 and Pro models. This application performs deep web research, analyzes PDFs, and generates executive summaries with evidence-based citations and synthesis graphs.

## Features

- **Dual Modes**: 
  - **Web Search**: Fast, synthesized answers with live web sources.
  - **Deep Analysis**: Complex reasoning using Gemini 3 Pro with detailed evidence graphs.
  - **Fast Mode**: Quick, internal knowledge responses.
- **PDF Analysis**: Upload and analyze PDF documents with specific page references.
- **Evidence Graph**: Visual representation of claims linked to their specific sources (Web URLs or PDF Pages).
- **Citations**: Inline citations linked to the evidence graph.
- **Responsive Design**: Modern, clean UI with Dark Mode support.

## Setup

1.  **Clone or Download** the repository.
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Set up Environment Variables**:
    - Create a `.env` file in the root.
    - Add your Google Gemini API Key:
      ```env
      API_KEY=your_google_api_key_here
      ```
4.  **Run the development server**:
    ```bash
    npm run dev
    ```

## Deployment

This project is configured for deployment on **Vercel** or **Netlify**.

1.  Push the code to a Git repository.
2.  Import the project into Vercel/Netlify.
3.  Add the `API_KEY` environment variable in the deployment settings.
4.  The platform will automatically detect the Vite build settings.

## Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **AI**: Google GenAI SDK
- **Language**: TypeScript
