-- Separa leitura e gestão de registos familiares sensíveis.
insert into public.permissions (permission_key, description)
values ('families.sensitive.manage', 'Criar e eliminar registos familiares sensíveis')
on conflict (permission_key) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.name in ('Administrador Nacional', 'Administrador principal')
  and p.permission_key = 'families.sensitive.manage'
on conflict (role_id, permission_id) do nothing;

drop policy if exists "sensitive family records create authorized" on public.family_sensitive_records;
drop policy if exists "sensitive family records delete authorized" on public.family_sensitive_records;

create policy "sensitive family records create managed"
on public.family_sensitive_records for insert to authenticated
with check (
  exists (
    select 1 from public.families f
    where f.id = family_sensitive_records.family_id
      and f.church_id = family_sensitive_records.church_id
      and private.has_permission_for_scope(
        f.church_id, 'families.sensitive.manage',
        f.region_id, f.community_id, f.branch_id
      )
  )
);

create policy "sensitive family records delete managed"
on public.family_sensitive_records for delete to authenticated
using (
  exists (
    select 1 from public.families f
    where f.id = family_sensitive_records.family_id
      and f.church_id = family_sensitive_records.church_id
      and private.has_permission_for_scope(
        f.church_id, 'families.sensitive.manage',
        f.region_id, f.community_id, f.branch_id
      )
  )
);

-- Ao apagar um membro, limpa apenas a referência opcional, preservando church_id.
alter table public.family_history_records
  drop constraint if exists family_history_member_same_church;
alter table public.family_history_records
  add constraint family_history_member_same_church
  foreign key (related_member_id, church_id)
  references public.members(id, church_id)
  on delete set null (related_member_id);
