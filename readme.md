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
One of the key features of the SES Easy Mailer module is its support for both file and SES templates. This gives developers the flexibility to choose the method that best suits their needs.

### Using a file Template
If you prefer to keep your email templates as HTML files in your project, you can do so and SES Easy Mailer will handle the loading and rendering of these templates. This is great for developers who like to keep their templates version controlled with their code.

Here's an example of how to send an email using a file template:


```javascript
const from = 'sender@example.com';
const to = 'recipient@example.com';
const subject = 'Hello, world!';
const templateType = 'file';
const templatePath = './template.html';
const templateData = { name: 'John Doe' };
const attachments = [];

await sendMail(
    transporter,
    from,
    subject,
    templateType,
    templatePath,
    templateData,
    attachments,
    to
)
```

In this example, template.html is a HTML file with placeholders in the format `{{ placeholder }}` . The templateData object is used to replace these placeholders with actual data.



### Using SES Template

```javascript
const templateType = 'ses';
const templateName = 'se-template-name'; // The name of the template you created in SES

await sendMail(
    transporter,
    from,
    subject,
    templateType,
    templateName,
    templateData,
    attachments,
    to
)
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

#### SES Unsupported File Types
SES does not support all file types. If you try to send an email with an unsupported file type, SES will throw an error. You can find a list of supported file types [here](https://docs.aws.amazon.com/ses/latest/dg/mime-types.html).