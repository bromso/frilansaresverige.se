import { createAssignmentHandlers } from './assignments'
import { loadConfig } from './config'
import { createDb } from './db'
import { createMailer, createTransport } from './email'
import { createRoutes } from './server'
import {
  createMemberCountCache,
  createSlackClient,
  createSlackPropagation,
} from './slack'
import type { Logger } from './types'

const log: Logger = (message, detail) => console.error(message, detail ?? '')

const config = loadConfig()
const db = createDb(config.mysqlUrl)
const slackClient = createSlackClient(config.slack.token)
const slack = createSlackPropagation({
  db,
  slack: slackClient,
  siteUrl: config.siteUrl,
  log,
})
const mailer = createMailer(config, createTransport(config.smtp), log)
const memberCount = createMemberCountCache({
  slack: slackClient,
  channel: config.slack.memberCountChannel,
  log,
})
const handlers = createAssignmentHandlers({
  db,
  slack,
  mailer,
  channels: config.slack.channels,
  blockedSenderDomains: config.blockedSenderDomains,
  log,
})

const server = Bun.serve({
  hostname: config.host,
  port: config.port,
  routes: createRoutes({
    config,
    handlers,
    isHealthy: () => db.isHealthy(),
    memberCount: () => memberCount.get(),
  }),
  fetch: () => new Response(null, { status: 404 }),
  error(error) {
    log('Unhandled error', error)
    return new Response(null, { status: 500 })
  },
})

console.log(`uppdrag listening on http://${server.hostname}:${server.port}`)

// Anything that never reached Slack (a crash mid-post, an outage) is
// retried on every start; the member count is refreshed hourly.
slack
  .sync()
  .catch((error) =>
    log('Failed to sync assignments to Slack on startup', error),
  )
void memberCount.start()
