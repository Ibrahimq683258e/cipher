// Setup:
// 1. Set CONTACT_TO_EMAIL and TURNSTILE_SECRET in Apps Script > Project Settings > Script Properties.
// 2. Deploy as a Web app, execute as you, and allow access to anyone.
// 3. Paste the deployed /exec URL into CONTACT_ENDPOINT in contact/index.html.
const MAX_MESSAGE_LENGTH = 5000;

function doPost(event) {
  try {
    if (!event || !event.postData || !event.postData.contents) {
      return jsonResponse({ success: false, message: 'The request did not contain a message.' });
    }

    const payload = JSON.parse(event.postData.contents || '{}');
    const name = String(payload.name || '').trim();
    const email = String(payload.email || '').trim();
    const message = String(payload.message || '').trim();
    const turnstileToken = String(payload.turnstileToken || '').trim();
    const properties = PropertiesService.getScriptProperties();
    const recipient = properties.getProperty('CONTACT_TO_EMAIL');
    const turnstileSecret = properties.getProperty('TURNSTILE_SECRET');

    if (!name || name.length > 120) {
      return jsonResponse({ success: false, message: 'Enter your name (up to 120 characters).' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return jsonResponse({ success: false, message: 'Enter a valid email address.' });
    }
    if (!message || message.length > MAX_MESSAGE_LENGTH) {
      return jsonResponse({
        success: false,
        message: `Enter a message of up to ${MAX_MESSAGE_LENGTH} characters.`
      });
    }
    if (!recipient || !turnstileSecret) {
      return jsonResponse({ success: false, message: 'The contact service has not been configured yet.' });
    }
    if (!turnstileToken) {
      return jsonResponse({ success: false, message: 'Complete the security check and try again.' });
    }

    const verification = UrlFetchApp.fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'post',
      payload: {
        secret: turnstileSecret,
        response: turnstileToken
      },
      muteHttpExceptions: true
    });
    const verificationResult = JSON.parse(verification.getContentText());
    if (!verificationResult.success) {
      return jsonResponse({ success: false, message: 'The security check expired or could not be verified. Please try again.' });
    }

    MailApp.sendEmail({
      to: recipient,
      replyTo: email,
      subject: `Cipher contact message from ${name}`,
      body: `Name: ${name}\nEmail: ${email}\n\n${message}`
    });

    return jsonResponse({ success: true, message: 'Your message was sent successfully. Thank you for contacting us.' });
  } catch (error) {
    console.error(error);
    return jsonResponse({ success: false, message: 'We could not send your message right now. Please try again later.' });
  }
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
