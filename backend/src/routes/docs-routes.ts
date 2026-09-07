import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { openapi } from '../docs/openapi.ts';
import { sendJson } from '../http/response.ts';
import type { Route } from '../http/router.ts';

const require = createRequire(import.meta.url);
const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Receitas — API</title><link rel="stylesheet" href="/api/docs/swagger-ui.css"></head>
<body><div id="swagger-ui"></div><script src="/api/docs/swagger-ui-bundle.js"></script>
<script>SwaggerUIBundle({url:'/api/docs/openapi.json',dom_id:'#swagger-ui',withCredentials:true,validatorUrl:null,persistAuthorization:false,docExpansion:'list'});</script>
</body></html>`;

export const docsRoutes: Route[] = [
  { method: 'GET', pathname: '/api/docs', handler: (_request, response) => {
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    response.end(html);
  } },
  { method: 'GET', pathname: '/api/docs/openapi.json', handler: (_request, response) => sendJson(response, 200, openapi) },
  ...[
    ['swagger-ui.css', 'text/css; charset=utf-8'],
    ['swagger-ui-bundle.js', 'text/javascript; charset=utf-8'],
  ].map(([file, contentType]): Route => ({
    method: 'GET', pathname: `/api/docs/${file}`,
    handler: async (_request, response) => {
      const content = await readFile(require.resolve(`swagger-ui-dist/${file}`));
      response.writeHead(200, { 'Content-Type': contentType! });
      response.end(content);
    },
  })),
];
