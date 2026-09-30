export async function sendMirrorNotification(webhookUrl, content) {
    if (!webhookUrl) {
      throw new Error('Mirror webhook is not configured');
    }
  
    const isDiscord = webhookUrl.startsWith(
      'https://discord.com/api/webhooks/',
    );
  
    const isSlack = webhookUrl.startsWith(
      'https://hooks.slack.com/',
    );
  
    if (!isDiscord && !isSlack) {
      throw new Error('Unsupported mirror webhook');
    }
  
    const body = isDiscord
      ? {
          content,
        }
      : {
          text: content,
        };
  
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  
    if (!response.ok) {
      const responseBody = await response.text();
  
      throw new Error(
        `Mirror webhook failed: ${response.status} ${responseBody}`,
      );
    }
  }