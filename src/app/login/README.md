# Login Page

This directory contains the Magic Link login page for the app.

- page.tsx: Renders a form that accepts an email and sends a POST request to /api/auth/magic-link.
- Logs have been added to /api/auth/magic-link/route.ts to help diagnose any issues with Supabase signInWithOtp.
- For local development with the default Supabase config, check http://localhost:54324 for test emails (inbucket).
- Displays success or error messages based on the server response.

## Hosted Supabase Considerations
- Make sure your Supabase "Site URL" in Project Settings matches your deployed domain.
- Confirm email sending is configured in the Supabase Dashboard under "Authentication" → "Email" settings (SMTP or a built-in email provider).
- Check the Supabase "Logs" in the Dashboard to see if emails are being sent or if there are errors.

# Login Page

This directory contains the Magic Link login page.

- page.tsx: A client component that sends a POST request to /api/auth/magic-link.
- We've replaced old console logs with server-side logging (console.info, console.warn, console.error) in route.ts and server.ts, all visible in the terminal/hosting provider logs.
- For hosted Supabase, confirm your email settings in the Supabase dashboard. 