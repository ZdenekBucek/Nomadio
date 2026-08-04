create function public.list_trip_members(target_trip_id uuid)
returns table (
  user_id uuid,
  role public.trip_member_role,
  created_at timestamptz,
  email text,
  display_name text,
  avatar_url text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if (select public.trip_role(target_trip_id)) is null then
    raise exception 'Trip membership required' using errcode = '42501';
  end if;

  return query
  select
    member.user_id,
    member.role,
    member.created_at,
    profile.email,
    profile.display_name,
    profile.avatar_url
  from public.trip_members as member
  join public.profiles as profile on profile.id = member.user_id
  where member.trip_id = target_trip_id
  order by
    case member.role
      when 'owner' then 0
      when 'editor' then 1
      else 2
    end,
    member.created_at,
    member.user_id;
end;
$$;

comment on function public.list_trip_members(uuid) is
  'Lists registered members and their display profiles for a trip visible to the current member.';

revoke execute on function public.list_trip_members(uuid) from public;
revoke execute on function public.list_trip_members(uuid) from anon;
grant execute on function public.list_trip_members(uuid) to authenticated;

create function public.update_trip_member_role(
  target_trip_id uuid,
  target_user_id uuid,
  target_role public.trip_member_role
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing_role public.trip_member_role;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if (select public.trip_role(target_trip_id)) is distinct from 'owner' then
    raise exception 'Only the trip owner can manage access' using errcode = '42501';
  end if;

  if target_role not in ('editor', 'viewer') then
    raise exception 'Only editor or viewer access can be assigned' using errcode = '22023';
  end if;

  select member.role
  into existing_role
  from public.trip_members as member
  where member.trip_id = target_trip_id
    and member.user_id = target_user_id;

  if existing_role is null then
    return 'member_not_found';
  end if;

  if existing_role = 'owner' then
    raise exception 'Owner membership cannot be changed' using errcode = '42501';
  end if;

  if existing_role = target_role then
    return 'no_change';
  end if;

  update public.trip_members as member
  set role = target_role
  where member.trip_id = target_trip_id
    and member.user_id = target_user_id;

  return 'updated';
end;
$$;

comment on function public.update_trip_member_role(uuid, uuid, public.trip_member_role) is
  'Changes an editor or viewer role. Only the trip owner may call it; owner membership is immutable.';

revoke execute on function public.update_trip_member_role(
  uuid, uuid, public.trip_member_role
) from public;
revoke execute on function public.update_trip_member_role(
  uuid, uuid, public.trip_member_role
) from anon;
grant execute on function public.update_trip_member_role(
  uuid, uuid, public.trip_member_role
) to authenticated;

create function public.remove_trip_member(
  target_trip_id uuid,
  target_user_id uuid
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing_role public.trip_member_role;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if (select public.trip_role(target_trip_id)) is distinct from 'owner' then
    raise exception 'Only the trip owner can manage access' using errcode = '42501';
  end if;

  select member.role
  into existing_role
  from public.trip_members as member
  where member.trip_id = target_trip_id
    and member.user_id = target_user_id;

  if existing_role is null then
    return 'member_not_found';
  end if;

  if existing_role = 'owner' then
    raise exception 'Owner membership cannot be removed' using errcode = '42501';
  end if;

  delete from public.trip_members as member
  where member.trip_id = target_trip_id
    and member.user_id = target_user_id;

  return 'removed';
end;
$$;

comment on function public.remove_trip_member(uuid, uuid) is
  'Removes an editor or viewer from a trip. Only the trip owner may call it; owner membership is immutable.';

revoke execute on function public.remove_trip_member(uuid, uuid) from public;
revoke execute on function public.remove_trip_member(uuid, uuid) from anon;
grant execute on function public.remove_trip_member(uuid, uuid) to authenticated;
