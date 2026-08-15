# Rancho Flexível — GitHub Pages + Supabase

Versão reorganizada e funcional baseada no design do Stitch.

## O que esta versão inclui

- Site público responsivo
- Catálogo e categorias
- Pesquisa e ordenação
- Rancho do mês
- Carrinho em localStorage
- Checkout
- Cálculo de entrega
- Geração de número de pedido
- Envio por WhatsApp
- Painel administrativo protegido por Supabase Auth
- CRUD de produtos
- Adição de novos produtos
- Edição do nome do produto
- Edição de preços
- Edição de stock/SKU/unidade/tag
- Upload/substituição de imagem de produto
- Gestão de pedidos
- Configurações
- Português como idioma padrão
- Inglês
- Mandarim (中文)
- Francês
- Changana
- Campos multilíngues para nome, descrição e tags dos produtos
- RLS no Supabase
- Supabase Storage para imagens
- Compatibilidade com GitHub Pages

## Idiomas

O seletor no cabeçalho permite:

1. Português (padrão)
2. English
3. 中文 — Mandarim
4. Français
5. Changana

O idioma escolhido fica guardado no navegador. No painel, o administrador também pode definir o idioma padrão do site.

## Configuração do Supabase

1. Crie um projeto no Supabase.
2. Abra o SQL Editor.
3. Execute `supabase_schema.sql`.
4. Crie um bucket Storage chamado `site-images`.
5. Crie o utilizador administrador em Authentication > Users.
6. Insira o ID desse utilizador na tabela `profiles` e defina `role = admin`.

Exemplo:

```sql
insert into profiles(id,email,full_name,role)
values ('UUID_DO_UTILIZADOR','admin@ranchoflexivel.co.mz','Administrador','admin');
```

## Configurar o frontend

Por segurança, o frontend não contém a service_role key.

A forma mais simples para esta versão estática é definir no navegador, uma vez, a URL e a chave pública:

```js
localStorage.setItem("RF_SUPABASE_URL","https://SEU-PROJETO.supabase.co");
localStorage.setItem("RF_SUPABASE_ANON_KEY","SUA_CHAVE_PUBLICA");
```

Depois recarregue o site.

Para produção, recomendamos substituir isso por um arquivo de configuração público contendo apenas a anon/publishable key.

## Imagens

No painel:

Produtos > Adicionar produto / Editar

É possível carregar:

- JPG
- JPEG
- PNG
- WEBP

A imagem é enviada para `site-images/products/...`.

## Segurança

Nunca coloque no frontend:

- service_role key;
- senha do administrador;
- senha do banco;
- tokens privados.

O login administrativo usa Supabase Auth.

A autorização administrativa usa RLS + `is_admin()`.

## GitHub Pages

Suba o conteúdo desta pasta para a branch `main`.

Em:

Settings > Pages

selecione:

- Source: Deploy from a branch
- Branch: main
- Folder: / (root)

O ficheiro `index.html` será a página principal.

## Domínio

Depois de o GitHub Pages estar funcionando, em:

Settings > Pages > Custom domain

adicione:

`www.ranchoflexivel.co.mz`

Depois configure no provedor do domínio os registros DNS indicados pelo GitHub.

## Observação

Sem Supabase configurado, o site público utiliza dados de demonstração locais para que a interface possa ser testada.

O painel administrativo NÃO oferece modo demo de escrita: sem autenticação Supabase ele permanece bloqueado.

## Estrutura

```text
index.html
checkout.html
admin.html

app.js
checkout.js
admin.js
data.js

supabase_schema.sql
README.md

assets/
docs/
```
