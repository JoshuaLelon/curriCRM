# Login/Home Page Refactoring Implementation Checklist

## Delete Old Login Pages
- [x] Remove "app/student-login/page.tsx"
- [x] Remove "app/expert-login/page.tsx"
- [x] Remove "app/admin-login/page.tsx"
- [x] Update READMEs to remove references to old login pages

## Create New Unified Login Page
- [x] Create "app/login/page.tsx"
- [x] Implement shared login logic for all user types
- [x] Add user role storage in session/database
- [x] Add redirect to "/home"
- [x] Create/update "app/login/README.md"

## Remove Old Home Pages
- [x] Remove "app/student-home/page.tsx"
- [x] Remove "app/expert-home/page.tsx"
- [x] Remove "app/admin-home/page.tsx"
- [x] Update READMEs to remove references to old home pages

## Create Unified Home Page
- [x] Create "app/home/page.tsx"
- [x] Add user role detection logic
- [x] Create "components/home" directory
- [x] Create modular components:
  - [x] components/home/student-home.tsx
  - [x] components/home/expert-home.tsx
  - [x] components/home/admin-home.tsx
- [x] Implement conditional rendering based on user role
- [x] Create/update "app/home/README.md"

## Update Navigation and Workflow References
- [x] Update router.push() calls throughout codebase
- [x] Update session handling for new unified approach
- [x] Update Supabase auth flow in "app/auth/callback/route.ts"
- [x] Update any other auth-related redirects

## Documentation Updates
- [ ] Update all affected directory READMEs
- [ ] Update root README.md with new structure
- [ ] Document new user flow in relevant files

## Testing
- [ ] Test student workflow in unified home page
- [ ] Test expert workflow in unified home page
- [ ] Test admin workflow in unified home page
- [ ] Test login page for all user types
- [ ] Test auth redirects and protected routes 

## Unify Request Pages
- [ ] Create shared types and utilities:
  - [ ] Create "types/request.ts" with RequestStatus type ("not_accepted" | "not_started" | "in_progress" | "finished")
  - [ ] Create "utils/request-permissions.ts" for role+status based permission checks
  - [ ] Create "utils/request-status.ts" for status determination logic

- [ ] Create "app/request/[id]/page.tsx":
  - [ ] Add role detection
  - [ ] Add status detection
  - [ ] Add conditional rendering based on role
  - [ ] Add data fetching for request, curriculum, messages
  - [ ] Add error boundaries and loading states

- [ ] Move and update shared components in "components/request":
  - [ ] Move RequestDetails to "components/request/request-details.tsx"
    - [ ] Add edit mode for student in not_accepted/not_started states
    - [ ] Add expert assignment UI for admin in not_accepted/not_started states
  - [ ] Move Chat to "components/request/chat.tsx"
    - [ ] Add view-only mode for finished state
    - [ ] Hide for not_accepted state
  - [ ] Move CurriculumTable to "components/request/curriculum-table.tsx"
    - [ ] Add edit mode for assigned expert in not_started/in_progress states
  - [ ] Move CurriculumViewTable to "components/request/curriculum-view-table.tsx"

- [ ] Create role-specific components with state handling:
  - [ ] Create "components/request/student-view.tsx":
    - [ ] Add request editing UI for not_accepted/not_started states
    - [ ] Add delete button for not_accepted state
    - [ ] Add chat for not_started/in_progress states
    - [ ] Add view-only mode for finished state
  - [ ] Create "components/request/expert-view.tsx":
    - [ ] Add view-only mode for unassigned or not_accepted/finished states
    - [ ] Add curriculum editing for assigned not_started/in_progress states
    - [ ] Add chat for not_started/in_progress states
    - [ ] Add submit button for marking as finished
  - [ ] Create "components/request/admin-view.tsx":
    - [ ] Add expert assignment UI for not_accepted/not_started states
    - [ ] Add view-only mode for all other states

- [ ] Create state transition handlers:
  - [ ] Admin: expert assignment (not_accepted → not_started)
  - [ ] Expert: curriculum node creation (not_started → in_progress)
  - [ ] Expert: request submission (in_progress → finished)

- [ ] Update imports and paths in all components

- [ ] Remove old request pages:
  - [ ] Remove "app/student-request/[id]/in-progress/page.tsx"
  - [ ] Remove "app/student-request/[id]/finished/page.tsx"
  - [ ] Remove "app/expert-request/[id]/page.tsx"

- [ ] Update all router.push() calls to use new "/request/[id]" path

- [ ] Update READMEs to reflect new unified request page structure

- [ ] Test request page for all combinations:
  - [ ] Test student view:
    - [ ] Not accepted (edit + delete)
    - [ ] Not started (edit only)
    - [ ] In progress (view + chat)
    - [ ] Finished (view only)
  - [ ] Test expert view:
    - [ ] Not accepted (view only)
    - [ ] Not started (curriculum edit if assigned)
    - [ ] In progress (curriculum edit if assigned)
    - [ ] Finished (view only)
  - [ ] Test admin view:
    - [ ] Not accepted (expert assignment)
    - [ ] Not started (expert assignment)
    - [ ] In progress (view only)
    - [ ] Finished (view only) 