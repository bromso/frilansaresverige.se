// Field names shared between the browser forms and the API routes.
// Kept separate from the server module so the client bundle never pulls
// in the Node-only handler code.

/**
 * Name of the hidden honeypot input both forms render. Humans never see
 * it; form-filling bots populate every field they find. A filled
 * honeypot gets a 200 so the bot believes it succeeded, but nothing is
 * posted to Slack.
 */
export const HONEYPOT_FIELD = 'website'
