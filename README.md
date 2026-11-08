This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Supabase Free Plan Keep-Alive

When deployed to Vercel, the schedule in `vercel.json` calls `/api/cron/supabase-keepalive` once a day. The endpoint runs a lightweight read against the `purchases` table. No additional GitHub Actions secrets, repository variables, or cron-specific environment variables are required; the deployment must already have the Supabase environment variables used by the app.

The schedule is set for 18:00 UTC (03:00 JST). Vercel Hobby runs daily cron jobs with up to 59 minutes of timing variance. Cron jobs run on production deployments only.

This periodic request may help keep a Free Plan project active, but Supabase does not guarantee that it will prevent a project from being paused for inactivity. Upgrade to a paid plan if uninterrupted availability is required.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
