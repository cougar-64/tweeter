// AI-assisted: see AI-ATTRIBUTION.md
import { createHash, randomBytes } from "node:crypto";
import { AuthToken } from "tweeter-shared";
import type { AuthenticationDAOFactory } from "../dao/AuthenticationDAOFactory";
import type { SessionDAO } from "../dao/SessionDAO";

export class AuthorizationService {
  private readonly sessionDAO: SessionDAO;

  public constructor(
    factory: Pick<AuthenticationDAOFactory, "createSessionDAO">,
    private readonly inactivitySeconds: number
  ) {
    if (!Number.isSafeInteger(inactivitySeconds) || inactivitySeconds <= 0) {
      throw new Error("Session inactivity must be a positive whole number of seconds.");
    }
    this.sessionDAO = factory.createSessionDAO();
  }

  /** Call only after registration or credential verification succeeds. */
  public async createSession(userAlias: string): Promise<AuthToken> {
    if (userAlias.trim().length === 0) {
      throw new Error("A user alias is required to create a session.");
    }
    const timestamp = Date.now();
    const lastActivity = Math.floor(timestamp / 1000);
    // Node crypto is the sole generator: never fall back to Math.random().
    const token = randomBytes(32).toString("hex");
    await this.sessionDAO.createSession({
      tokenHash: this.hashToken(token),
      userAlias,
      lastActivity,
      expiresAt: lastActivity + this.inactivitySeconds,
    });
    // The existing client contract uses milliseconds; storage/TTL use seconds.
    return new AuthToken(token, timestamp);
  }

  /** Validate server-side activity, refresh expiration, and return the acting user. */
  public async authorize(token: string): Promise<string> {
    const tokenHash = this.hashToken(token);
    const now = Math.floor(Date.now() / 1000);
    const session = await this.sessionDAO.refreshSession(tokenHash, now, this.inactivitySeconds);
    if (session === null || session.expiresAt <= now) {
      throw this.unauthorized();
    }
    return session.userAlias;
  }

  public async revokeSession(token: string): Promise<void> {
    // Logout is itself authenticated. DAO deletion remains idempotent and
    // concurrent refreshes cannot recreate a deleted record.
    await this.authorize(token);
    await this.sessionDAO.deleteSession(this.hashToken(token));
  }

  private hashToken(token: string): string {
    if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token)) {
      throw this.unauthorized();
    }
    return createHash("sha256").update(token).digest("hex");
  }

  private unauthorized(): Error {
    // API Gateway's 401 selection rule will match this prefix when wired.
    return new Error("[Unauthorized] Invalid or expired authentication token.");
  }
}
