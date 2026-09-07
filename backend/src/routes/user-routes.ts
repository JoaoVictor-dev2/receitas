import type { AuthConfig } from '../config.ts';
import { createUserController } from '../controllers/user-controller.ts';
import type { Route } from '../http/router.ts';
import type { UserService } from '../services/user-service.ts';

export function userRoutes(service: UserService, config: AuthConfig): Route[] {
  const controller = createUserController(service, config);
  return [
    { method: 'POST', pathname: '/api/usuarios', handler: controller.register },
    { method: 'POST', pathname: '/api/auth/login', handler: controller.login },
    { method: 'POST', pathname: '/api/auth/logout', handler: controller.logout },
  ];
}
