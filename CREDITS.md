# Credits

Revokr is built on the work of the projects below. Licences were read from each package's own
metadata or licence file at the versions in `go.mod` and `web/revokr/package.json`. Transitive
dependencies carry their own licences, listed in `go.sum` and `package-lock.json`.

## Scanning

Revokr does **not** use Gitleaks. Secret detection is a small set of regular expressions
written for this project in [internal/detector](internal/detector/detector.go).

## Go backend

| Project | Use | Licence |
|---|---|---|
| [AWS SDK for Go v2](https://github.com/aws/aws-sdk-go-v2) (`config`, `credentials`, `iam`, `sts`, `sqs`, `secretsmanager`) | IAM key rotation, SQS, Secrets Manager | Apache-2.0 |
| [Gin](https://github.com/gin-gonic/gin) | HTTP API | MIT |
| [pgx](https://github.com/jackc/pgx) | PostgreSQL driver and pool | MIT |
| [godotenv](https://github.com/joho/godotenv) | Local `.env` loading | MIT |
| [openai-go](https://github.com/openai/openai-go) | AI analyst backend | Apache-2.0 |
| [golang.org/x/crypto](https://pkg.go.dev/golang.org/x/crypto) (`nacl/box`) | Sealed-box encryption for GitHub Actions secrets | BSD-3-Clause |

## Dashboard

| Project | Use | Licence |
|---|---|---|
| [Next.js](https://github.com/vercel/next.js), [React](https://github.com/facebook/react) | Framework and UI | MIT |
| [Tailwind CSS](https://github.com/tailwindlabs/tailwindcss), [tw-animate-css](https://github.com/Wombosvideo/tw-animate-css) | Styling | MIT |
| [shadcn/ui](https://github.com/shadcn-ui/ui) (`shadcn` CLI), [Base UI](https://github.com/mui/base-ui) | Component scaffolding and primitives | MIT |
| [class-variance-authority](https://github.com/joe-bell/cva) | Component variants | Apache-2.0 |
| [cn](https://www.npmjs.com/package/cn) | Class-name helper | MIT |
| [framer-motion](https://github.com/motiondivision/motion) | Animation | MIT |
| [Lenis](https://github.com/darkroomengineering/lenis) | Smooth scrolling | MIT |
| [Lucide](https://github.com/lucide-icons/lucide) | Icons | ISC |
| [TypeScript](https://github.com/microsoft/TypeScript) | Language tooling | Apache-2.0 |
| [Geist](https://vercel.com/font) (via `next/font/google`) | Typefaces | SIL OFL 1.1 |

`gsap` (GreenSock standard "no charge" licence), `recharts` (MIT) and `motion` (MIT) are declared
in `web/revokr/package.json` but no source file imports them at the time of writing, so nothing
in the shipped app comes from them.

## Services

Amazon Web Services (Amplify, ECS, RDS, SQS, Secrets Manager, IAM, CloudWatch), GitHub (Apps,
webhooks and the Actions secrets API), OpenAI (analyst model), and Google and GitHub OAuth for
dashboard sign-in.

## Third-party marks

The GitHub and Google logos in the sign-in UI and the provider marks in
[web/revokr/components/icons](web/revokr/components/icons) belong to their respective owners and
are used only to identify those services.
