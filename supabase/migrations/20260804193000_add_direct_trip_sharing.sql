create index profiles_normalized_email_idx
  on public.profiles (lower(trim(email)))
  where email is not null;

drop policy "Owners can add trip memberships" on public.trip_members;
drop policy "Owners can update trip memberships" on public.trip_members;
drop policy "Owners can remove trip memberships" on public.trip_members;

create policy "Owners can add non-owner trip memberships"
on public.trip_members
for insert
to authenticated
with check (
  (select public.trip_role(trip_id)) = 'owner'
  and role in ('editor', 'viewer')
  and user_id <> (
    select trip.created_by
    from public.trips as trip
    where trip.id = public.trip_members.trip_id
  )
);

create policy "Owners can update non-owner trip memberships"
on public.trip_members
for update
to authenticated
using (
  (select public.trip_role(trip_id)) = 'owner'
  and role <> 'owner'
)
with check (
  (select public.trip_role(trip_id)) = 'owner'
  and role in ('editor', 'viewer')
);

create policy "Owners can remove non-owner trip memberships"
on public.trip_members
for delete
to authenticated
using (
  (select public.trip_role(trip_id)) = 'owner'
  and role <> 'owner'
);

create function public.protect_trip_member_system_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.role = 'owner' or new.role = 'owner' then
    raise exception 'Owner membership cannot be changed' using errcode = '42501';
  end if;

  if new.trip_id is distinct from old.trip_id
    or new.user_id is distinct from old.user_id
    or new.created_at is distinct from old.created_at then
    raise exception 'Membership system fields cannot be changed' using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger protect_trip_member_system_fields
before update on public.trip_members
for each row
execute function public.protect_trip_member_system_fields();

revoke execute on function public.protect_trip_member_system_fields() from public;
revoke execute on function public.protect_trip_member_system_fields() from anon;
revoke execute on function public.protect_trip_member_system_fields() from authenticated;

create function public.add_trip_member_by_email(
  target_trip_id uuid,
  target_email text,
  target_role public.trip_member_role
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  normalized_email text := lower(trim(target_email));
  target_user_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if (select public.trip_role(target_trip_id)) is distinct from 'owner' then
    raise exception 'Only the trip owner can manage access' using errcode = '42501';
  end if;

  if target_role not in ('editor', 'viewer') then
    raise exception 'Only editor or viewer access can be granted' using errcode = '22023';
  end if;

  if normalized_email is null or normalized_email = '' or char_length(normalized_email) > 320 then
    raise exception 'A valid email is required' using errcode = '22023';
  end if;

  select profile.id
  into target_user_id
  from public.profiles as profile
  where lower(trim(profile.email)) = normalized_email
  order by profile.id
  limit 1;

  if target_user_id is null then
    return 'user_not_found';
  end if;

  if exists (
    select 1
    from public.trip_members as member
    where member.trip_id = target_trip_id
      and member.user_id = target_user_id
  ) then
    return 'already_member';
  end if;

  insert into public.trip_members (trip_id, user_id, role)
  values (target_trip_id, target_user_id, target_role);

  return 'added';
exception
  when unique_violation then
    return 'already_member';
end;
$$;

comment on function public.add_trip_member_by_email(uuid, text, public.trip_member_role) is
  'Adds an existing Nomadio account to a trip by exact normalized email. Does not create or send invitations.';

revoke execute on function public.add_trip_member_by_email(
  uuid, text, public.trip_member_role
) from public;
revoke execute on function public.add_trip_member_by_email(
  uuid, text, public.trip_member_role
) from anon;
grant execute on function public.add_trip_member_by_email(
  uuid, text, public.trip_member_role
) to authenticated;
