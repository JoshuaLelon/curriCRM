# API Routes Documentation

This directory contains all the API routes for the CurriCRM application. Each route is implemented using Next.js App Router and communicates with the Supabase database.

## Routes Overview

### Requests (`/api/requests`)
- `GET /api/requests`
  - Query params:
    - `studentId`: Filter by student ID
    - `expertId`: Filter by expert ID
  - Returns requests with related student, expert, source, curriculum, and messages data
- `POST /api/requests`
  - Creates a new request
  - Body should match the shape of the requests table
- `PATCH /api/requests/[id]`
  - Updates an existing request
  - Body contains fields to update

### Profiles (`/api/profiles`)
- `GET /api/profiles`
  - Query params:
    - `userId`: Filter by user ID
    - `email`: Filter by email
  - Returns profiles with related requests (as student and expert)
- `POST /api/profiles`
  - Creates a new profile
  - Body should match the shape of the profiles table
- `PATCH /api/profiles/[id]`
  - Updates an existing profile
  - Body contains fields to update

### Sources (`/api/sources`)
- `GET /api/sources`
  - Query params:
    - `createdBy`: Filter by creator's profile ID
  - Returns sources with related creator profile, requests, and curriculum nodes
- `POST /api/sources`
  - Creates a new source
  - Body should match the shape of the sources table
- `PATCH /api/sources/[id]`
  - Updates an existing source
  - Body contains fields to update

### Messages (`/api/messages`)
- `GET /api/messages`
  - Query params:
    - `requestId`: Filter by request ID
    - `senderId`: Filter by sender's profile ID
  - Returns messages with related sender profile and request data
- `POST /api/messages`
  - Creates a new message
  - Body should match the shape of the messages table
- `PATCH /api/messages/[id]`
  - Updates an existing message
  - Body contains fields to update

### Curriculums (`/api/curriculums`)
- `GET /api/curriculums`
  - Query params:
    - `requestId`: Filter by request ID
  - Returns curriculums with related request and curriculum nodes data
- `POST /api/curriculums`
  - Creates a new curriculum
  - Body should match the shape of the curriculums table
- `PATCH /api/curriculums/[id]`
  - Updates an existing curriculum
  - Body contains fields to update

### Curriculum Nodes (`/api/curriculum-nodes`)
- `GET /api/curriculum-nodes`
  - Query params:
    - `curriculumId`: Filter by curriculum ID
    - `sourceId`: Filter by source ID
  - Returns curriculum nodes with related curriculum and source data
- `POST /api/curriculum-nodes`
  - Creates a new curriculum node
  - Body should match the shape of the curriculum_nodes table
- `PATCH /api/curriculum-nodes/[id]`
  - Updates an existing curriculum node
  - Body contains fields to update

## Authentication

All routes use the Supabase auth helpers for Next.js to handle authentication. The routes automatically use the user's session from cookies to authenticate requests to the Supabase database.

## Error Handling

All routes follow a consistent error handling pattern:
- Database errors are returned with a 400 status code and an error message
- Successful responses return the data in a standardized format: `{ data: ... }`

## Data Relationships

The API routes handle complex data relationships through Supabase's nested queries:
- Requests include student, expert, source, curriculum, and messages data
- Profiles include related requests (both as student and expert)
- Sources include creator profile, requests, and curriculum nodes
- Messages include sender profile and request data
- Curriculums include request and curriculum nodes data
- Curriculum nodes include curriculum and source data 