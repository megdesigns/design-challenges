# Security

This is a static site. It has no backend, no accounts, no cookies and no
analytics. Everything a visitor saves (likes, checklist progress, recent
challenges, filters, theme) is stored in their own browser's `localStorage`
and never leaves their device.

Safeguards in the code:

- A strict Content Security Policy in `docs/index.html` (scripts and data from
  this site only; fonts from Google Fonts).
- All prompt text is escaped before it is rendered.
- Saved data is shape-checked on load, so corrupted storage falls back to
  defaults.
- The local dev server (`server.js`) serves only files inside `docs/`,
  accepts only GET/HEAD, and binds to localhost by default.

## Reporting a vulnerability

Please open a private report through GitHub's "Report a vulnerability" button
on the Security tab of this repository rather than a public issue.
