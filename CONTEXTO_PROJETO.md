# Contexto do Projeto

## Nome

`controle-estoque`

## Objetivo

Aplicacao web estatica para controle de estoque domestico, orientada a operacao rapida no navegador, com persistencia local e sem dependencia de bibliotecas externas.

Stack atual:

- HTML estatico
- CSS puro
- JavaScript puro com ES Modules
- Web Components
- IndexedDB

## Estado atual do projeto

O projeto esta funcionalmente organizado em componentes isolados, cada um com:

- um diretorio proprio em `js/components/<nome-do-componente>/`
- um arquivo JavaScript do componente
- um arquivo CSS do componente

O app atual suporta:

- cadastro e edicao de produtos em modal
- upload de imagem por arquivo
- captura de imagem por webcam
- busca por nome, codigo de barras e observacoes
- ajuste rapido de estoque direto no card
- exclusao com confirmacao
- backup em JSON
- restauracao completa do banco por arquivo JSON
- tema claro/escuro com persistencia em `localStorage`

## Arquitetura

### Visao geral

O sistema segue uma arquitetura de frontend local baseada em:

1. `index.html` como ponto de entrada da pagina e agregador de CSS
2. `js/app.js` como bootstrap minimo da aplicacao
3. `inventory-app` como componente raiz e orquestrador de estado
4. componentes filhos especializados para UI e interacoes
5. `js/db.js` como camada de persistencia IndexedDB

Nao existe backend. Toda a persistencia e local no navegador.

### Camadas

#### 1. Entrada da aplicacao

Arquivos:

- `index.html`
- `js/app.js`

Responsabilidades:

- carregar `styles.css` com tokens e estilos globais
- carregar os CSS de cada componente
- inicializar o componente raiz `inventory-app`

#### 2. Camada de orquestracao

Arquivo:

- `js/components/inventory-app/inventory-app.js`

Responsavel por:

- manter estado em memoria da lista de produtos
- carregar produtos do IndexedDB
- aplicar busca
- reagir a eventos disparados pelos componentes filhos
- salvar, editar, excluir e ajustar estoque
- controlar modal de produto
- controlar modal de restauracao
- gerar backup
- aplicar tema claro/escuro
- disparar toasts

O `inventory-app` nao renderiza cada detalhe visual do sistema. Ele coordena componentes especializados.

#### 3. Camada de componentes visuais

Cada parte principal da interface esta encapsulada em um Web Component.

#### 4. Camada de persistencia

Arquivo:

- `js/db.js`

Responsavel por:

- abrir o banco IndexedDB
- listar produtos
- salvar produto
- excluir produto
- substituir toda a base em restauracao

## Estrutura atual de diretorios

### Raiz

- `index.html`
- `styles.css`
- `CONTEXTO_PROJETO.md`
- `js/app.js`
- `js/db.js`
- `assets/`

### Assets

- `assets/icons/add.svg`
- `assets/icons/backup.svg`
- `assets/icons/delete.svg`
- `assets/icons/edit.svg`
- `assets/icons/restore.svg`
- `assets/icons/theme.svg`
- `assets/placeholder-product.svg`

### Componentes

- `js/components/inventory-app/`
- `js/components/inventory-header/`
- `js/components/product-camera-modal/`
- `js/components/product-card/`
- `js/components/product-form/`
- `js/components/product-modal/`
- `js/components/product-search/`
- `js/components/product-table/`
- `js/components/toast-message/`

## Componentes e responsabilidades

### `inventory-app`

Arquivos:

- `js/components/inventory-app/inventory-app.js`
- `js/components/inventory-app/inventory-app.css`

Responsabilidades:

- componente raiz do sistema
- composicao do header, tabela/listagem, modal de produto e toast
- sincronizacao entre UI e IndexedDB
- filtro da listagem com base na busca
- tratamento de eventos como:
  - `header-action`
  - `search-change`
  - `save-product`
  - `product-edit`
  - `product-delete`
  - `product-increase`
  - `product-decrease`
  - `product-modal-close`
- backup e restauracao
- aplicacao do tema salvo

### `inventory-header`

Arquivos:

- `js/components/inventory-header/inventory-header.js`
- `js/components/inventory-header/inventory-header.css`

Responsabilidades:

- renderizar header fixo
- encapsular:
  - titulo
  - busca principal
  - botoes de acao
- emitir evento `header-action` com as acoes:
  - `open-create`
  - `backup-db`
  - `open-restore`
  - `toggle-theme`

### `product-search`

Arquivos:

- `js/components/product-search/product-search.js`
- `js/components/product-search/product-search.css`

Responsabilidades:

- campo de busca principal
- botao de limpar
- foco rapido para operacao com leitor de codigo de barras
- emissao do evento `search-change`

### `product-table`

Arquivos:

- `js/components/product-table/product-table.js`
- `js/components/product-table/product-table.css`

Responsabilidades:

- renderizar a grade responsiva de produtos
- exibir contador
- exibir estado vazio
- instanciar um `product-card` por item

### `product-card`

Arquivos:

- `js/components/product-card/product-card.js`
- `js/components/product-card/product-card.css`

Responsabilidades:

- renderizacao visual de cada produto
- uso de placeholder quando nao ha imagem
- exibir:
  - imagem
  - quantidade
  - nome
  - peso
  - codigo de barras
  - observacoes
- emitir eventos de acao:
  - `product-edit`
  - `product-delete`
  - `product-increase`
  - `product-decrease`

### `product-modal`

Arquivos:

- `js/components/product-modal/product-modal.js`
- `js/components/product-modal/product-modal.css`

Responsabilidades:

- encapsular o modal de cadastro/edicao
- abrir com produto vazio ou existente
- delegar o formulario para `product-form`
- emitir `product-modal-close`

### `product-form`

Arquivos:

- `js/components/product-form/product-form.js`
- `js/components/product-form/product-form.css`

Responsabilidades:

- formulario de cadastro e edicao
- validacao de:
  - nome
  - quantidade
  - peso
- leitura de imagem por `input[type=file]`
- abertura do modal de camera
- consumo do evento `camera-photo-captured`
- emissao do evento `save-product`

### `product-camera-modal`

Arquivos:

- `js/components/product-camera-modal/product-camera-modal.js`
- `js/components/product-camera-modal/product-camera-modal.css`

Responsabilidades:

- encapsular captura de foto por webcam
- abrir e fechar modal proprio
- solicitar permissao de camera com `getUserMedia`
- mostrar preview de video
- capturar frame para `data URL`
- emitir evento `camera-photo-captured`

### `toast-message`

Arquivos:

- `js/components/toast-message/toast-message.js`
- `js/components/toast-message/toast-message.css`

Responsabilidades:

- exibir feedback no canto superior direito
- suportar variants de sucesso e erro
- auto-dismiss para sucesso
- barra de progresso visual nas mensagens temporizadas

## Fluxo de dados e eventos

### Fluxo principal

1. `inventory-app` carrega produtos com `getAllProducts()`
2. produtos vao para `product-table`
3. `product-table` instancia `product-card`
4. acoes dos cards sobem por eventos customizados
5. `inventory-app` persiste alteracoes em `js/db.js`
6. `inventory-app` rerenderiza a listagem

### Fluxo de busca

1. usuario digita em `product-search`
2. componente emite `search-change`
3. `inventory-app` atualiza `#query`
4. filtro e reaplicado na lista em memoria

### Fluxo de cadastro/edicao

1. usuario abre cadastro pelo header ou edita por um card
2. `inventory-app` abre `product-modal`
3. `product-form` valida os dados
4. `product-form` emite `save-product`
5. `inventory-app` persiste no IndexedDB
6. listagem e feedback sao atualizados

### Fluxo de imagem por camera

1. usuario clica em `Camera` no `product-form`
2. `product-form` abre `product-camera-modal`
3. modal solicita acesso a webcam
4. usuario captura a foto
5. `product-camera-modal` emite `camera-photo-captured`
6. `product-form` armazena a imagem em `#selectedImage`

### Fluxo de tema

1. usuario clica no botao de tema no `inventory-header`
2. header emite `header-action` com `toggle-theme`
3. `inventory-app` alterna entre `light` e `dark`
4. tema e salvo em `localStorage`
5. `document.documentElement.dataset.theme` e atualizado

## Persistencia

Arquivo:

- `js/db.js`

Banco:

- `controle-estoque-db`

Store:

- `produtos`

Campos usados no produto:

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

## Estilo e organizacao de CSS

### `styles.css`

Contem apenas:

- tokens CSS
- tema claro
- tema escuro
- reset/base global
- estilos compartilhados de baixo nivel, como `body`, `button`, `.btn`, `.card`

### CSS por componente

Cada componente possui um arquivo CSS proprio ao lado do JS. Isso melhora:

- localizacao de regras
- manutencao
- isolamento conceitual
- previsibilidade durante refatoracao

Atualmente os CSS dos componentes sao carregados pelo `index.html`.

## Funcionalidades implementadas

### Produtos

- cadastro
- edicao
- exclusao
- listagem por cards
- ajuste rapido de estoque
- busca textual

### Imagens

- upload manual por arquivo
- captura por webcam
- armazenamento em `data URL`
- placeholder local se nao houver imagem

### Persistencia e recuperacao

- IndexedDB local
- backup em `.json`
- restauracao completa por arquivo

### Experiencia de uso

- header fixo
- foco inicial orientado ao fluxo operacional
- responsividade com grid adaptativo
- faixa tablet com 4 itens por linha perto de `1024px`
- tema claro/escuro
- toast de sucesso e erro

## Regras atuais de comportamento

### Foco

- se houver produtos, foco vai para a busca
- se nao houver produtos, o modal de cadastro abre automaticamente
- ao abrir o formulario, o foco preferencial vai para o campo de codigo de barras

### Exclusao

- confirmacao via `window.confirm`

### Restauracao

- restaurar substitui integralmente a base local atual

### Captura de imagem

- depende de permissao do navegador para webcam
- a foto capturada substitui a selecao anterior do `input file`

## Observacoes tecnicas

- nao ha framework, bundler ou transpiler
- o app depende de navegador com suporte moderno a:
  - ES Modules
  - Custom Elements
  - IndexedDB
  - `localStorage`
  - `navigator.mediaDevices.getUserMedia`
- o carregamento dos estilos ainda e centralizado em `index.html`, mesmo com CSS por componente

## Resumo arquitetural

O estado central da aplicacao vive em `inventory-app`, a persistencia vive em `db.js` e a interface foi fragmentada em componentes especializados com eventos customizados para comunicacao. A organizacao atual privilegia separacao de responsabilidades, baixo acoplamento entre elementos visuais e manutencao incremental sem introduzir dependencias externas.

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
- `js/components/inventory-app/inventory-app.js`
- `js/components/inventory-header/inventory-header.js`
- `js/components/product-search/product-search.js`
- `js/components/product-table/product-table.js`
- `js/components/product-card/product-card.js`
- `js/components/product-modal/product-modal.js`
- `js/components/product-form/product-form.js`
- `js/components/product-camera-modal/product-camera-modal.js`
- `js/components/toast-message/toast-message.js`

## Execucao local

O projeto pode ser servido localmente com os scripts:

- `start-busybox-httpd.sh`
- `stop-busybox-httpd.sh`

Porta padrao:

- `4000`
