# Plano de desenvolvimento

## Fase 1 — Fundação
- [x] Repositório e estrutura inicial Next.js/TypeScript
- [x] Identidade visual base e navegação pública
- [x] Ecrãs de autenticação e primeiro acesso preparados para Supabase
- [x] Criar projeto Supabase
- [x] Aplicar núcleo inicial PostgreSQL, RLS e modelo de igreja/congregação
- [x] Criar catálogo inicial de permissões e provisionamento do primeiro administrador
- [ ] Configurar variáveis de ambiente no ambiente de execução
- [ ] Executar testes de autenticação, bootstrap e autorização

## Fase 2 — Pessoas e organização
- [ ] Membros: primeiro fluxo de criação e listagem implementado; falta validar ponta a ponta e completar edição, arquivo, pesquisa e ficha individual
- [ ] Visitantes, famílias, departamentos e ministérios

## Fase 3 — Cultos e louvor
Cultos, equipas, músicos, disponibilidade, escalas, confirmações e repertório.

## Fase 4 — Operação e comunicação
Presenças, eventos, avisos, notificações e relatórios.

## Fase 5 — Áreas sensíveis
Acompanhamento pastoral e gestão financeira com políticas de acesso específicas.

## Fase 6 — Portal e lançamento
Portal público completo, testes de segurança, otimização, publicação, backups e recuperação.

**Regra de conclusão:** cada funcionalidade só é considerada concluída quando as operações principais persistem na base de dados, respeitam as permissões e passam testes. Integrações externas não configuradas devem ser identificadas como pendentes.
