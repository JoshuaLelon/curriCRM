# CurriCRM

A modern CRM system using Next.js 14, TypeScript, and Tailwind.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- ESLint
- React Server Components
- ShadCN UI
  - Button
  - Card
  - Form
  - Input
  - Table
  - Dialog
  - Sheet
  - Tabs
  - Avatar
  - Dropdown Menu
- Supabase (Hosted)

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Project Structure

```
src/
├── app/           # Next.js App Router pages and layouts
│   └── ui/       # ShadCN UI components
├── components/    # React components
├── lib/          # Utility functions and shared logic
└── types/        # TypeScript type definitions
```

## Email Setup
- Since you're running on Supabase Hosting, make sure your "Site URL" is correct in your project's Supabase settings.  
- Under "Authentication" in Supabase, configure your email provider (e.g., SendGrid) for production or test emails.  
- Magic link logs appear in the Next.js logs, and you can also monitor the "Auth" logs in the Supabase Dashboard for debugging.

## Features

(To be implemented)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Email Troubleshooting

- By default, Supabase local dev sends test emails to an inbucket server on port 54324.
- Check http://127.0.0.1:54324 or similar URL to see if your magic link email appears.
- If you want to send real emails in dev, configure an SMTP provider in supabase/config.toml or via the dashboard.

## Logging
- Server-side logs (console.info, console.warn, console.error) are visible in terminal or hosting provider logs, not the browser console.
- route.ts now uses console.info to log magic-link POST requests and any errors from Supabase.
- src/lib/supabase/server.ts logs cookie operations.
