import { Injectable, Signal, signal } from '@angular/core';

/**
 * Holds the current session's Bearer token for use during development / demo.
 *
 * Security model
 * ──────────────
 * The token is an **opaque server-side secret** that the backend maps to an
 * employee identity inside `DevApiKeyAuthHandler`.  The client never sends a
 * raw employee ID — only this token — so it cannot forge another employee's
 * identity by simply changing a header value (OWASP A01 / IDOR prevention).
 *
 * The internal `WritableSignal` is kept private so that arbitrary application
 * code cannot overwrite the session token.  A real auth service (OAuth2/OIDC)
 * would replace this class and populate `token` after a proper login flow.
 */
@Injectable({ providedIn: 'root' })
export class IdentityService {
  /** Internal writable signal — not exposed outside this service. */
  private readonly _token = signal<string>('dev-secret-employee-001');

  /**
   * The Bearer token for the current dev session.
   * Read-only outside this service; the `authInterceptor` attaches it as
   * `Authorization: Bearer <token>` on every outgoing API request.
   * The server validates the token and resolves the employee identity
   * server-side — this value is never treated as an identity by the client.
   */
  readonly token: Signal<string> = this._token.asReadonly();
}

