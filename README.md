# ExpoTec — Automação residencial

Apresentação interativa sobre automação residencial, desenvolvida com Next.js e Three.js.

## Desenvolvimento

Requer Node.js 20.9 ou superior.

```sh
npm install
npm run dev
```

Abra http://localhost:3000.

## Produção

```sh
npm run build
```

A pasta `out/` contém o site pronto para hospedagem estática.

Para servir o resultado da compilação localmente, execute `npm start` e abra http://localhost:3000.

## Estrutura

- `app/layout.jsx`: metadados, idioma, tema inicial e folha de estilo.
- `app/page.jsx`: estrutura React da apresentação e inicialização do script após hidratação.
- `public/app.js`: conteúdo e controles dos slides.
- `public/models.js`: cenas e animações 3D.
- `public/style.css`: estilos da apresentação.
- `public/models/` e `public/vendor/`: modelos e bibliotecas locais.

Os slides continuam usando os fragmentos `#1` a `#9`. Não precisam de rotas separadas ou servidor de aplicação em produção.
