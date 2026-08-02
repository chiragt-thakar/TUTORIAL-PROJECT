# Free deployment

This learning site is a fully static Next.js export. `npm.cmd run build` creates the deployable `out/` directory. It needs no database, server function, environment variable, or paid runtime.

## Recommended: Vercel Hobby

Vercel's Hobby plan is currently $0 for personal, non-commercial projects. This personal learning site fits that purpose. Vercel provides a generated `*.vercel.app` address, automatic HTTPS, and deployments from Git.

1. Push this project to a repository owned by your personal GitHub, GitLab, or Bitbucket account.
2. Sign in at `https://vercel.com` with that Git provider.
3. Select **Add New → Project**, then import the repository.
4. Keep **Framework Preset** as **Next.js**.
5. Keep the project root as the repository root.
6. Use the existing build command, `npm run build`. No output override or environment variable is required.
7. Select **Deploy**.
8. Open the generated `https://<project-name>.vercel.app` address.

New pushes to the production branch create production deployments. Other branches and pull requests receive preview deployments.

### Hobby-plan boundary

Use Hobby only for personal, non-commercial work and stay within its included usage. If this becomes a business or paid course, review Vercel's current plan terms before continuing.

## Free fallback: Cloudflare Pages

Because the build output is plain static HTML, CSS, and JavaScript, Cloudflare Pages can host it without the deleted ChatGPT/Cloudflare Worker adapter.

1. Push the repository to GitHub or GitLab.
2. In Cloudflare, open **Workers & Pages → Create → Pages → Connect to Git**.
3. Select the repository.
4. Set the build command to `npm run build`.
5. Set the output directory to `out`.
6. Deploy and open the generated `*.pages.dev` address.

Cloudflare Pages currently documents free static asset requests, up to 500 builds per month, and up to 20,000 files per site. This course is far below that file limit.

## Before publishing changes

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

Do not commit `.env` files, access tokens, `.vercel`, or generated build directories.
