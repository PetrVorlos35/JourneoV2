import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: 'smtp.seznam.cz',
  port: 465,
  secure: true, // SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Sends a verification code email for registration or password reset.
 * 
 * @param {string} email - The recipient's email address
 * @param {string} code - The 6-digit verification code
 * @param {'REGISTER' | 'RESET'} type - The type of verification
 */
export const sendVerificationCode = async (email, code, type) => {
  const isRegister = type === 'REGISTER';
  
  const subject = isRegister 
    ? 'Potvrzení registrace - Journeo' 
    : 'Obnova hesla - Journeo';

  const title = isRegister 
    ? 'Vítejte v Journeo!' 
    : 'Obnova vašeho hesla';

  const message = isRegister
    ? 'Zadejte prosím níže uvedený kód pro dokončení registrace. Kód platí 15 minut.'
    : 'Pro obnovení hesla zadejte následující kód. Pokud jste o obnovu nežádali, můžete tento e-mail ignorovat.';

  const html = `
    <!DOCTYPE html>
    <html lang="cs">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: #f4f4f5;
          margin: 0;
          padding: 0;
          color: #18181b;
        }
        .container {
          max-width: 500px;
          margin: 40px auto;
          background-color: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        .header {
          background-color: #09090b;
          padding: 24px;
          text-align: center;
        }
        .header h1 {
          color: #ffffff;
          margin: 0;
          font-size: 24px;
          font-weight: 600;
          letter-spacing: -0.025em;
        }
        .content {
          padding: 32px 24px;
          text-align: center;
        }
        .content h2 {
          font-size: 20px;
          font-weight: 600;
          margin-top: 0;
          margin-bottom: 16px;
        }
        .content p {
          font-size: 16px;
          line-height: 1.5;
          margin-bottom: 24px;
          color: #52525b;
        }
        .code-box {
          background-color: #f4f4f5;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 24px;
          letter-spacing: 6px;
          font-size: 36px;
          font-weight: 700;
          color: #09090b;
        }
        .footer {
          text-align: center;
          padding: 24px;
          font-size: 14px;
          color: #a1a1aa;
          background-color: #fafafa;
          border-top: 1px solid #f4f4f5;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Journeo</h1>
        </div>
        <div class="content">
          <h2>${title}</h2>
          <p>${message}</p>
          <div class="code-box">${code}</div>
          <p style="font-size: 14px; color: #71717a;">
            Tento kód zadejte do aplikace.
          </p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Journeo. Všechna práva vyhrazena.
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: '"Journeo" <petr@vorlos.eu>',
    to: email,
    subject: subject,
    html: html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email odeslán: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Chyba při odesílání emailu:', error);
    throw error;
  }
};

/**
 * Notifies a user by email that they received a friend request.
 *
 * @param {string} email - The recipient's (addressee's) email address
 * @param {string} requesterName - The name of the person who sent the request
 */
export const sendFriendRequestEmail = async (email, requesterName) => {
  const subject = 'Nová žádost o přátelství - Journeo';
  const appUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const friendsUrl = `${appUrl}/dashboard/friends`;

  const html = `
    <!DOCTYPE html>
    <html lang="cs">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: #f4f4f5;
          margin: 0;
          padding: 0;
          color: #18181b;
        }
        .container {
          max-width: 500px;
          margin: 40px auto;
          background-color: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        .header {
          background-color: #09090b;
          padding: 24px;
          text-align: center;
        }
        .header h1 {
          color: #ffffff;
          margin: 0;
          font-size: 24px;
          font-weight: 600;
          letter-spacing: -0.025em;
        }
        .content {
          padding: 32px 24px;
          text-align: center;
        }
        .content h2 {
          font-size: 20px;
          font-weight: 600;
          margin-top: 0;
          margin-bottom: 16px;
        }
        .content p {
          font-size: 16px;
          line-height: 1.5;
          margin-bottom: 24px;
          color: #52525b;
        }
        .button {
          display: inline-block;
          background-color: #09090b;
          color: #ffffff;
          text-decoration: none;
          padding: 14px 28px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
        }
        .footer {
          text-align: center;
          padding: 24px;
          font-size: 14px;
          color: #a1a1aa;
          background-color: #fafafa;
          border-top: 1px solid #f4f4f5;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Journeo</h1>
        </div>
        <div class="content">
          <h2>Nová žádost o přátelství</h2>
          <p><strong>${requesterName}</strong> vám poslal/a žádost o přátelství na Journeo.</p>
          <a href="${friendsUrl}" class="button" style="display:inline-block;background-color:#09090b;color:#ffffff !important;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:16px;font-weight:600;">
            <span style="color:#ffffff;">Zobrazit žádost</span>
          </a>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Journeo. Všechna práva vyhrazena.
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: '"Journeo" <petr@vorlos.eu>',
    to: email,
    subject: subject,
    html: html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email odeslán: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Chyba při odesílání emailu:', error);
    throw error;
  }
};
