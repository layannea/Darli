import twilio from 'twilio'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

export async function sendVerificationSMS(phone: string, code: string) {
  await client.messages.create({
    body: `Your Darli verification code is: ${code}. It expires in 10 minutes.`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone,
  })
}