import { clearAuthCookie, setAuthCookie } from '../auth/cookie.ts';
import { createToken } from '../auth/token.ts';
import type { AuthConfig } from '../config.ts';
import { readJsonBody } from '../http/request.ts';
import { sendJson, sendNoContent } from '../http/response.ts';
import type { Handler } from '../http/router.ts';
import { createUserSchema, loginSchema } from '../schemas/user-schemas.ts';
import type { UserService } from '../services/user-service.ts';

export function createUserController(service: UserService, config: AuthConfig): Record<'register' | 'login' | 'logout', Handler> {
  return {
    async register(request, response) {
      const input = createUserSchema.parse(await readJsonBody(request));
      const user = await service.register(input);
      sendJson(response, 201, user);
    },
    async login(request, response) {
      const input = loginSchema.parse(await readJsonBody(request));
      const user = await service.login(input);
      const token = await createToken(user.id, config);
      setAuthCookie(response, token, config);
      sendJson(response, 200, user);
    },
    logout(_request, response) {
      clearAuthCookie(response, config);
      sendNoContent(response);
    },
  };
}
