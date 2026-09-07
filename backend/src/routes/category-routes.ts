import type { AuthConfig } from '../config.ts';
import { createCategoryController } from '../controllers/category-controller.ts';
import type { Route } from '../http/router.ts';
import type { CategoryService } from '../services/category-service.ts';

export function categoryRoutes(service: CategoryService, config: AuthConfig): Route[] {
  return [{ method: 'GET', pathname: '/api/categorias', handler: createCategoryController(service, config) }];
}
