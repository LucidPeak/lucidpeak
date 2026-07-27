# Project Mistakes Ledger

This file is read by Claude at the start of every task. It encodes
project-specific lessons so the same mistake isn't made twice.

**Maintained by:** Claude (with Teo's corrections)
**Format:** See system prompt for entry structure.

---

## Active entries

[2026-06-02] No em-dashes in copy — use hyphens
Tags: #copy #convention #typography
What happened: Wrote two app pitches using long em-dashes ("Building in stealth — a tool…"); Teo asked to replace all em-dashes with regular short hyphens.
Why it was wrong: Project copy style avoids the long em-dash (—). Not obvious from code; a stated preference. Introspection: #prompt-ambiguity — house copy rules weren't documented, so the default writing habit (em-dash) leaked in.
Correct approach: Use a regular hyphen "-" (spaced " - " where a dash separates clauses). Never the em-dash (—) or en-dash (–) in user-facing copy: pitches, taglines, ship-log titles, terminal strings, card text, dev tooltips. Code comments are exempt (not copy).
Trigger: Any user-facing string in content/*.ts, components/**/*.tsx, or lib/*.ts email copy (pitch, tagline, title, label, error/visual text, email subject/body). [Updated 2026-07-27: audit found violations in lib/welcome-email.ts and content/apps.ts - trigger widened to lib/ email copy.]

[2026-07-27] Delegated verifiers must receive MISTAKES.md rules
Tags: #verification-gap #delegation #copy
What happened: Workflow verify agents refuted two real em-dash findings in lib/welcome-email.ts because the verify prompt pointed them only at CLAUDE.md/.impeccable.md; the no-dash rule lives in MISTAKES.md.
Why it was wrong: House copy rules are ledger-only context; subagents cannot discover them unless the handoff packet inlines them. Introspection: #verification-gap - delegated judgment without the rule source.
Correct approach: Any delegated audit/verify prompt touching user-facing copy in this repo must inline the relevant MISTAKES.md entries verbatim.
Trigger: Spawning subagents to find or verify copy/style violations.

---

## Archived entries

(none yet)
