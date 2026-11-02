# Configuração do ambiente

## Projeto Supabase criado
- Nome: `FFPMU-ANGOLA`
- Project ref: `vitdoasdsvkvbitvhuit`
- Região: `eu-west-1` (Irlanda)
- URL: `https://vitdoasdsvkvbitvhuit.supabase.co`
- Custo consultado no momento da criação: US$ 0/mês. Condições futuras podem mudar.

## Desenvolvimento local
1. Clonar o repositório.
2. Instalar Node.js 20.9+ e executar `npm install`.
3. Copiar `.env.example` para `.env.local`.
4. Preencher `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` com os dados do projeto.
5. Executar `npm run dev`.

## Segurança
- Nunca colocar `service_role` ou secret key em variáveis `NEXT_PUBLIC_*`.
- Todas as tabelas expostas devem ter RLS ativa e políticas adequadas ao modelo de permissões.
- O primeiro administrador será provisionado por fluxo de configuração inicial, protegido por RPC que só funciona enquanto ainda não existir igreja.
- Configurar SMTP e URLs de redirecionamento no Supabase antes de ativar convites e recuperação de palavra-passe.

## Estado atual
O projeto Supabase está criado e as migrações iniciais foram aplicadas. O modelo atual contém igrejas, filiais, perfis, funções, permissões, atribuições e membros. Ainda não foi criada a conta do primeiro administrador nem os dados institucionais da igreja.
