import { env } from '../config/env.js';

const commands = [
  {
    name: 'hello',
    description: 'Check that Command Hub is working',
  },
  {
    name: 'notify',
    description: 'Send a notification through Command Hub',
    options: [
      {
        name: 'message',
        description: 'The notification message',
        type: 3,
        required: true,
      },
    ],
  },
];

const response = await fetch(
  `https://discord.com/api/v10/applications/${env.DISCORD_APP_ID}/commands`,
  {
    method: 'PUT',
    headers: {
      Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commands),
  },
);

const body = await response.text();

if (!response.ok) {
  console.error('Failed to register commands:', response.status, body);
  process.exit(1);
}