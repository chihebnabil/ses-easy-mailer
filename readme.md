# SES Easy Mailer

A powerful Node.js wrapper for Amazon Simple Email Service (SES) that simplifies sending transactional emails and newsletters. Built specifically for AWS SES, it provides:

- 📧 Easy integration with Amazon SES templates
- 📁 Support for local HTML templates
- 👥 Bulk email sending with CC/BCC support
- 📎 File attachments handling
- ⚡ Optimized SES API usage
- 🔄 Template variable substitution
- 🚀 Promise-based async/await API

Perfect for applications needing to send transactional emails, newsletters, or any automated email communication through Amazon SES.

## Installation

```bash
npm install ses-easy-mailer
```

## Basic Usage

```javascript
const SESMailer = require('ses-easy-mailer');
const { SESClient } = require('@aws-sdk/client-ses');

// Initialize SES client
const client = new SESClient({
    region: "us-east-1",
    credentials: {
        accessKeyId: "YOUR_KEY",
        secretAccessKey: "YOUR_SECRET",
    }
});

// Create mailer instance
const mailer = new SESMailer(client);

// Optional: Set default sender
mailer.setDefaultSender('no-reply@yourdomain.com');
```

## Sending Emails

### Using SES Templates

```javascript
await mailer.sendTemplate({
    from: 'sender@example.com',          // Optional if default sender is set
    to: 'recipient@example.com',         // String or array for multiple recipients
    cc: ['cc1@example.com'],            // Optional
    bcc: 'bcc@example.com',             // Optional
    subject: 'Welcome!',
    templateName: 'WelcomeTemplate',     // Your SES template name
    templateData: {                      // Data for template variables
        name: 'John',
        company: 'Acme Inc'
    }
});
```

### Using File Templates

```javascript
await mailer.sendFileTemplate({
    to: ['user1@example.com', 'user2@example.com'],
    subject: 'Monthly Newsletter',
    templatePath: './templates/newsletter.html',
    templateData: {
        month: 'January',
        highlights: 'New Features'
    },
    attachments: [{
        filename: 'report.pdf',
        content: Buffer.from(/* your pdf data */),
        encoding: 'base64'
    }]
});
```

### Sending Raw Emails

```javascript
await mailer.sendRawEmail({
    to: 'recipient@example.com',
    subject: 'Quick Update',
    html: '<h1>Hello!</h1><p>This is a test email.</p>',
    text: 'Hello! This is a test email.' // Optional plain text version
});
```

## API Reference

### Constructor
```javascript
const mailer = new SESMailer(sesClient);
```

### Methods

#### setDefaultSender(email)
Sets a default sender email address for all emails.
```javascript
mailer.setDefaultSender('no-reply@yourdomain.com');
```

#### sendTemplate(options)
Sends an email using an SES template.
- `options`:
  - `from`: Sender email (optional if default set)
  - `to`: Recipient(s) email (string or array)
  - `cc`: CC recipient(s) (optional, string or array)
  - `bcc`: BCC recipient(s) (optional, string or array)
  - `subject`: Email subject
  - `templateName`: Name of the SES template
  - `templateData`: Object containing template variables
  - `attachments`: Array of attachment objects (optional)

#### sendFileTemplate(options)
Sends an email using an HTML file template.
- Options same as above, but uses `templatePath` instead of `templateName`

#### sendRawEmail(options)
Sends a raw email with HTML/text content.
- Options same as above, but uses `html` and/or `text` instead of template options

### Attachments
Attachment objects should follow this format:
```javascript
{
    filename: 'document.pdf',
    content: Buffer.from(/* file content */),
    encoding: 'base64'  // Optional, defaults to base64
}
```

## Notes
- SES has [limitations on attachment types](https://docs.aws.amazon.com/ses/latest/dg/mime-types.html)
- Template placeholders use `{{variableName}}` syntax
- When using SES templates without attachments, the module uses `SendTemplatedEmailCommand` for better performance