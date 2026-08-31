# Security Policy

## Reporting a vulnerability

Please **do not open a public issue** for security problems. Instead, use
GitHub's private vulnerability reporting: go to the repository's **Security**
tab → **Report a vulnerability**. If that is unavailable to you, reach the
maintainers through the [contact page](https://frilansaresverige.se/kontakt).

The community is volunteer-run, so we answer on a best-effort basis — but
security reports are read first. You can expect an acknowledgement within a
few days.

## Scope

Worth knowing before you dig in:

- The site is statically generated and has **no database**. The membership
  and gig-tip forms post to Slack via incoming webhooks configured through
  environment variables (`apps/web/.env.example` documents them).
- Reports about those form endpoints (`pages/api/`), the webhook handling,
  or anything that could expose the webhook URLs are especially relevant.
- Secrets never belong in the repo. If you find one committed, report it
  privately as above.

## Supported versions

Only what is deployed from `main` is supported. There are no maintained
release branches.
