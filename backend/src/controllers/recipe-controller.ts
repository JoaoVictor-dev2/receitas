import { URL } from 'node:url';
import type { AuthConfig } from '../config.ts';
import { readJsonBody } from '../http/request.ts';
import { sendJson, sendNoContent } from '../http/response.ts';
import type { Handler } from '../http/router.ts';
import { authenticate } from '../middlewares/authenticate.ts';
import { recipeParamsSchema, recipeSchema } from '../schemas/recipe-schemas.ts';
import type { RecipeService } from '../services/recipe-service.ts';

export function createRecipeController(service: RecipeService, config: AuthConfig): Record<'list' | 'get' | 'create' | 'update' | 'delete', Handler> {
  return {
    async list(request, response) {
      const user = await authenticate(request, config);
      const q = new URL(request.url!, 'http://localhost').searchParams.get('q') ?? undefined;
      sendJson(response, 200, await service.list(user.id, q));
    },
    async get(request, response, params) {
      const user = await authenticate(request, config);
      const { id } = recipeParamsSchema.parse(params);
      sendJson(response, 200, await service.get(id, user.id));
    },
    async create(request, response) {
      const user = await authenticate(request, config);
      const input = recipeSchema.parse(await readJsonBody(request));
      sendJson(response, 201, await service.create(user.id, input));
    },
    async update(request, response, params) {
      const user = await authenticate(request, config);
      const { id } = recipeParamsSchema.parse(params);
      const input = recipeSchema.parse(await readJsonBody(request));
      sendJson(response, 200, await service.update(id, user.id, input));
    },
    async delete(request, response, params) {
      const user = await authenticate(request, config);
      const { id } = recipeParamsSchema.parse(params);
      await service.delete(id, user.id);
      sendNoContent(response);
    },
  };
}
