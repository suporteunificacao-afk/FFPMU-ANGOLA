# Publicação do FFPMU Angola

## Arquitectura recomendada

- **GitHub:** repositório principal e histórico do código.
- **Vercel:** alojamento da aplicação Next.js e pré-visualizações de cada Pull Request.
- **Supabase:** autenticação e base de dados PostgreSQL com RLS.

Não é necessário criar uma segunda aplicação nem copiar o código para outro construtor.

## Preparar a publicação na Vercel

1. Entrar na Vercel com a conta que irá administrar o alojamento.
2. Escolher **Add New → Project** e importar `suporteunificacao-afk/FFPMU-ANGOLA` do GitHub.
3. Manter a raiz do projecto como `./` e o framework como **Next.js**.
4. Adicionar as variáveis de ambiente abaixo em Preview e Production:
   - `NEXT_PUBLIC_SUPABASE_URL=https://vitdoasdsvkvbitvhuit.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=` (copiar a chave publishable no painel Supabase; nunca usar a service_role).
5. Publicar a branch principal quando estiver pronta. Para já, pode importar a branch `feature/modulo-membros-inicial` como Preview.
6. Configurar o domínio atribuído pela Vercel no Supabase, em **Authentication → URL Configuration**:
   - Site URL: domínio de produção da Vercel.
   - Redirect URLs: domínio de produção e domínio de Preview, incluindo `/setup` e os caminhos de autenticação necessários.

## Primeiro acesso

1. Abrir `/primeiro-acesso` no domínio publicado e criar a primeira conta.
2. Se a confirmação de e-mail estiver activa, confirmar a mensagem recebida e entrar no sistema.
3. Abrir `/setup` e registar o nome oficial da igreja, identificador e congregação principal.
4. O procedimento de configuração cria a igreja, a congregação e a função de administrador principal. Só pode ser concluído uma vez.

**Importante:** a primeira conta registada antes da configuração institucional recebe o acesso inicial de administrador. Antes de abrir o endereço ao público, confirmar quem fará esse primeiro registo. Não partilhar a chave secreta ou `service_role`.

## Verificações antes de produção

- Aguardar que GitHub Actions passe lint, TypeScript e build.
- Testar registo, confirmação de e-mail, login e configuração inicial.
- Testar leitura, criação e actualização de membros com utilizadores com e sem as permissões correspondentes.
- Confirmar os URLs de autenticação e o SMTP do Supabase.
- Fazer backup e rever os avisos de segurança do Supabase antes de inserir dados reais.

## Pré-visualizações de desenvolvimento

Depois de ligar o repositório à Vercel, cada Pull Request pode gerar uma URL de Preview própria. Assim, a equipa acompanha as alterações sem substituir o domínio de produção.
