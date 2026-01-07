# EBot - Standalone LangGraph Application

A standalone LangGraph application built with TypeScript and the LangGraph CLI for building and running intelligent agents.

## Overview

This project uses LangGraph CLI to create a local Agent Server that exposes API endpoints for runs, threads, assistants, and includes supporting services such as a managed database for checkpointing and storage.

## Project Structure

```
ebot/
├── src/
│   ├── utils/
│   │   ├── tools.ts      # Tools that the agent can use
│   │   ├── nodes.ts      # Graph node functions
│   │   └── state.ts      # State definition for the agent
│   ├── agent.ts          # Main graph construction
│   └── index.ts          # Entry point for LangGraph CLI
├── package.json          # Dependencies and scripts
├── langgraph.json        # LangGraph CLI configuration
├── .env                  # Environment variables
└── README.md
```

## Prerequisites

- Node.js 18+
- LangGraph CLI (`npm install -g langgraph`)
- OpenAI API key

## Setup

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

```bash
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
```

3. Build the project:

```bash
npm run build
```

## Development

Start the LangGraph development server:

```bash
npm run dev
```

This will start the local Agent Server with hot reloading and expose the following:

- HTTP API server (default port: 8080)
- Managed database for checkpointing
- LangSmith tracing integration

## Available Scripts

- `npm run dev` - Start development server with LangGraph CLI
- `npm run build` - Compile TypeScript to JavaScript
- `npm run start` - Start production server with LangGraph CLI
- `npm run dockerfile` - Generate Dockerfile for deployment
- `npm run lint` - Run ESLint with auto-fix
- `npm test` - Run tests

## API Endpoints

Once the server is running, you can access:

- `GET /` - Health check
- `POST /runs` - Create and execute agent runs
- `GET /threads/{thread_id}` - Get thread history
- `POST /threads/{thread_id}/runs` - Run agent in specific thread
- And more LangGraph API endpoints...

## Environment Variables

- `OPENAI_API_KEY` - Your OpenAI API key (required)
- `LANGCHAIN_TRACING_V2` - Enable LangSmith tracing (default: true)
- `LANGSMITH_PROJECT` - LangSmith project name (default: ebot)

## Graph Structure

The agent graph consists of:

1. **Process Node** - Handles message processing
2. **Execute Node** - Executes tools based on processing results
3. **Router** - Determines next steps based on current state

## Adding Tools

To add new tools to your agent:

1. Update `src/utils/tools.ts` with new tool definitions
2. Modify `src/utils/nodes.ts` to incorporate the new tools
3. Update the graph logic in `src/agent.ts` if needed

## Deployment

Generate Dockerfile and build for deployment:

```bash
npm run dockerfile
npx @langchain/langgraph-cli build
```

This will create a Dockerfile and build your LangGraph application for deployment to any container platform.

## Learn More

- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [LangSmith Deployment](https://docs.smith.langchain.com/deployments)
- [LangGraph CLI Guide](https://langchain-ai.github.io/langgraph/cli/)
