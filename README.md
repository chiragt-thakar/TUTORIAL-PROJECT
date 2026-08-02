# Python Backend + FastAPI: Zero to Master

A personal, project-driven learning site for an experienced Node.js/TypeScript backend engineer moving into production Python and FastAPI. All 15 modules are fully authored, with 79 lessons and 15 cumulative assignments.

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

## Validation and static build

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

The build command creates a static site in `out/`. It can be hosted on Vercel or any static hosting provider.

## Content structure

Each directory under `content/modules` contains a small `module.json`. Every listed lesson and assignment has matching `.mdx` content with validated frontmatter. See `CONTENT_GUIDE.md` for the authoring contract.

Content loading is centralized in `lib/content/loader.ts`. Pages are statically generated from local files, and metadata failures stop the build with a file-specific error.

## Progress behavior

Progress stays on the current device under `python-backend-learning-progress:v1`. It records completed lessons, exercises, assignments, the last visited lesson, and activity time. Invalid or older data safely resets. The first server render is deterministic; stored progress is applied only after hydration. There is no login or cloud sync.

## Free deployment

The project is prepared for Vercel's free Hobby plan and contains no ChatGPT Sites, vinext, Wrangler, or Cloudflare Worker integration. See `DEPLOYMENT.md` for the Vercel steps and a Cloudflare Pages free fallback.

## Architectural decisions

- Server Components own filesystem content loading and MDX compilation.
- Client Components are limited to local progress, theme, and responsive navigation state.
- Module JSON stores small curriculum metadata; long-form teaching stays in MDX.
- Curriculum availability is explicit in module metadata, and every currently available route has authored content.
- The site intentionally has no backend, CMS, auth, analytics, or progress API.

## Limitations

- Progress and theme choices do not sync across browsers or devices.
- The course embeds project code rather than generating a separate downloadable backend repository.
- Code copy buttons are omitted to keep client JavaScript and maintenance cost low.
