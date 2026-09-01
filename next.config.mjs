// DELETE THIS FILE. It's a leftover duplicate of next.config.ts — Next.js
// only supports one config file, and having both here at once is invalid.
// This was very likely the cause of production and localhost behaving
// differently (e.g. the chat widget showing locally but not on the live
// site) even with the branch fully up to date: whichever config file lost
// the ambiguity had all of its settings silently ignored, or Vercel's build
// failed outright and kept serving the last deployment that succeeded.
//
// Everything that used to live in this file — images.remotePatterns, the
// WordPress redirects, and the agency-iframe CSP allowance — has already
// been merged into next.config.ts. Nothing is lost by deleting this file.
//
// This file intentionally throws instead of exporting a config, so that if
// Next.js DOES still load this one instead of next.config.ts, the build
// fails loudly with this message instead of silently serving a broken/
// incomplete config.
throw new Error(
  "next.config.mjs is a stale duplicate of next.config.ts and must be deleted (not just emptied) — " +
    "having both files is what caused production/localhost to drift. Run: rm next.config.mjs"
);
