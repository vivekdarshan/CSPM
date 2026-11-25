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
| 2     | AWS onboarding: connection workflow, status, account details              | Done        |
| 3     | Asset inventory: EC2, S3, RDS, IAM, security groups                       | Done        |
| 4     | Security findings: severity, details, risk, remediation guidance          | Done        |
| 5     | Compliance (CIS) and alerts                                               | Done        |
| 6     | Remediation: approvals, execution, verification                           | Not started |

## Run locally

```bash
pnpm install
pnpm dev
```

The app runs in **demo mode** by default: sign in with any email and a password of 7+ characters. All data comes from `src/lib/api/mock/data.ts`.

## Project layout

| Path                      | What lives there                                                                    |
| ------------------------- | ----------------------------------------------------------------------------------- |
| `src/types/cspm.ts`       | Domain types (accounts, assets, findings, compliance, remediation)                  |
| `src/lib/api/`            | Data layer: `cspm-api.ts` (fetch functions), `queries.ts` (TanStack Query), `mock/` |
| `src/lib/severity.ts`     | Severity order, labels, colors and score weights                                    |
| `src/components/cspm/`    | Reusable security UI: severity/status badges, provider icon, score ring, stat card  |
| `src/features/dashboard`  | Security overview dashboard                                                         |
| `src/features/accounts`   | Account list, AWS connect wizard, account details                                   |
| `src/features/assets`     | Asset inventory (filters in the URL) and asset details                              |
| `src/features/findings`   | Findings list, finding details (risk, fix steps, CLI), suppress / start fixing      |
| `src/features/compliance` | CIS AWS v3.0.0 controls, account filter, CSV export, printable report               |
| `src/features/alerts`     | Alert inbox, rules and notification channels (header bell lives in `layout/`)       |
| `public/aws/`             | CloudFormation template for the read-only IAM role                                  |
| `src/routes/`             | File-based routes (TanStack Router)                                                 |

### Connecting a real backend

Every screen reads data through `src/lib/api/cspm-api.ts`. Set these in `.env` to switch from mock data to an API:

```bash
VITE_USE_MOCK_API=false
VITE_API_URL=https://api.example.com
```

## Connecting AWS

The connect wizard (Cloud accounts → Connect account) has the customer create a read-only IAM role that Vigil assumes with an external ID:

- **Template:** `public/aws/vigil-read-only-role.yaml` creates the role with the AWS-managed `SecurityAudit` and `ViewOnlyAccess` policies. No write permissions.
- **External ID:** issued per connection by `getAwsOnboardingSetup()`. A real backend must generate and store it server-side.
- **Demo mode:** the trusted account is `111122223333` (the AWS documentation example). Any role ARN in the same account as the entered account ID passes; the Shared Services account always fails so the error state can be seen.

## Tech stack

React 19, Vite, TypeScript, TanStack Router / Query / Table, shadcn/ui (Tailwind CSS + Radix UI), Recharts, Zustand.

## Credits

Built on [shadcn-admin](https://github.com/satnaing/shadcn-admin) by [@satnaing](https://github.com/satnaing), licensed under the [MIT License](./LICENSE).
