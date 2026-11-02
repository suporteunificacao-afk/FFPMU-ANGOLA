# FFPMU Angola — Sistema Integrado de Gestão da Igreja

Plataforma de gestão e administração eclesiástica, desenvolvida conforme o Prompt Mestre fornecido pelo utilizador.

## Stack definida

- Next.js App Router + React + TypeScript
- Tailwind CSS
- Supabase Auth, PostgreSQL e Storage
- Row Level Security (RLS)
- Idioma: Português | Fuso horário inicial: `Africa/Luanda`

## Módulos previstos

1. Dashboard; 2. Membros; 3. Visitantes; 4. Famílias; 5. Departamentos; 6. Ministérios; 7. Cultos e serviços; 8. Ministério de Louvor; 9. Escalas; 10. Repertório musical; 11. Eventos e calendário; 12. Presenças; 13. Acompanhamento pastoral; 14. Comunicação e avisos; 15. Gestão financeira; 16. Relatórios; 17. Utilizadores e permissões; 18. Configurações.

## Estado do desenvolvimento

O repositório começa sem código. O desenvolvimento será executado em seis fases, conforme o Prompt Mestre. A estrutura inicial e a base de segurança são o primeiro passo; módulos só serão marcados como concluídos depois de terem operações persistentes e testes.

- [ ] Fase 1 — Estrutura, identidade visual, base de dados, autenticação e permissões
- [ ] Fase 2 — Membros, famílias, visitantes, departamentos e ministérios
- [ ] Fase 3 — Cultos, louvor, escalas e repertório
- [ ] Fase 4 — Presenças, eventos, comunicação e relatórios
- [ ] Fase 5 — Acompanhamento pastoral e gestão financeira
- [ ] Fase 6 — Portal público, segurança, otimização e publicação

## Configuração local

Requisitos: Node.js 20.9 ou superior e npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Preencha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` com os dados do projeto Supabase. Não coloque chaves secretas no frontend.

## Dependências externas pendentes

Neste momento não existe um projeto Supabase visível na conta conectada. Por isso, autenticação e persistência real só poderão ser validadas depois de criar/ligar o projeto e configurar as variáveis de ambiente. Não existem dados reais da igreja nem utilizadores pré-criados.

Consulte `docs/ROADMAP.md` e `docs/SETUP.md`.