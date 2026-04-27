import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { IdentityService } from '../services/identity.service';

/**
 * HTTP interceptor that attaches the current session's Bearer token as the
 * standard `Authorization` header on every outgoing API call.
 *
 * Security model
 * ──────────────
 * The token is an opaque server-side secret managed by `IdentityService`.
 * The backend's `DevApiKeyAuthHandler` validates it against a server-owned
 * token→employeeId map so that identity is resolved server-side, not from a
 * user-controllable value (OWASP A01 / IDOR prevention).
 *
 * The previous implementation sent an `X-Employee-Id` header whose value the
 * client chose directly — any caller could impersonate any employee by setting
 * an arbitrary header.  This interceptor no longer does that.
 *
 * Migration path: when real auth (JWT/OIDC) is introduced, replace
 * `IdentityService.token` with the JWT access token obtained after login;
 * the `Authorization: Bearer` format is already the correct standard.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const identity = inject(IdentityService);
  const token = identity.token();

  if (!token) {
    return next(req);
  }

  const authedReq = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });

  return next(authedReq);
};
