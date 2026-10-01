# Command Hub

Command Hub is a Discord command management backend that receives Discord slash commands, applies configurable rules, stores interaction history, responds to users, and optionally mirrors notifications to another Discord channel or Slack.

The project is designed around a simple flow:

```text
Discord
   │
   │ Slash Command
   ▼
Command Hub
   │
   ├── Validate Discord signature
   ├── Apply command rules
   ├── Store interaction
   ├── Reply to Discord
   └── Mirror notification
          │
          ├── Discord Webhook
          └── Slack Webhook
```

## Installation & Setup

### Prerequisites

Before running the project, make sure you have:

* Node.js 20 or later
* npm
* PostgreSQL database
* Discord account
* Discord application/bot
* Discord Application ID
* Discord Public Key
* Discord Bot Token

A PostgreSQL database can be created using [Neon](https://neon.tech/).

### Installation

Clone the repository and move into the backend directory:

```bash
git clone <repository-url>
cd <repository-name>/server
```

Install dependencies:

```bash
npm install
```

### Environment Variables

Create a `.env` file in the `server` directory:

```env
PORT=3000

DISCORD_PUBLIC_KEY=your_discord_public_key
DISCORD_APP_ID=your_discord_application_id
DISCORD_BOT_TOKEN=your_discord_bot_token

DATABASE_URL=your_database_url
DIRECT_URL=your_direct_database_url

CRON_SECRET=your_cron_secret
```

| Variable             | Description                                                      |
| -------------------- | ---------------------------------------------------------------- |
| `PORT`               | Port on which the Express server runs                            |
| `DISCORD_PUBLIC_KEY` | Discord application's public key used for signature verification |
| `DISCORD_APP_ID`     | Discord application ID                                           |
| `DISCORD_BOT_TOKEN`  | Discord bot authentication token                                 |
| `DATABASE_URL`       | PostgreSQL connection URL                                        |
| `DIRECT_URL`         | Direct PostgreSQL connection URL used by Prisma migrations       |
| `CRON_SECRET`        | Secret used to protect the internal retry endpoint               |

**Never commit `.env` or expose these credentials publicly.**

### Database Setup

Generate the Prisma client:

```bash
npx prisma generate
```

Run database migrations:

```bash
npx prisma migrate dev
```

To check migration status:

```bash
npx prisma migrate status
```

To inspect the database:

```bash
npx prisma studio
```

### Running Locally

Start the development server:

```bash
npm run dev
```

The server runs on:

```text
http://localhost:3000
```

For production-style execution:

```bash
npm start
```

### Health Check

Once the server is running:

```bash
curl http://localhost:3000/health
```

Expected response:

```json
{
  "ok": true
}
```

## Project Structure

```text
server/
├── prisma/
│   ├── migrations/
│   └── schema.prisma
│
├── src/
│   ├── config/
│   │   └── env.js
│   │
│   ├── lib/
│   │   ├── logger.js
│   │   └── prisma.js
│   │
│   ├── middleware/
│   │   ├── requireAuth.js
│   │   ├── verifyCronSecret.js
│   │   └── verifyDiscordSignature.js
│   │
│   ├── routes/
│   │   ├── auth.js
│   │   ├── commands.js
│   │   ├── guilds.js
│   │   ├── health.js
│   │   ├── interactions.js
│   │   ├── interactionsApi.js
│   │   ├── internal.js
│   │   └── stats.js
│   │
│   ├── services/
│   │   ├── authService.js
│   │   ├── healthService.js
│   │   ├── interactionsService.js
│   │   ├── mirrorService.js
│   │   ├── retryService.js
│   │   └── ruleService.js
│   │
│   ├── scripts/
│   │   └── registerCommands.js
│   │
│   ├── app.js
│   └── index.js
│
├── package.json
├── package-lock.json
└── .env
```

## Features

* Discord slash commands
* `/hello` command
* `/notify` command with message input
* Discord Ed25519 interaction signature verification
* PostgreSQL persistence using Prisma
* Configurable command rules
* Enable/disable commands
* Custom reply templates
* Keyword-based flagging
* Optional Discord/Slack notification mirroring
* Action-level success/failure tracking
* Failed-action retry support
* Session-based authentication
* Password hashing using `scrypt`
* HTTP-only authentication cookies
* Guild and command configuration
* Interaction history and statistics

## Tech Stack

* **Node.js 20+**
* **Express.js**
* **Prisma ORM**
* **PostgreSQL**
* **Neon PostgreSQL**
* **Discord Interactions API**
* **Zod**
* **Pino**

## Discord Application Setup

Command Hub uses Discord's HTTP interactions model.

### 1. Create a Discord Application

Create an application in the Discord Developer Portal.

Under the application, create a bot.

You will need:

* Application ID
* Public Key
* Bot Token

Add these values to `.env`.

### 2. Configure Bot Permissions

Invite the bot to your test Discord server with the permissions required to use slash commands and send messages.

### 3. Configure the Interaction Endpoint

Discord requires a publicly accessible HTTPS endpoint.

For local development, a tunneling service such as ngrok can be used.

Start the application:

```bash
npm run dev
```

Then expose port `3000`:

```bash
ngrok http 3000
```

Use the generated HTTPS URL as the Discord Interactions Endpoint URL:

```text
https://<ngrok-domain>/interactions
```

Discord first sends a `PING` request to verify the endpoint. Command Hub responds with the required `PONG` response.

### 4. Register Slash Commands

Register the commands using:

```bash
node src/scripts/registerCommands.js
```

The current commands are:

```text
/hello
/notify
```

## Discord Commands

### `/hello`

Checks that Command Hub is working.

Example:

```text
/hello
```

The bot responds:

```text
Hello! Command Hub is working 🚀
```

### `/notify`

Accepts a notification message.

Example:

```text
/notify message:server is down
```

Command Hub:

1. Receives the Discord interaction.
2. Verifies the Discord signature.
3. Reads the command configuration.
4. Applies the configured rules.
5. Stores the interaction.
6. Sends a response back to Discord.
7. Mirrors the notification if mirroring is enabled.

## Command Rules

Each command can have configurable rules.

### Enable / Disable

A command can be enabled or disabled.

When disabled, Command Hub returns:

```text
This command is currently disabled.
```

### Reply Template

A custom response can be configured using:

```text
{{text}}
```

For example:

```text
Notification received: {{text}}
```

If the user sends:

```text
/notify message:server is down
```

the response becomes:

```text
Notification received: server is down
```

### Keyword Flagging

Commands can contain a list of keywords.

For example:

```text
urgent
critical
down
```

If the incoming message contains one of these keywords, the interaction is marked as flagged by the rule engine.

### Mirroring

A command can optionally mirror its response through a configured webhook.

Supported webhook types:

* Discord webhook
* Slack incoming webhook

## Failure Handling

Command Hub tracks individual actions performed for an interaction.

For example:

```text
/notify
   │
   ├── Reply Action
   │      └── success
   │
   └── Mirror Action
          └── failed
```

If the Discord response succeeds but the mirror webhook fails, the Discord response remains successful while the mirror action is recorded as failed.

Failed actions store:

* Status
* Attempt count
* Error message
* Next retry time

Failed actions can be retried through the protected retry mechanism.

## Authentication

The backend provides session-based authentication for protected application APIs.

Authentication uses:

* Password hashing with Node.js `scrypt`
* Random session tokens
* SHA-256 hashed session tokens in the database
* HTTP-only cookies
* Session expiration

The raw session token is never stored directly in the database.

## Database Models

The main database entities are:

### User

Stores application users and password hashes.

### Session

Stores authenticated sessions and their expiration times.

### Guild

Stores connected Discord guild configuration and mirror settings.

### CommandConfig

Stores configurable behavior for individual Discord commands.

### Interaction

Stores received Discord command interactions.

### Action

Tracks operations performed for an interaction, such as:

```text
reply
mirror
ai
```

and their execution status.

## Testing

The main backend flow can be tested as follows.

### Basic command

Run:

```text
/hello
```

Verify that Discord receives the response.

### Notification

Run:

```text
/notify message:server is down
```

Verify that:

* The command receives a response.
* The interaction is stored in PostgreSQL.
* The reply action is marked successful.

### Mirror

Enable mirroring and configure a valid webhook.

Run:

```text
/notify message:server is down
```

Verify that the notification is received by the configured mirror destination.

### Mirror failure

Temporarily configure an invalid webhook and run:

```text
/notify message:server is down
```

The Discord reply should still succeed while the mirror action should be recorded as failed.

### Retry

After a failed action becomes eligible for retry, the internal retry mechanism can be invoked using the configured `CRON_SECRET`.

Detailed API information is documented separately in `API.md`.

## Security Considerations

Command Hub includes several security measures:

* Discord Ed25519 signature verification
* HTTP-only authentication cookies
* Password hashing with `scrypt`
* Hashed session tokens
* Protected internal retry endpoint
* Environment-based secret configuration
* Mirror webhook URLs are not returned by the guild API
* Discord interaction request bodies are verified before processing

Sensitive values such as bot tokens, database credentials, session secrets, and webhook URLs should never be committed to source control.

## Current Scope

The current implementation focuses on the backend and Discord interaction workflow:

* Discord interaction handling
* Slash commands
* Command configuration
* Interaction persistence
* Notification mirroring
* Failure tracking
* Retries
* Authentication
* Guild configuration

The frontend/dashboard and production deployment can be added separately.

## API Documentation

Detailed API documentation is maintained separately in:

```text
API.md
```

It contains endpoint definitions, authentication requirements, request/response formats, and examples.
