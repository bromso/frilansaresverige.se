import https from 'node:https'
import type { NextApiRequest, NextApiResponse } from 'next'

const slackWebHookURL: string | undefined =
  process.env.SLACK_GIG_TIP_WEBHOOK_URL

const RELATION_LABELS: Record<string, string> = {
  formedlare:
    'Uppdraget innebär avtal med en förmedlare, som i sin tur har avtal med kunden',
  direktavtal: 'Den vi söker kommer ha direktavtal med kunden',
}

interface SubmitGigTipBody {
  title: string
  location: string
  clientName: string
  minRate: string
  description: string
  contact: string
  relation: string
}

interface ErrorResponse {
  error: string
}
interface SuccessResponse {
  success: boolean
  name: string
  slackResponse: string
}

type MessageBody = {
  username: string
  icon_emoji: string
  text: string
}

const messageBody: MessageBody = {
  username: 'Tips om konsultuppdrag',
  icon_emoji: ':briefcase:',
  text: '',
}

/**
 * Handles the actual sending request.
 */
function sendSlackMessage(
  webhookURL: string,
  messageBody: MessageBody,
): Promise<string> {
  let messageString: string | undefined
  // make sure the incoming message body can be parsed into valid JSON
  try {
    messageString = JSON.stringify(messageBody)
  } catch (_error) {
    throw new Error('Failed to stringify messageBody')
  }

  // Promisify the https.request
  return new Promise((resolve, reject) => {
    // general request options, we defined that it's a POST request and content is JSON
    const requestOptions = {
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
    }

    const req = https.request(webhookURL, requestOptions, (res) => {
      let response = ''
      res.on('data', (d) => {
        response += d
      })
      res.on('end', () => {
        resolve(response)
      })
    })

    req.on('error', (e) => {
      reject(e)
    })

    req.write(messageString)
    req.end()
  })
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>,
) {
  if (!slackWebHookURL) {
    console.error('Please fill in your Webhook URL')
    res.status(400).json({ error: 'Please fill in the Slack Webhook URL' })
    return
  }

  const body: SubmitGigTipBody = req.body
  const {
    title,
    location,
    clientName,
    minRate,
    description,
    contact,
    relation,
  } = body

  const newMessage: MessageBody = {
    ...messageBody,
    text:
      'Nytt tips om konsultuppdrag! \n' +
      `Titel: ${title} \n` +
      `Plats: ${location} \n` +
      `Uppdragsgivare: ${clientName} \n` +
      `Minimumarvode: ${minRate} kr/h \n` +
      `Beskrivning: ${description} \n` +
      `Kontakt: ${contact} \n` +
      `Relation till kunden: ${RELATION_LABELS[relation] ?? relation}`,
  }

  const slackResponse = await sendSlackMessage(slackWebHookURL, newMessage)

  res.status(200).json({
    success: true,
    name: 'Submit gig tip result',
    slackResponse,
  })
}
