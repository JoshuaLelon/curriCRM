# CurriCRM

A curriculum management system that helps experts create and manage learning paths.

## Features

### Request Management
- Students can submit requests for learning paths
- Experts can view and accept requests
- Real-time updates on request status

### AI-Powered Curriculum Generation
- Admins can assign requests to be handled by AI
- GPT-4 powered learning plan generation
- Automatic resource discovery and curriculum structuring
- Real-time progress tracking via Supabase Realtime

### Curriculum Management
- Structured learning paths with dependencies
- Resource management and organization
- Progress tracking for students

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Supabase (Auth, Database, Realtime)
- LangChain.js & LangGraph
- Shadcn UI & Tailwind CSS

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Then add your:
   - Supabase credentials
   - OpenAI API key
   - Other service keys

4. Run database migrations:
   ```bash
   npm run seed
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
.
├── app/                    # Next.js app router pages
│   ├── api/               # API routes
│   │   └── ai/           # AI workflow endpoints
│   └── ...
├── components/            # React components
├── lib/                   # Shared utilities
│   └── workflows/        # AI workflow implementation
├── public/               # Static assets
├── styles/               # Global styles
├── supabase/             # Database migrations
└── types/                # TypeScript types
```

## Documentation

- [API Documentation](app/api/README.md)
- [AI Workflow](lib/workflows/README.md)
- [Database Schema](supabase/README.md)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT

## Authentication

The application uses Supabase for authentication with magic link emails. Important notes about the auth implementation:

- Uses PKCE flow for secure authentication
- Session cookies are configured to be accessible by the client-side Supabase library
- Cookie configuration:
  ```js
  {
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7 // 1 week
  }
  ```
- Note: `httpOnly` is intentionally disabled to allow the browser-based Supabase client to access session data

## Structure

The application follows a role-based architecture with unified pages that adapt to the user's role:

### Core Pages

- `/login`: Unified login page for all users
- `/home`: Role-based dashboard showing relevant requests
- `/request/[id]`: Unified request page with role-specific views and permissions
  - Features a curriculum tree visualization for finished requests, showing the prerequisite relationships between curriculum nodes
  - Each node represents a source (e.g., video, article) with its title and URL
  - Tree levels indicate dependency relationships (higher level nodes depend on lower level nodes)
- `/student-new-request`: Page for creating new requests

### Components

- `components/home/`: Role-specific home page components
- `components/request/`: Request-related components including:
  - Shared components (details, chat, curriculum tables)
  - Role-specific views
- `components/curriculum-tree.tsx`: Interactive tree visualization for curriculum prerequisites using React Flow
- `components/request/curriculum-view-table.tsx`: Table view of curriculum nodes with integrated tree visualization

### Utils

- `utils/request-permissions.ts`: Permission checks based on role and request status
- `utils/request-status.ts`: Request status management and transitions

## Request States

1. `not_accepted`: Initial state
   - Student can edit/delete
   - Admin can assign expert
2. `not_started`: Expert assigned
   - Student can edit
   - Expert can start curriculum
3. `in_progress`: Curriculum being built
   - Expert editing curriculum
   - Student/Expert can chat
4. `finished`: Complete
   - View-only for all users

## User Roles

### Student
- Create and manage requests
- Chat with assigned experts
- View curriculum when complete

### Expert
- Work on assigned requests
- Create and edit curriculum
- Chat with students

### Admin
- View all requests
- Assign experts to requests
- Monitor progress

## Development

[Add development setup instructions here]

## Documentation

- [API Documentation](app/api/README.md)
- [Home Page](app/home/README.md)
- [Request Page](app/request/README.md)

### Additional Documentation
- [Implementation Checklist](implementation.md) 