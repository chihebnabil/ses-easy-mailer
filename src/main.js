const { SendRawEmailCommand, GetTemplateCommand, SendTemplatedEmailCommand } = require("@aws-sdk/client-ses");
const nodemailer = require('nodemailer');
const fs = require('fs');

class SESMailer {
    constructor(client) {
        this.client = client;
        this.transporter = nodemailer.createTransport({
            SES: { ses: client, aws: { SendRawEmailCommand } }
        });
        this.defaultFrom = null;
    }

    setDefaultSender(email) {
        this.defaultFrom = email;
        return this;
    }

    async sendTemplate(options) {
        const {
            from = this.defaultFrom,
            to,
            cc,
            bcc,
            subject,
            templateName,
            templateData = {},
            attachments = []
        } = options;

        if (!from) throw new Error('From address is required');
        if (!to && !cc && !bcc) throw new Error('At least one recipient is required');

        const destination = {
            ToAddresses: Array.isArray(to) ? to : [to],
            ...(cc && { CcAddresses: Array.isArray(cc) ? cc : [cc] }),
            ...(bcc && { BccAddresses: Array.isArray(bcc) ? bcc : [bcc] })
        };

        if (!attachments.length) {
            const command = new SendTemplatedEmailCommand({
                Source: from,
                Destination: destination,
                Template: templateName,
                TemplateData: JSON.stringify(templateData)
            });
            return this.client.send(command);
        }

        const template = await this._loadSESTemplate(templateName);
        return this.sendRawEmail({
            from,
            to,
            cc,
            bcc,
            subject,
            html: this._replacePlaceholders(template, templateData),
            attachments
        });
    }

    async sendRawEmail(options) {
        const {
            from = this.defaultFrom,
            to,
            cc,
            bcc,
            subject,
            html,
            text,
            attachments = []
        } = options;

        if (!from) throw new Error('From address is required');
        if (!to && !cc && !bcc) throw new Error('At least one recipient is required');

        const mailOptions = {
            from,
            subject,
            html,
            text,
            attachments,
            ...(to && { to: Array.isArray(to) ? to.join(',') : to }),
            ...(cc && { cc: Array.isArray(cc) ? cc.join(',') : cc }),
            ...(bcc && { bcc: Array.isArray(bcc) ? bcc.join(',') : bcc })
        };

        return this.transporter.sendMail(mailOptions);
    }

    async sendFileTemplate(options) {
        const {
            from = this.defaultFrom,
            to,
            cc,
            bcc,
            subject,
            templatePath,
            templateData = {},
            attachments = []
        } = options;

        const template = await this._loadFileTemplate(templatePath);
        return this.sendRawEmail({
            from,
            to,
            cc,
            bcc,
            subject,
            html: this._replacePlaceholders(template, templateData),
            attachments
        });
    }

    async _loadSESTemplate(templateName) {
        const response = await this.client.send(
            new GetTemplateCommand({ TemplateName: templateName })
        );
        return response.Template.HtmlPart;
    }

    async _loadFileTemplate(templatePath) {
        return fs.promises.readFile(templatePath, 'utf-8');
    }

    _replacePlaceholders(template, data) {
        return template.replace(/{{\s*[\w]+?\s*}}/g, (placeholder) => {
            const key = placeholder.replace(/[{}]+/g, "").trim();
            return data[key] ?? '';
        });
    }
}

module.exports = SESMailer;