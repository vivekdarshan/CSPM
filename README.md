# Vigil — Cloud Security Posture Management for SMEs

A simplified security platform for small and medium businesses using AWS, Azure and Google Cloud.

- Identify misconfigurations
- Detect exposed resources
- Monitor security settings
- Recommend corrective actions

> "Vigil" is a placeholder product name. Change it in `src/config/app.ts`.

## Build phases

| Phase | Scope                                                                     | Status      |
| ----- | ------------------------------------------------------------------------- | ----------- |
| 1     | Frontend foundation: login, sidebar, header, shared components, dashboard | Done        |
| 2     | AWS onboarding: connection workflow, status, account details              | Not started |
| 3     | Asset inventory: EC2, S3, RDS, IAM, security groups                       | Not started |
| 4     | Security findings: severity, details, risk, remediation guidance          | Not started |
| 5     | Compliance (CIS) and alerts                                               | Not started |
| 6     | Remediation: approvals, execution, verification                           | Not started |

## Run locally

```bash
pnpm install
pnpm dev
```

The app runs in **demo mode** by default: sign in with any email and a password of 7+ characters. All data comes from `src/lib/api/mock/data.ts`.

## Project layout

| Path                     | What lives there                                                                    |
| ------------------------ | ----------------------------------------------------------------------------------- |
| `src/types/cspm.ts`      | Domain types (accounts, assets, findings, compliance, remediation)                  |
| `src/lib/api/`           | Data layer: `cspm-api.ts` (fetch functions), `queries.ts` (TanStack Query), `mock/` |
| `src/lib/severity.ts`    | Severity order, labels, colors and score weights                                    |
| `src/components/cspm/`   | Reusable security UI: severity/status badges, provider icon, score ring, stat card  |
| `src/features/dashboard` | Security overview dashboard                                                         |
| `src/routes/`            | File-based routes (TanStack Router)                                                 |

### Connecting a real backend

Every screen reads data through `src/lib/api/cspm-api.ts`. Set these in `.env` to switch from mock data to an API:

```bash
VITE_USE_MOCK_API=false
VITE_API_URL=https://api.example.com
```

## Tech stack

React 19, Vite, TypeScript, TanStack Router / Query / Table, shadcn/ui (Tailwind CSS + Radix UI), Recharts, Zustand.

## Credits

Built on [shadcn-admin](https://github.com/satnaing/shadcn-admin) by [@satnaing](https://github.com/satnaing), licensed under the [MIT License](./LICENSE).
