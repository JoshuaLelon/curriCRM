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
- `curriculum-table.tsx`: Editable curriculum table for experts
- `curriculum-view-table.tsx`: View-only curriculum table with tree visualization
  - Shows a hierarchical tree of curriculum nodes using React Flow
  - Nodes represent sources with their titles and URLs
  - Tree levels indicate prerequisite relationships
  - Followed by a detailed table view of all nodes
- Role-specific views:
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
- Students can view their own requests and edit details in early states
- Experts can edit curriculum for assigned requests
- Admins can assign experts and view all requests

Request states:
- `not_accepted`: Initial state, student can edit/delete, admin can assign expert
- `not_started`: Expert assigned but no curriculum nodes yet
- `in_progress`: Has curriculum nodes, expert working on curriculum
- `finished`: Completed request, view-only for all users

### Student
- Can edit request details in `not_accepted` and `not_started` states
- Can delete request only in `not_accepted` state
- Can chat in `not_started` and `in_progress` states
- View-only access in `finished` state

### Expert
- View-only access if not assigned or in `not_accepted`/`finished` states
- Can edit curriculum in `not_started` and `in_progress` states if assigned
- Can chat in `not_started` and `in_progress` states if assigned
- Can submit request to mark as finished

### Admin
- Can assign/reassign experts in `not_accepted` and `not_started` states
  - Expert assignment uses the expert's `user_id` from the profiles table
  - The `expert_id` stored in requests table is the expert's numeric `id` from profiles
- View-only access to chat history and curriculum
- Cannot participate in chat 