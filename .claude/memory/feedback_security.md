---
name: Security rules
description: OWASP Top 10 compliance, no exposed secrets, no unsafe patterns, secure by default on all pages and components
type: feedback
---

All output must be secure by default.

**Why:** User explicitly requested security standards be enforced at the same level as design and code quality. A fast, beautiful website that is vulnerable is not production ready.

**How to apply:**
- Follow OWASP Top 10 best practices at all times
- Never expose sensitive data in markup, attributes, or client-side code
- Sanitise and validate all user input at system boundaries
- Never use innerHTML or dangerouslySetInnerHTML without explicit sanitisation
- Avoid inline event handlers (onclick, onload, etc.)
- Use CSP-compatible patterns — no unsafe-inline where avoidable
- No hardcoded credentials, API keys, or secrets in any file
- Use HTTPS-only resource references
- Avoid third-party scripts unless strictly necessary and trusted
- Ensure forms have CSRF protection where applicable
- Never trust client-side data for security decisions

**Astro-specific:**
- Prefer server-side rendering for sensitive operations
- Keep API keys and secrets in environment variables only
- Never expose .env values to the client unless explicitly safe
