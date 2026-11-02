# Configuração do ambiente

## Requisitos
- Node.js 20.9+
- npm
- Conta Supabase

## Desenvolvimento local
1. Clonar o repositório.
2. Executar `npm install`.
3. Copiar `.env.example` para `.env.local`.
4. Criar um projeto Supabase e copiar Project URL e Publishable key.
5. Preencher `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
6. Executar `npm run dev`.

## Segurança
- Nunca colocar `service_role` ou secret key em variáveis `NEXT_PUBLIC_*`.
- Todas as tabelas expostas devem ter RLS ativa e políticas adequadas ao modelo de permissões.
- Não criar utilizadores administrativos por registo público.
- Configurar SMTP e URLs de redirecionamento no Supabase antes de ativar recuperação de palavra-passe e convites.

## Estado atual
O repositório não contém credenciais nem dados reais. A conta Supabase ligada ao ambiente ainda não apresenta projetos. A persistência, autenticação real e políticas RLS dependem da criação/ligação do projeto Supabase.
