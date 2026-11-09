
alter table public.role_assignments
  add constraint role_assignments_one_scope check (num_nonnulls(region_id, community_id, branch_id) <= 1);

insert into public.roles(church_id,name,description,is_system)
select c.id, v.name, v.description, false
from public.churches c
cross join (values
 ('Administrador Nacional','Acesso de administração nacional à estrutura institucional'),
 ('Responsável Regional','Gestão de famílias e membros dentro da região atribuída'),
 ('Responsável Local','Gestão de famílias e membros dentro da comunidade ou congregação atribuída')
) as v(name,description)
on conflict (church_id,name) do nothing;

-- O administrador nacional recebe o catálogo completo de permissões.
insert into public.role_permissions(role_id,permission_id)
select r.id,p.id
from public.roles r
join public.permissions p on true
where r.name='Administrador Nacional'
on conflict do nothing;

-- Responsáveis regionais e locais recebem apenas operações de consulta e gestão corrente.
insert into public.role_permissions(role_id,permission_id)
select r.id,p.id
from public.roles r
join public.permissions p on p.permission_key in (
 'branches.read','organization.read',
 'members.read','members.create','members.update',
 'families.read','families.create','families.update'
)
where r.name in ('Responsável Regional','Responsável Local')
on conflict do nothing;
