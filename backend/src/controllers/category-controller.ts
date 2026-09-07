import type { AuthConfig } from '../config.ts';
import { sendJson } from '../http/response.ts';
import type { Handler } from '../http/router.ts';
import { authenticate } from '../middlewares/authenticate.ts';
import type { CategoryService } from '../services/category-service.ts';

export function createCategoryController(service: CategoryService, config: AuthConfig): Handler {
  return async (request, response) => {
    await authenticate(request, config);
    sendJson(response, 200, await service.list());
  };
}
