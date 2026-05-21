---
name: Automatic Agent Delegation System
description: 5-tier task classification system with intermediate pipelines, handoff protocol, escalation rules, and parallel execution waves for HMDG Astro projects
type: project
---

The automatic agent delegation system lives at `.claude/rules/agent-delegation.md` (imported into CLAUDE.md via `@` reference).

**Why:** User wanted a system that handles not just simple tasks and the full 10-agent pipeline, but everything in between — with clear rules for what each agent passes to the next, what to do when a reviewer finds an issue mid-pipeline, and how to handle complex multi-domain tasks.

**How to apply:** Before every task, classify the tier and announce the pipeline. Never jump to code without stating which agents are involved.

## 5 Tiers

- **Tier 0** — Advisory: questions, explanations, lookups. No agent needed.
- **Tier 1** — Single specialist: one-domain fix with no visual change (SEO, a11y, security, performance).
- **Tier 2** — Design + Build: any visible change, even small. Always `ui-designer → frontend-builder`.
- **Tier 3** — Component or Feature: new feature/component needing UX planning. 3–5 agents.
- **Tier 4** — Page Build: new page or major redesign. 6–8 agents.
- **Tier 5** — Full Pipeline: homepage, template, structural overhaul. All 10 agents.

## Key rules

- When in doubt, go one tier higher.
- `ui-designer + frontend-builder` are always paired for any visible output (Tier 2+).
- Reviewer escalation: styling issue → route back through ui-designer → frontend-builder. Code-only issue → frontend-builder directly.
- Critical issues (GDPR, a11y, security) always get a 2-pass: fix then verify.
- Parallel execution: after build, a11y + performance + seo run as Wave 1; marketing + security as Wave 2; conversion-reviewer always last.
