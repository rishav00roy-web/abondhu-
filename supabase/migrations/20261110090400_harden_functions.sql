-- Fixes from the Supabase security advisor (found on the real project).
-- Supabase grants EXECUTE to anon/authenticated directly, so "revoke from public" is not enough.

-- Trigger functions are never called through the API.
revoke execute on function
  public.audit_row(), public.handle_new_user(), public.log_pickup_status(),
  public.pickups_guard(), public.vendor_set_role(), public.vendors_guard(),
  public.set_updated_at(), public.vendor_on_submit()
from public, anon, authenticated;

-- Only signed-in vendors may try to accept a pickup.
revoke execute on function public.accept_pickup(uuid) from anon;

-- Pin search_path on the two remaining functions.
alter function public.set_updated_at()   set search_path = public;
alter function public.vendor_on_submit() set search_path = public;
