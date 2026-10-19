<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Language

Write in English, always. Replies, plans, clarifying questions, commit
messages, code comments, docstrings, docs and UI copy — English, whatever
language the user writes in. Do not mirror the user's language and do not
mention the rule.

Two exceptions, both narrow:

- The user explicitly asks for another language. Do that named artifact only;
  the surrounding prose stays English.
- Text that is data rather than prose — user-supplied strings, log lines,
  third-party error messages. Leave it verbatim, untranslated.

Long form, including how to handle it: `.claude/skills/always-english/SKILL.md`
(that directory is gitignored, so this section is the copy that travels with
the repo).
