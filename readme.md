# SES Easy Mailer

A simple and easy-to-use mailer module for Amazon SES.

## Installation

```bash
npm install ses-easy-mailer
```

## Usage

```javascript
const { createTransporter, sendMail } = require('ses-easy-mailer');
const { SESClient } = require('@aws-sdk/client-ses');

const client = new SESClient(
    region: "us-east-1",
    credentials: {
        accessKeyId: "",
        secretAccessKey: "",
    }
);
const transporter = createTransporter(client);
```

### Using Local Html Template
```javascript
const from = 'sender@example.com';
const to = 'recipient@example.com';
const subject = 'Hello, world!';
const templateType = 'file';
const templatePath = './template.html';
const templateData = { name: 'John Doe' };
const attachments = [];

sendMail(
    transporter,
    from,
    subject,
    templateType,
    templatePath,
    templateData,
    attachments,
    to
).then(() => {
    console.log('Email sent successfully!');
}).catch((error) => {
    console.error(`Failed to send email: ${error}`);
});
```

In this example, template.html is a HTML file with placeholders in the format `{{ placeholder }}` . The templateData object is used to replace these placeholders with actual data.



### Using SES Template

```javascript
const templateType = 'ses';
const templateName = 'se-template-name'; // The name of the template you created in SES

sendMail(
    transporter,
    from,
    subject,
    templateType,
    templateName,
    templateData,
    attachments,
    to
).then(() => {
    console.log('Email sent successfully!');
}).catch((error) => {
    console.error(`Failed to send email: ${error}`);
});
```


### Attachments

if you want to attach files to your email, you can pass an array of objects to the attachments parameter. Each object must have the following properties:

- filename: The name of the file to be attached.
- content (Buffer): The content of the file to be attached.
- encoding: The encoding of the file data. Defaults to 'base64'.

```javascript
let buffer = Buffer.from("hello world!", "utf-8");

let attachments = [
    {
        filename: "test.txt",
        content: buffer,
        encoding: "base64",
    }
]
```