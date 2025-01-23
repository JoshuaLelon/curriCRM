# CurriCRM

A curriculum management system that connects students with experts.

## Structure

The application follows a role-based architecture with unified pages that adapt to the user's role:

### Core Pages

- `/login`: Unified login page for all users
- `/home`: Role-based dashboard showing relevant requests
- `/request/[id]`: Unified request page with role-specific views and permissions
- `/student-new-request`: Page for creating new requests

### Components

- `components/home/`: Role-specific home page components
- `components/request/`: Request-related components including:
  - Shared components (details, chat, curriculum tables)
  - Role-specific views

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