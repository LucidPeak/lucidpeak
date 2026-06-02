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
Trigger: Any user-facing string in content/*.ts or components/**/*.tsx (pitch, tagline, title, label, error/visual text).

---

## Archived entries

(none yet)
