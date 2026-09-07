import type { AuthConfig } from '../config.ts';
import { createRecipeController } from '../controllers/recipe-controller.ts';
import type { Route } from '../http/router.ts';
import type { RecipeService } from '../services/recipe-service.ts';

export function recipeRoutes(service: RecipeService, config: AuthConfig): Route[] {
  const controller = createRecipeController(service, config);
  return [
    { method: 'GET', pathname: '/api/receitas', handler: controller.list },
    { method: 'GET', pathname: '/api/receitas/:id', handler: controller.get },
    { method: 'POST', pathname: '/api/receitas', handler: controller.create },
    { method: 'PUT', pathname: '/api/receitas/:id', handler: controller.update },
    { method: 'DELETE', pathname: '/api/receitas/:id', handler: controller.delete },
  ];
}
