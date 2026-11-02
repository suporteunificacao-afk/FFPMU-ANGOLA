-- Fase 1: provisionamento seguro do primeiro administrador.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(nullif(new.raw_user_meta_data ->> 'full_name',''), split_part(new.email,'@',1)))
  on conflict (id) do nothing;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

insert into public.permissions (permission_key, description) values
('church.read','Consultar dados institucionais'),
('branches.read','Consultar congregações'),
('profiles.read','Consultar perfis'),
('roles.read','Consultar funções'),
('roles.manage','Gerir funções e atribuições'),
('members.read','Consultar membros'),
('members.create','Criar membros'),
('members.update','Atualizar membros'),
('members.delete','Arquivar membros'),
('members.manage_sensitive','Consultar dados sensíveis')
on conflict (permission_key) do nothing;

create or replace function public.bootstrap_church(
 _church_name text, _church_slug text, _full_name text, _branch_name text default 'Sede'
) returns uuid language plpgsql security definer set search_path = ''
as $$
declare _uid uuid := auth.uid(); _church_id uuid; _branch_id uuid; _role_id uuid; _permission_id uuid;
begin
 if _uid is null then raise exception 'É necessário iniciar sessão.'; end if;
 if exists (select 1 from public.churches) then raise exception 'A configuração inicial já foi realizada.'; end if;
 if length(trim(coalesce(_church_name,''))) < 3 or length(trim(coalesce(_church_slug,''))) < 3 or length(trim(coalesce(_full_name,''))) < 3 then
   raise exception 'Informe o nome da igreja, identificador e nome do administrador.';
 end if;
 insert into public.churches(name,slug) values(trim(_church_name),lower(trim(_church_slug))) returning id into _church_id;
 insert into public.branches(church_id,name) values(_church_id,trim(coalesce(nullif(_branch_name,''),'Sede'))) returning id into _branch_id;
 update public.profiles set church_id=_church_id,branch_id=_branch_id,full_name=trim(_full_name),updated_at=now() where id=_uid;
 insert into public.roles(church_id,name,description,is_system) values(_church_id,'Administrador principal','Acesso administrativo integral à igreja',true) returning id into _role_id;
 for _permission_id in select id from public.permissions loop
   insert into public.role_permissions(role_id,permission_id) values(_role_id,_permission_id) on conflict do nothing;
 end loop;
 insert into public.role_assignments(user_id,role_id,church_id,branch_id,assigned_by) values(_uid,_role_id,_church_id,_branch_id,_uid);
 return _church_id;
end; $$;
revoke all on function public.bootstrap_church(text,text,text,text) from public;
grant execute on function public.bootstrap_church(text,text,text,text) to authenticated;
create policy "authorized users create role assignments" on public.role_assignments for insert to authenticated
with check (private.has_permission(church_id,'roles.manage'));
create policy "authorized users manage role assignments" on public.role_assignments for update to authenticated
using (private.has_permission(church_id,'roles.manage')) with check (private.has_permission(church_id,'roles.manage'));
