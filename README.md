# FFPMU Angola — Sistema Integrado de Gestão da Igreja

Plataforma em desenvolvimento conforme o Prompt Mestre fornecido pelo utilizador.

## Stack
- Next.js App Router, React e TypeScript
- Tailwind CSS
- Supabase Auth e PostgreSQL
- Row Level Security (RLS)
- Português (Angola), fuso horário `Africa/Luanda`, moeda AOA

## Os 18 módulos
Dashboard; Membros; Visitantes; Famílias; Departamentos; Ministérios; Cultos e serviços; Ministério de Louvor; Escalas; Repertório musical; Eventos e calendário; Presenças; Acompanhamento pastoral; Comunicação e avisos; Gestão financeira; Relatórios; Utilizadores e permissões; Configurações.

## Estado real
- O repositório contém a fundação Next.js, autenticação, portal público e área administrativa.
- O projeto Supabase `FFPMU-ANGOLA` está ativo na região eu-west-1 (Irlanda).
- As duas migrações iniciais foram aplicadas: oito tabelas centrais com RLS e dez permissões de base.
- O assistente de primeiro acesso provisiona a igreja, a congregação principal e o primeiro administrador.
- O módulo Membros tem agora um primeiro fluxo de criação e listagem ligado ao Supabase e protegido pelas políticas RLS. Ainda precisa de testes de ponta a ponta antes de ser considerado concluído.
- Não existem ainda registos institucionais nem conta de primeiro administrador. Não são usados dados fictícios como se fossem reais.

## Executar localmente
Requisitos: Node.js 20.9+ e npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Preencha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` com os valores do projeto. Nunca exponha chaves secretas ou `service_role` no cliente.

Consulte `docs/ROADMAP.md` e `docs/SETUP.md`.
