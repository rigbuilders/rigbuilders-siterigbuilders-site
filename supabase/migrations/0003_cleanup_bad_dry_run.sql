-- One-off cleanup, not a schema change — run once in the Supabase SQL editor.
--
-- The first version of the dry-run worker wrote listing_created = false to
-- every published product in the catalog (a bug in the worker script, now
-- fixed — see scripts/local-listing-worker.ts). This undoes that: resets
-- listing_created back to NULL ("never evaluated") for anything that's
-- actually published, since published products predating this pipeline
-- were never supposed to be in scope for it at all.
--
-- Nothing else was touched by that run — no names, specs, prices, or
-- listing_status changed. This only restores the one flag.

update products
set listing_created = null
where listing_status = 'published'
  and listing_created = false;
