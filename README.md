# FFPMU Angola — Sistema Integrado de Gestão da Igreja

Plataforma em desenvolvimento conforme o Prompt Mestre fornecido pelo utilizador.

## Stack
- Next.js App Router, React e TypeScript
- Tailwind CSS
- Supabase Auth, PostgreSQL e Storage
- Row Level Security (RLS)
- Português (Angola), fuso horário inicial `Africa/Luanda`

## Os 18 módulos
Dashboard; Membros; Visitantes; Famílias; Departamentos; Ministérios; Cultos e serviços; Ministério de Louvor; Escalas; Repertório musical; Eventos e calendário; Presenças; Acompanhamento pastoral; Comunicação e avisos; Gestão financeira; Relatórios; Utilizadores e permissões; Configurações.

## Estado real
A fundação inicial do frontend foi criada no repositório. O projeto Supabase ainda não existe na conta conectada; por isso, ainda não há base de dados, contas administrativas, dados persistentes ou operações dos módulos. Os ecrãs de gestão identificam explicitamente as áreas ainda em implementação.

## Executar localmente
Requisitos: Node.js 20.9+ e npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Preencha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Nunca exponha chaves secretas no cliente.

Consulte `docs/ROADMAP.md` e `docs/SETUP.md`.