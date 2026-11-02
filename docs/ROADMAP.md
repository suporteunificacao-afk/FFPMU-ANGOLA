# Plano de desenvolvimento

## Fase 1 — Fundação
- [x] Repositório e estrutura inicial Next.js/TypeScript
- [x] Identidade visual base e navegação pública
- [x] Ecrã inicial de autenticação preparado para Supabase
- [ ] Criar projeto Supabase e configurar variáveis
- [ ] Migrações PostgreSQL, RLS e modelo de igreja/congregação
- [ ] Perfis, funções e permissões validados no servidor e na base de dados
- [ ] Testes de autenticação e autorização

## Fase 2 — Pessoas e organização
Membros, famílias, visitantes, departamentos e ministérios.

## Fase 3 — Cultos e louvor
Cultos, equipas, músicos, disponibilidade, escalas, confirmações e repertório.

## Fase 4 — Operação e comunicação
Presenças, eventos, avisos, notificações e relatórios.

## Fase 5 — Áreas sensíveis
Acompanhamento pastoral e gestão financeira com políticas de acesso específicas.

## Fase 6 — Portal e lançamento
Portal público completo, testes de segurança, otimização, publicação, backups e recuperação.

**Regra de conclusão:** cada funcionalidade só é considerada concluída quando as operações principais persistem na base de dados, respeitam as permissões e passam testes. Integrações externas não configuradas devem ser identificadas como pendentes.
