# Home Page

This directory contains the unified home page that serves as the main dashboard for all user types.

## Structure

- `page.tsx`: Main home page that:
  - Detects user role
  - Loads user-specific data
  - Renders appropriate view based on user role

## Components

All home-related components are in `components/home/`:

- `student-home.tsx`: Shows student's requests and new request button
- `expert-home.tsx`: Shows expert's assigned requests
- `admin-home.tsx`: Shows all requests with expert assignment

## Navigation

- All request links now point to `/request/[id]`, which shows the appropriate view based on user role and request status
- New requests are created at `/student-new-request`
- Authentication is handled at `/login` 