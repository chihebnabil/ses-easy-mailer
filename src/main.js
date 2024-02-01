const { SendRawEmailCommand, GetTemplateCommand } = require("@aws-sdk/client-ses");
const nodemailer = require('nodemailer');
const fs = require('fs');

/**
 * Creates a Nodemailer transporter using the provided SES client.
 *
 * @param {SESClient} client - The SES client to use for sending emails.
 * @returns {Object} An object containing the transporter and the client.
 */
function createTransporter(client) {
    const transporter = nodemailer.createTransport({
        SES: {
            ses: client,
            aws: {
                SendRawEmailCommand
            }
        }
    });
    return {
        transporter,
        client
    };
}


/**
 * Sends an email using the provided transporter.
 * 
 * @param {Object} An object containing the transporter and the client.
 * @param {string} from - The email address to send from.
 * @param {string} subject - The subject of the email.
 * @param {string} [templateType="file"] - The type of the template. Defaults to "file".
 * @param {string} template - The path to the template to use for the email body.
 * @param {Object} templateData - The data to use in the template.
 * @param {Array} [attachments=[]] - An array of attachments to include in the email.
 * @param {string} to - The email address to send to.
 * @returns {Promise} A promise that resolves when the email has been sent.
 * @throws {Error} Throws an error if sending the email fails.
 */
async function sendMail(
    { transporter, client },
    from,
    subject,
    templateType = "file",
    templatPath,
    templateData,
    attachments = [],
    to) {

    let template = await loadTemplate(templateType, templatPath, client);
    if (templateData) {
        template = replacePlaceholders(template, templateData);
    }


    let mailOptions = {
        from: from,
        to: to,
        subject: subject,
        html: template,
    };

    if (attachments.length > 0) {
        mailOptions.attachments = attachments;
    }
    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        throw error;
    }
}


/**
 * Loads a template from a file or SES.
 *
 * @param {string} templateType - The type of the template (file, ses, html, url).
 * @param {string} template - The path to the template.
 * @param {Object} client - The SES client.
 * @returns {Promise<string>} The loaded template.
 * @throws {Error} Throws an error if loading the template fails.
 */
async function loadTemplate(templateType, template, client) {
    let temp = null;
    try {
        if (templateType === "file") {
            temp = await fs.promises.readFile(template, 'utf-8');
        } else if (templateType === "ses") {
            let response = await client.send(new GetTemplateCommand({ TemplateName: template }));
            temp = response.Template.HtmlPart;
        } else if (templateType === "html") {
            temp = template;
        } else if (templateType === "url") {
            temp = await fetch(template).then(res => res.text());
        }else {
            throw new Error(`Invalid template type: ${templateType}`);
        }
    } catch (error) {
        console.error(`Failed to load template: ${error}`);
        throw error;
    }
    return temp;
}



/**
 * Replaces placeholders in the template with the corresponding values from the templateData.
 *
 * @param {string} template - The template string with placeholders.
 * @param {Object} templateData - The data to use for replacing placeholders.
 * @returns {string} The template string with placeholders replaced by actual data.
 */
function replacePlaceholders(template, templateData) {
    return template.replace(/{{\s*[\w]+?\s*}}/g, (placeholder) => {
        const key = placeholder.replace(/[{}]+/g, "").trim();
        return templateData[key];
    });
}


module.exports = {
    createTransporter,
    sendMail
};