-- Admin access is granted by app_metadata.role = 'admin' (settable only server-side),
-- not by merely having a signed-in session. Mirrors getAdminSession() in src/lib/auth/session.ts.

create or replace function public.is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
$$;
revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

drop policy if exists "Requests are viewable by authenticated users" on public.requests;
drop policy if exists "Requests can be updated by authenticated users" on public.requests;
drop policy if exists "Requests can be deleted by authenticated users" on public.requests;
create policy "Admins can view requests" on public.requests for select to authenticated using ((select public.is_admin()));
create policy "Admins can update requests" on public.requests for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins can delete requests" on public.requests for delete to authenticated using ((select public.is_admin()));

drop policy if exists "Providers are viewable by authenticated users" on public.providers;
drop policy if exists "Providers can be created by authenticated users" on public.providers;
drop policy if exists "Providers can be updated by authenticated users" on public.providers;
drop policy if exists "Providers can be deleted by authenticated users" on public.providers;
create policy "Admins can view providers" on public.providers for select to authenticated using ((select public.is_admin()));
create policy "Admins can create providers" on public.providers for insert to authenticated with check ((select public.is_admin()));
create policy "Admins can update providers" on public.providers for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins can delete providers" on public.providers for delete to authenticated using ((select public.is_admin()));

-- rls_auto_enable is an event-trigger function; nobody should call it over the API.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
