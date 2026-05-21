---
name: Code quality and DOM rules
description: All output must be clean, minimal, and production ready — no unnecessary wrappers, no deep nesting, no duplicate markup, extract reusable components
type: feedback
---

All output must be clean, minimal, and production ready.

**Why:** User set this as a hard project standard. Every line of markup must have a purpose. If something can be simplified, it must be simplified.

**How to apply:**
- Avoid unnecessary wrapper divs
- Avoid deeply nested DOM structures without purpose
- Reduce DOM depth where possible
- No duplicate components or repeated markup patterns
- Extract reusable components instead of repeating sections
- Avoid redundant Tailwind classes
- Group reusable patterns into components or utility classes
