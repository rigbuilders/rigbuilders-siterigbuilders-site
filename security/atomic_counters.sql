-- =====================================================================
-- Atomic counter increment for order IDs and invoice numbers
-- =====================================================================
--
-- WHY: lib/id-generator.ts previously did read-then-write (SELECT current_value,
-- then UPDATE). Two orders placed at the same instant could read the same value
-- and generate DUPLICATE order IDs / GST invoice numbers — a compliance problem.
--
-- This function increments and returns the next value in a single atomic
-- statement (INSERT ... ON CONFLICT DO UPDATE ... RETURNING), so concurrent
-- callers can never receive the same number.
--
-- Run this once in the Supabase SQL editor. It is called by lib/id-generator.ts
-- via the service-role client (bypasses RLS).
-- =====================================================================

create or replace function public.increment_counter(counter_name text)
returns integer
language plpgsql
as $$
declare
  new_val integer;
begin
  insert into public.counters (name, current_value)
  values (counter_name, 1)
  on conflict (name)
  do update set current_value = public.counters.current_value + 1
  returning current_value into new_val;

  return new_val;
end;
$$;
