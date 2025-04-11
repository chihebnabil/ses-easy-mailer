import { SendRawEmailCommand, GetTemplateCommand, SendTemplatedEmailCommand } from "@aws-sdk/client-ses";

class SESMailer {
    constructor(client) {
        this.client = client;
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

        // Convert email addresses to proper format
        const toAddresses = Array.isArray(to) ? to : to ? [to] : [];
        const ccAddresses = Array.isArray(cc) ? cc : cc ? [cc] : [];
        const bccAddresses = Array.isArray(bcc) ? bcc : bcc ? [bcc] : [];

        // Prepare message parts
        let rawMessage = this._createRawEmailMessage({
            from,
            to: toAddresses,
            cc: ccAddresses,
            bcc: bccAddresses,
            subject,
            html,
            text,
            attachments
        });
        
        // Send raw email using AWS SES
        const command = new SendRawEmailCommand({
            RawMessage: {
                Data: rawMessage
            }
        });
        
        return this.client.send(command);
    }

    async sendFileTemplate(options) {
        const {
            from = this.defaultFrom,
            to,
            cc,
            bcc,
            subject,
            templateContent, // Changed from templatePath to templateContent
            templateData = {},
            attachments = []
        } = options;

        // Use provided template content directly instead of loading from file
        return this.sendRawEmail({
            from,
            to,
            cc,
            bcc,
            subject,
            html: this._replacePlaceholders(templateContent, templateData),
            attachments
        });
    }

    async _loadSESTemplate(templateName) {
        const response = await this.client.send(
            new GetTemplateCommand({ TemplateName: templateName })
        );
        return response.Template.HtmlPart;
    }

    _replacePlaceholders(template, data) {
        return template.replace(/{{\s*[\w]+?\s*}}/g, (placeholder) => {
            const key = placeholder.replace(/[{}]+/g, "").trim();
            return data[key] !== undefined ? data[key] : '';
        });
    }

    _createRawEmailMessage({ from, to, cc, bcc, subject, html, text, attachments }) {
        // Implementation of MIME message creation
        // This replaces nodemailer's functionality
        
        // Generate a boundary for multipart messages
        const boundary = `----_Part_${Math.random().toString(36).substr(2, 9)}`;
        
        // Prepare headers
        let headers = [
            `From: ${from}`,
            `Subject: ${subject}`,
            `MIME-Version: 1.0`
        ];
        
        if (to.length) headers.push(`To: ${to.join(', ')}`);
        if (cc.length) headers.push(`Cc: ${cc.join(', ')}`);
        if (bcc.length) headers.push(`Bcc: ${bcc.join(', ')}`);
        
        // Simple email without attachments
        if (!attachments.length) {
            if (html && text) {
                // Both HTML and plain text
                headers.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
                
                let message = headers.join('\r\n') + '\r\n\r\n';
                
                // Add text part
                message += `--${boundary}\r\n`;
                message += `Content-Type: text/plain; charset=utf-8\r\n\r\n`;
                message += `${text}\r\n\r\n`;
                
                // Add HTML part
                message += `--${boundary}\r\n`;
                message += `Content-Type: text/html; charset=utf-8\r\n\r\n`;
                message += `${html}\r\n\r\n`;
                
                message += `--${boundary}--\r\n`;
                
                return new TextEncoder().encode(message);
            } else if (html) {
                // HTML only
                headers.push(`Content-Type: text/html; charset=utf-8`);
                return new TextEncoder().encode(headers.join('\r\n') + '\r\n\r\n' + html);
            } else {
                // Text only
                headers.push(`Content-Type: text/plain; charset=utf-8`);
                return new TextEncoder().encode(headers.join('\r\n') + '\r\n\r\n' + (text || ''));
            }
        }
        
        // Email with attachments (multipart/mixed)
        const mixedBoundary = `----_MixedPart_${Math.random().toString(36).substr(2, 9)}`;
        headers.push(`Content-Type: multipart/mixed; boundary="${mixedBoundary}"`);
        
        let message = headers.join('\r\n') + '\r\n\r\n';
        
        // Add content part (either text, HTML, or both)
        message += `--${mixedBoundary}\r\n`;
        
        if (html && text) {
            // Both HTML and plain text
            message += `Content-Type: multipart/alternative; boundary="${boundary}"\r\n\r\n`;
            
            // Add text part
            message += `--${boundary}\r\n`;
            message += `Content-Type: text/plain; charset=utf-8\r\n\r\n`;
            message += `${text}\r\n\r\n`;
            
            // Add HTML part
            message += `--${boundary}\r\n`;
            message += `Content-Type: text/html; charset=utf-8\r\n\r\n`;
            message += `${html}\r\n\r\n`;
            
            message += `--${boundary}--\r\n\r\n`;
        } else if (html) {
            // HTML only
            message += `Content-Type: text/html; charset=utf-8\r\n\r\n`;
            message += `${html}\r\n\r\n`;
        } else {
            // Text only
            message += `Content-Type: text/plain; charset=utf-8\r\n\r\n`;
            message += `${text || ''}\r\n\r\n`;
        }
        
        // Add attachments
        for (const attachment of attachments) {
            const { filename, content, contentType = 'application/octet-stream' } = attachment;
            
            message += `--${mixedBoundary}\r\n`;
            message += `Content-Type: ${contentType}; name="${filename}"\r\n`;
            message += `Content-Disposition: attachment; filename="${filename}"\r\n`;
            
            // For binary attachments, we need to encode them as base64
            if (content instanceof ArrayBuffer || content instanceof Uint8Array) {
                message += `Content-Transfer-Encoding: base64\r\n\r\n`;
                
                // Convert binary data to base64
                const base64Content = this._arrayBufferToBase64(content);
                message += `${base64Content}\r\n\r\n`;
            } else if (typeof content === 'string') {
                // Handle string content
                message += `Content-Transfer-Encoding: base64\r\n\r\n`;
                message += `${btoa(content)}\r\n\r\n`;
            }
        }
        
        message += `--${mixedBoundary}--`;
        
        return new TextEncoder().encode(message);
    }
    
    _arrayBufferToBase64(buffer) {
        // Convert ArrayBuffer to Base64
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        
        return btoa(binary);
    }
}

export default SESMailer;