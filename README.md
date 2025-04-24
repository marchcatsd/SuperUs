# SuperU - Collaborative Content Management System

SuperU is a collaborative content management system that allows teams to scrape website content, organize it in a structured format, and collaboratively edit it in real-time.

## Features

- **Authentication**: Secure email authentication with JWT
- **Team Collaboration**: Invite team members to collaborate on content
- **Website Scraping**: Scrape content from any website and organize it in a structured format
- **Real-time Editing**: Collaborate on content in real-time with team members
- **File Tree Visualization**: View content in a recursive file tree structure
- **Auto-save**: Changes are automatically saved to the backend

## Tech Stack

### Backend
- Node.js with Express
- MongoDB for database
- Redis for caching and session management
- Socket.io for real-time collaboration
- JWT for authentication

### Frontend
- Next.js (Pages Router) version 14.1.0
- TypeScript
- Tiptap for rich text editing
- Socket.io client for real-time collaboration

### DevOps
- Docker for containerization
- Docker Compose for orchestration

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Docker and Docker Compose
- MongoDB (or use the Docker Compose setup)
- Redis (or use the Docker Compose setup)

### Running with Docker

1. Clone the repository
2. Navigate to the project directory
3. Run Docker Compose:

```bash
docker-compose up -d
```

This will start all services:
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- MongoDB: mongodb://localhost:27017
- Redis: redis://localhost:6379

### Running Locally (Development)

#### Backend

1. Navigate to the `user` directory
2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

#### Frontend

1. Navigate to the `web` directory
2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

## Project Structure

```
├── user/                  # Backend code
│   ├── src/
│   │   ├── config/        # Configuration files
│   │   ├── controllers/   # Route controllers
│   │   ├── middleware/    # Middleware functions
│   │   ├── models/        # Database models
│   │   ├── routes/        # API routes
│   │   ├── utils/         # Utility functions
│   │   └── server.js      # Server entry point
│   ├── .env               # Environment variables
│   ├── Dockerfile         # Backend Docker configuration
│   └── package.json       # Backend dependencies
│
├── web/                   # Frontend code
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts
│   │   ├── pages/         # Next.js pages
│   │   └── styles/        # CSS styles
│   ├── Dockerfile         # Frontend Docker configuration
│   └── package.json       # Frontend dependencies
│
└── docker-compose.yml     # Docker Compose configuration
```

## API Endpoints

### Authentication
- `POST /api/auth/signup`: Register a new user
- `POST /api/auth/login`: Login a user
- `GET /api/auth/me`: Get current user

### Teams
- `POST /api/team`: Create a new team
- `GET /api/team`: Get all teams for a user
- `GET /api/team/:teamId`: Get team by ID
- `POST /api/team/:teamId/invite`: Invite a member to a team
- `POST /api/team/:teamId/accept`: Accept team invitation

### Workspaces
- `POST /api/workspace`: Create a new workspace
- `GET /api/workspace/team/:teamId`: Get all workspaces for a team
- `GET /api/workspace/:workspaceId`: Get workspace by ID
- `PUT /api/workspace/:workspaceId/content/:contentId`: Update content
- `POST /api/workspace/:workspaceId/content`: Add new content

## License

MIT
