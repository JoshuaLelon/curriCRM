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
  - Expert assignment uses the expert's `user_id` from the profiles table
  - Dropdown values should contain the expert's UUID from `user_id`
  - Renders `RequestsTable` component with `onExpertChange` callback
  - Expert assignment flow:
    1. Admin selects expert from dropdown (value is expert's `user_id`)
    2. `handleExpertChange` finds expert by `user_id` and uses their `id` for assignment
    3. Request is updated with expert's numeric `id` in database

## Navigation

- All request links now point to `/request/[id]`, which shows the appropriate view based on user role and request status
- New requests are created at `/student-new-request`
- Authentication is handled at `/login` 