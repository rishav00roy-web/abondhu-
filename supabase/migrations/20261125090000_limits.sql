-- Limits found by the stress test (2026-11-24).
-- 1. Text fields had no length limit: a signed-in user could save a 1 MB pickup note
--    or a 200,000-letter name, which then shows on dealer screens and in dealer emails.
-- 2. One customer could create 1,000 pickups in a second. Each new pickup emails every
--    dealer in that pincode, so this could use up the day's Gmail limit and flood dealers.
-- The app already keeps inside these limits; this makes the database refuse the rest.

alter table public.profiles  add constraint profiles_full_name_len   check (char_length(full_name) <= 200);
alter table public.addresses add constraint addresses_line1_len      check (char_length(line1) <= 300);
alter table public.addresses add constraint addresses_landmark_len   check (char_length(landmark) <= 200);
alter table public.vendors   add constraint vendors_business_name_len check (char_length(business_name) <= 120);
alter table public.vendors   add constraint vendors_rejection_len    check (char_length(rejection_reason) <= 500);
alter table public.pickups   add constraint pickups_note_len         check (char_length(customer_note) <= 500);
alter table public.pickups   add constraint pickups_cancel_len       check (char_length(cancel_reason) <= 500);

-- A customer can have at most 3 pickups still open, and book at most 5 in a day.
-- Admins and the server (service role) are not limited.
create or replace function public.pickups_booking_limit() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;
  if (select count(*) from public.pickups
       where customer_id = new.customer_id
         and status in ('requested', 'assigned', 'accepted', 'on_the_way', 'weighed')) >= 3 then
    raise exception 'too many open pickups' using errcode = 'P0001', hint = 'open_limit';
  end if;
  if (select count(*) from public.pickups
       where customer_id = new.customer_id and requested_at > now() - interval '1 day') >= 5 then
    raise exception 'too many pickups today' using errcode = 'P0001', hint = 'daily_limit';
  end if;
  return new;
end $$;
revoke all on function public.pickups_booking_limit() from public;

create trigger pickups_booking_limit before insert on public.pickups
  for each row execute function public.pickups_booking_limit();
