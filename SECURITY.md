# Security policy

Lando is currently a portfolio MVP intended for local development and closed testing, not a public production service.

Do not create a public issue containing credentials, tokens, personal data, database dumps or contents of `.env`. Report a suspected vulnerability privately to the repository owner through the contact method listed on their GitHub profile.

Before running the project, copy `.env.example` to `.env` and create your own local secrets. Never commit `.env`, files from `backups/` or files from `public/uploads/`.

## Known development-tool advisory

The current npm audit can report `GHSA-ggr8-5vv4-36mx` through `prisma -> @prisma/config -> deepmerge-ts`. It affects recursive object merging in the local Prisma CLI dependency tree. Lando does not expose Prisma configuration merging to untrusted HTTP input. npm currently proposes a breaking downgrade from Prisma 7 to Prisma 6; this is intentionally not applied without a tested upstream-compatible fix.
