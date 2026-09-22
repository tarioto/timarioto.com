# timarioto.com

![CI](https://github.com/tarioto/timarioto.com/workflows/CI/badge.svg)

Source for [timarioto.com](https://timarioto.com), a personal site built with
React, TypeScript, and Bun.

## Stack

- **React 19 + TypeScript**, bundled with **Bun** (`Bun.build()`/`Bun.serve()`
  via [`tools/`](tools) — no Vite/webpack)
- Static site served from **S3** behind **CloudFront**, provisioned with
  **OpenTofu** (see [`infra/`](infra))
- A couple of small **AWS Lambda** pollers (see [`lambda/`](lambda)) keep
  `trakt.json` and `weather.json` fresh on a schedule
- A local script (see [`scripts/song-of-the-month/`](scripts/song-of-the-month))
  publishes `song.json` and `album.json` each month from local Music.app data
- **GitHub Actions** build, lint, and deploy on every push to `main`
  ([`.github/workflows/`](.github/workflows))

## Getting started

Requires [Bun](https://bun.sh).

```bash
bun install
bun dev        # start the local dev server
```

Other scripts:

```bash
bun run build  # type-check and build to dist/
bun lint       # biome check (lint + format check)
bun format     # biome check --write (auto-fix lint + format)
bun preview    # preview a production build locally
```

## Project layout

```
src/            React app (components, hooks, and data for the site)
public/         Static assets, plus JSON files written by pollers/scripts at runtime
tools/          Bun dev/build/preview scripts (replace Vite)
infra/          OpenTofu (Terraform-compatible) infrastructure — see infra/README.md
lambda/         Scheduled pollers that write trakt.json / weather.json
scripts/        Local automation, e.g. song-of-the-month publishing
.github/        CI, infra, and secret-scanning workflows
```

## Deployment

Pushes to `main` build the site and deploy it to S3/CloudFront via OIDC —
no long-lived AWS credentials are stored in GitHub. Infrastructure changes
under `infra/` or `lambda/` are planned and applied by a separate workflow;
see [`infra/README.md`](infra/README.md) for details on the underlying
resources and how to stand up the stack from scratch.

## Secret scanning

Commits are scanned locally with [gitleaks](https://github.com/gitleaks/gitleaks)
via pre-commit, and again in CI with [TruffleHog](https://github.com/trufflesecurity/trufflehog).
To enable the local hook:

```bash
brew install pre-commit gitleaks
pre-commit install
```

## License

See [LICENSE](LICENSE).
