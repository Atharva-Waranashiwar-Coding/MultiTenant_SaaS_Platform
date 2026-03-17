import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Usage: @CurrentUser() user: JwtPayload
// Extracts the authenticated user injected by JwtAuthGuard
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
