# Request Page

This directory contains the unified request page that handles all request-related functionality for students, experts, and admins.

## Structure

- `[id]/page.tsx`: Main request page that:
  - Detects user role and request status
  - Loads request data and related information
  - Renders appropriate view based on user role

## Components

All request-related components are in `components/request/`:

- `request-details.tsx`: Shows request details, editable by students in early states
- `chat.tsx`: Handles chat functionality with view-only mode for finished state
- `curriculum-view.tsx`: Combined view for finished curriculum that includes:
  - Interactive tree visualization using React Flow
  - Detailed table view of all nodes
- `student-view.tsx`: Student-specific UI and functionality
- `expert-view.tsx`: Expert-specific UI and functionality
- `admin-view.tsx`: Admin-specific UI and functionality

## State Management

The page manages several pieces of state:
- Request data and related entities (curriculum, messages, etc.)
- User role and permissions
- Curriculum editing state (for experts)
- Chat messages

## Permissions

Access and actions are controlled by user role:

### Student
- Can edit request details in not_accepted and not_started states
- Can delete request only in not_accepted state
- Can chat in not_started and in_progress states
- View-only access in finished state
  - Can view curriculum tree visualization and table

### Expert
- View-only access if not assigned or in not_accepted/finished states
- Can edit curriculum in not_started and in_progress states if assigned
- Can chat in not_started and in_progress states if assigned
- Can submit request to mark as finished

### Admin
- Can assign/reassign experts in not_accepted and not_started states
- View-only access to chat history and curriculum
- Cannot participate in chat 

## AI Processing State
We now consider a request "AI processing" if it has `started_at` but no `finished_at`, and the current user is handling the AI. We no longer check for an empty curriculum to show progress.

This means the progress indicator will be shown as soon as the AI workflow starts (when `started_at` is set) and will remain visible until the workflow completes (when `finished_at` is set). This ensures users can see the progress even if the curriculum is generated quickly. 