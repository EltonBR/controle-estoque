# Contexto do Projeto

## Nome

`controle-estoque`

## Objetivo

Aplicacao web para controle de estoque da dispensa, feita com:

- HTML
- CSS
- JavaScript puro
- Web Components
- IndexedDB

Sem uso de bibliotecas externas no frontend.

## Estrutura geral

O projeto e um app estatico, carregado por `index.html`, com modulo principal em:

- `js/app.js`
- `js/components/inventory-app.js`

Persistencia local:

- `js/db.js`

## Como foi desenvolvido

O app foi evoluindo incrementalmente a partir de uma interface simples com formulario e listagem. Ao longo das iteracoes, a estrutura foi refinada para:

- separar a listagem em cards
- usar componentes dedicados para partes importantes
- melhorar responsividade para 16:9 e ultrawide
- priorizar uso com leitor de codigo de barras
- adicionar fluxo de backup e restauracao do banco
- transformar feedbacks em toasts auto-dismissible

Depois, houve uma refatoracao para componentizar melhor:

- `product-card`
- `product-modal`
- `toast-message`

## Componentes atuais

### `inventory-app`

Arquivo:

- `js/components/inventory-app.js`

Responsavel por:

- orquestrar estado da aplicacao
- carregar produtos do IndexedDB
- aplicar busca
- abrir e fechar modais
- salvar, excluir e ajustar estoque
- exportar backup
- restaurar backup
- disparar toasts de feedback

### `product-form`

Arquivo:

- `js/components/product-form.js`

Responsavel por:

- cadastro e edicao de produto
- leitura de imagem via `input file`
- validacao de nome, quantidade e peso
- emissao do evento `save-product`

### `product-modal`

Arquivo:

- `js/components/product-modal.js`

Responsavel por:

- encapsular o modal de cadastro/edicao
- abrir com produto existente ou vazio
- fechar por botao ou backdrop

### `product-search`

Arquivo:

- `js/components/product-search.js`

Responsavel por:

- campo de busca principal
- foco rapido para leitura por codigo de barras
- emissao do evento `search-change`

### `product-table`

Arquivo:

- `js/components/product-table.js`

Responsavel por:

- renderizar a grade de produtos
- mostrar estado vazio
- instanciar um `product-card` para cada item

### `product-card`

Arquivo:

- `js/components/product-card.js`

Responsavel por:

- renderizar visualmente cada produto
- exibir imagem, nome, peso, codigo de barras, observacoes e quantidade
- expor acoes de:
  - aumentar estoque
  - diminuir estoque
  - editar
  - excluir

### `toast-message`

Arquivo:

- `js/components/toast-message.js`

Responsavel por:

- exibir mensagens flutuantes no canto superior direito
- auto-dismiss em mensagens de sucesso
- barra de progresso visual

## Persistencia

Arquivo:

- `js/db.js`

Banco:

- `controle-estoque-db`

Store:

- `produtos`

Campos relevantes atualmente usados pelos produtos:

- `id`
- `name`
- `barcode`
- `image`
- `quantity`
- `weight`
- `weightUnit`
- `notes`
- `createdAt`
- `updatedAt`

## Funcionalidades implementadas

### Cadastro de produto

- nome
- codigo de barras
- imagem opcional
- quantidade em unidades
- peso
- unidade de peso (`g` ou `kg`)
- observacoes

### Edicao

- edita produto existente no mesmo formulario do cadastro
- formulario aberto em modal

### Exclusao

- remocao com confirmacao via `window.confirm`

### Busca

- por nome
- por codigo de barras
- por observacoes

### Estoque rapido

- botoes `+` e `-` em cada card
- ajuste imediato persistido no IndexedDB

### Imagem do produto

- upload opcional por arquivo
- imagem salva como `data URL`
- placeholder local quando nao ha imagem

### Backup

- gera arquivo `.json` com todos os produtos

### Restauracao

- leitura de arquivo `.json`
- substitui os produtos atuais do IndexedDB

### Toasts

- feedback visual de sucesso e erro
- sucesso com auto-dismiss
- barra fina de progresso no rodape

## Layout atual

### Header fixo

Possui:

- titulo do sistema
- busca central
- botoes de acao com icones SVG:
  - cadastrar produto
  - backup
  - restaurar

### Listagem

- cards em grid responsivo
- sem container visual branco externo
- foco em uso rapido

### Card do produto

Ordem visual atual:

- imagem
- selo de quantidade no canto superior direito da imagem
- nome
- peso em destaque leve
- codigo de barras
- observacao em caixinha
- acoes na ultima linha

## Regras atuais de comportamento

### Foco

- se houver produtos, foco vai para a busca
- se nao houver produtos, abre o modal de cadastro e foca o campo de codigo de barras

### Ordenacao

- ordenacao padrao por `createdAt`
- alterar estoque nao muda mais a posicao do card

## Assets

Diretorio:

- `assets/icons/`

SVGs usados:

- editar
- excluir
- adicionar
- backup
- restaurar

Placeholder:

- `assets/placeholder-product.svg`

## Estado atual

O projeto esta funcional para uso local no navegador, com:

- CRUD de produtos
- busca
- backup/restauracao
- upload de imagem
- listagem em cards
- modal de cadastro/edicao
- toast de feedback

## Pontos de atencao

### Restauracao do banco

A restauracao hoje espera um JSON com:

- array direto de produtos

ou:

- objeto com `products`

### Imagens no IndexedDB

Como a imagem e salva em `data URL`, backups podem crescer bastante se houver muitas imagens grandes.

### Confirmacao de exclusao

Ainda usa `window.confirm`, sem modal customizado.

## Melhorias futuras possiveis

- comprimir ou redimensionar imagens antes de salvar
- filtro por estoque baixo
- indicador visual de estoque zerado
- confirmacao de exclusao customizada
- importacao com merge em vez de substituir tudo
- ordenacao configuravel
- agrupamento por categoria
- suporte a leitor de codigo de barras com cadastro automatico por Enter

## Arquivos principais

- `index.html`
- `styles.css`
- `js/app.js`
- `js/db.js`
- `js/components/inventory-app.js`
- `js/components/product-form.js`
- `js/components/product-modal.js`
- `js/components/product-search.js`
- `js/components/product-table.js`
- `js/components/product-card.js`
- `js/components/toast-message.js`

## Execucao local

O projeto pode ser servido localmente com os scripts:

- `start-busybox-httpd.sh`
- `stop-busybox-httpd.sh`

Porta padrao:

- `4000`
