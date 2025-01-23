# Login/Home Page Refactoring Implementation Checklist

## Delete Old Login Pages
- [ ] Remove "app/student-login/page.tsx"
- [ ] Remove "app/expert-login/page.tsx"
- [ ] Remove "app/admin-login/page.tsx"
- [ ] Update READMEs to remove references to old login pages

## Create New Unified Login Page
- [ ] Create "app/login/page.tsx"
- [ ] Implement shared login logic for all user types
- [ ] Add user role storage in session/database
- [ ] Add redirect to "/home"
- [ ] Create/update "app/login/README.md"

## Remove Old Home Pages
- [ ] Remove "app/student-home/page.tsx"
- [ ] Remove "app/expert-home/page.tsx"
- [ ] Remove "app/admin-home/page.tsx"
- [ ] Update READMEs to remove references to old home pages

## Create Unified Home Page
- [ ] Create "app/home/page.tsx"
- [ ] Add user role detection logic
- [ ] Create "components/home" directory
- [ ] Create modular components:
  - [ ] components/home/student-home.tsx
  - [ ] components/home/expert-home.tsx
  - [ ] components/home/admin-home.tsx
- [ ] Implement conditional rendering based on user role
- [ ] Create/update "app/home/README.md"

## Update Navigation and Workflow References
- [ ] Update router.push() calls throughout codebase
- [ ] Update session handling for new unified approach
- [ ] Update Supabase auth flow in "app/auth/callback/route.ts"
- [ ] Update any other auth-related redirects

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