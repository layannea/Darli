import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = 'Darli <onboarding@resend.dev>' // change to your domain in production

export async function sendVerificationEmail(email: string, code: string, name?: string | null) {
    const { error } = await resend.emails.send({
        from: FROM,
        to: process.env.NODE_ENV === 'production' ? email : 'lae2146@columbia.edu',
        subject: `${code} is your Darli verification code`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="margin:0;padding:0;background:#09090d;font-family:'Plus Jakarta Sans',system-ui,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
            <tr><td align="center">
              <table width="480" cellpadding="0" cellspacing="0" style="background:#0f0f14;border:1px solid #1e1e27;border-radius:14px;overflow:hidden;">
                <!-- Header -->
                <tr>
                  <td style="padding:28px 32px;border-bottom:1px solid #1e1e27;">
                    <span style="display:inline-flex;align-items:center;gap:8px;font-size:18px;font-weight:700;color:#ededf5;letter-spacing:-0.02em;">
                      <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#7c6ffa;box-shadow:0 0 8px rgba(124,111,250,0.6);"></span>
                      Darli
                    </span>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding:32px;">
                    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#ededf5;letter-spacing:-0.025em;">
                      Verify your email
                    </h1>
                    <p style="margin:0 0 28px;font-size:14px;color:#8585a4;line-height:1.6;">
                      ${name ? `Hi ${name}, use` : 'Use'} the code below to verify your Darli account. It expires in <strong style="color:#ededf5;">10 minutes</strong>.
                    </p>
                    <!-- Code box -->
                    <div style="background:#141419;border:1px solid #1e1e27;border-radius:10px;padding:24px;text-align:center;margin-bottom:28px;">
                      <div style="font-size:38px;font-weight:800;letter-spacing:0.18em;color:#ededf5;font-family:monospace;">
                        ${code}
                      </div>
                    </div>
                    <p style="margin:0;font-size:13px;color:#52526e;line-height:1.6;">
                      If you didn't create a Darli account, you can safely ignore this email.
                    </p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="padding:20px 32px;border-top:1px solid #1e1e27;">
                    <p style="margin:0;font-size:12px;color:#52526e;">
                      © ${new Date().getFullYear()} Darli · This is an automated message
                    </p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </body>
      </html>
    `,
  })

  if (error) throw new Error(`Failed to send email: ${error.message}`)
}