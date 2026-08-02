# Python Backend + FastAPI: Zero to Master

A personal, project-driven learning site for an experienced Node.js/TypeScript backend engineer moving into production Python and FastAPI. Modules 1–3 are fully authored; Modules 4–13 are structured curriculum plans.

## Stack

- Next.js 16 App Router, React 19, strict TypeScript
- Tailwind CSS 4 with handwritten components
- Local MDX rendered in Server Components with `next-mdx-remote`
- YAML plus Zod frontmatter and module metadata validation
- Server-side Shiki highlighting through `rehype-pretty-code`
- Versioned browser `localStorage` for device-local progress
- Node's test runner through `tsx`

## Prerequisites and installation

Use Node.js 22.13 or newer and npm.

```powershell
npm.cmd install
npm.cmd run dev
```

Open `http://localhost:3000`. On shells that permit `npm.ps1`, `npm` works as usual.

## Validation and production build

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd start
```

## Content structure

Each directory under `content/modules` contains a small `module.json`. Available lessons have matching `.mdx` files with validated frontmatter. Planned modules contain metadata and ordered lesson summaries but no empty lesson routes. See `CONTENT_GUIDE.md` for the authoring contract.

Content loading is centralized in `lib/content/loader.ts`. Pages are statically generated from local files, and metadata failures stop the build with a file-specific error.

## Progress behavior

Progress stays on the current device under `python-backend-learning-progress:v1`. It records completed lessons, exercises, assignments, the last visited lesson, and activity time. Invalid or older data safely resets. The first server render is deterministic; stored progress is applied only after hydration. There is no login or cloud sync.

## Deploy to Vercel

1. Push the repository to a Git provider.
2. Import it into Vercel as a Next.js project.
3. Keep the package manager as npm and build command as `npm run build`.
4. No environment variables, database, runtime writes, or custom server are required.
5. Deploy. Local MDX is traced into the build through `next.config.ts`.

The included `.openai/hosting.json`, Vite configuration, and `npm run sites:build` also support a Sites-hosted preview; the normal application and Vercel build remain standard Next.js.

## Architectural decisions

- Server Components own filesystem content loading and MDX compilation.
- Client Components are limited to local progress, theme, and responsive navigation state.
- Module JSON stores small curriculum metadata; long-form teaching stays in MDX.
- Planned modules are navigable as outlines but cannot route to empty lessons.
- The site intentionally has no backend, CMS, auth, analytics, or progress API.

## Limitations

- Progress and theme choices do not sync across browsers or devices.
- Modules 4–13 are planned but not yet fully authored.
- The course embeds project code rather than generating a separate downloadable backend repository.
- Code copy buttons are omitted to keep client JavaScript and maintenance cost low.

For non-Vercel production hosts, set optional `NEXT_PUBLIC_SITE_URL` to the public origin so absolute social-preview metadata uses the deployed domain. Vercel supplies `VERCEL_URL` automatically; normal site operation requires no environment values.
