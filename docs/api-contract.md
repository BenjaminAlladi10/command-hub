# Command Hub API Contract

Base path: `/api` (except `/interactions` and `/health`). JSON everywhere.
Auth: HTTP-only cookie set by login. All `/api/*` routes except `/api/auth/login` require it (401 otherwise).
Errors: `{ "error": { "code": "string", "message": "string" } }` with a proper HTTP status.

## Discord-facing (no cookie auth)
- `POST /interactions`  Raw body, Ed25519-verified. 401 on bad signature.
  - type 1 PING -> `{ "type": 1 }`
  - type 2 APPLICATION_COMMAND -> record, then respond (type 4 immediate or type 5 deferred)
  - type 3 MESSAGE_COMPONENT, type 5 MODAL_SUBMIT -> stretch goals
- `GET /health` -> `{ "ok": true }` (also runs `SELECT 1` once the DB exists)

## Internal
- `POST /api/internal/retry` Header `Authorization: Bearer <CRON_SECRET>`. Runs the retry worker once. Called by a free cron.

## Auth
- `POST /api/auth/login`  `{ email, password }` -> `{ user: { id, email } }`, sets cookie
- `POST /api/auth/logout` -> 204, clears cookie
- `GET  /api/auth/me`     -> `{ user }` or 401

## Stats
- `GET /api/stats` -> `{ total24h, successRate, failedCount, pendingRetries, byCommand: [{ command, count }] }`

## Interactions
- `GET /api/interactions?cursor=&limit=&status=&command=&guildId=&q=` -> `{ items: Interaction[], nextCursor: string | null }`
- `GET /api/interactions/:id` -> `Interaction` (with `actions`)
- `POST /api/actions/:id/retry` -> `Action`

## Commands
- `GET /api/commands?guildId=` -> `CommandConfig[]`
- `PUT /api/commands/:guildId/:name` body `{ enabled, rule }` -> `CommandConfig`

## Guilds
- `GET /api/guilds/invite-url` -> `{ url }`
- `GET /api/guilds` -> `Guild[]`
- `PUT /api/guilds/:guildId` body `{ channelId, mirrorWebhook? }` -> `Guild`
  - `mirrorWebhook` must start with `https://discord.com/api/webhooks/` or `https://hooks.slack.com/`
  - It is WRITE-ONLY: never returned, never logged.

## Types
```ts
Interaction = {
  id: string; guildId: string; guildName: string;
  userId: string; username: string;
  command: string; text: string;
  status: "received" | "replied" | "failed";
  receivedAt: string; // ISO 8601
  actions: Action[];
  aiSummary?: string; aiTags?: string[];
}
Action = {
  id: string; interactionId: string;
  kind: "reply" | "mirror" | "ai";
  status: "pending" | "success" | "failed" | "retrying";
  attempts: number; lastError: string | null;
  nextRetryAt: string | null; updatedAt: string;
}
CommandConfig = {
  guildId: string; name: string; enabled: boolean;
  rule: { replyTemplate: string; mirror: boolean; flagKeywords: string[]; useAiTriage: boolean };
}
Guild = {
  guildId: string; name: string; channelId: string | null;
  channels: { id: string; name: string }[];
  mirrorConfigured: boolean; connectedAt: string;
}
```