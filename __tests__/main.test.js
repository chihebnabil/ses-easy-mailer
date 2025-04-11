import SESMailer from '../src/main.js';

// Mock SES client
const mockSend = jest.fn();
const mockSESClient = {
    send: mockSend
};

describe('SESMailer', () => {
    let mailer;

    beforeEach(() => {
        mailer = new SESMailer(mockSESClient);
        mockSend.mockClear();
    });

    describe('setDefaultSender', () => {
        it('should set default sender email', () => {
            const email = 'test@example.com';
            const result = mailer.setDefaultSender(email);
            expect(result).toBe(mailer);
            expect(mailer.defaultFrom).toBe(email);
        });
    });

    describe('sendTemplate', () => {
        it('should send templated email without attachments', async () => {
            const options = {
                from: 'sender@example.com',
                to: 'recipient@example.com',
                subject: 'Test',
                templateName: 'TestTemplate',
                templateData: { name: 'John' }
            };

            await mailer.sendTemplate(options);

            expect(mockSend).toHaveBeenCalledWith(
                expect.objectContaining({
                    input: {
                        Source: options.from,
                        Destination: {
                            ToAddresses: [options.to]
                        },
                        Template: options.templateName,
                        TemplateData: JSON.stringify(options.templateData)
                    }
                })
            );
        });

        it('should send raw email when attachments are present', async () => {
            const templateHtml = '<h1>Hello {{name}}</h1>';
            mockSend.mockImplementationOnce(() => ({
                Template: { HtmlPart: templateHtml }
            }));

            const options = {
                from: 'sender@example.com',
                to: 'recipient@example.com',
                subject: 'Test',
                templateName: 'TestTemplate',
                templateData: { name: 'John' },
                attachments: [{
                    filename: 'test.txt',
                    content: 'Hello World'
                }]
            };

            await mailer.sendTemplate(options);

            expect(mockSend).toHaveBeenCalledWith(
                expect.objectContaining({
                    input: { TemplateName: options.templateName }
                })
            );

            // Verify the second call for raw email
            expect(mockSend).toHaveBeenCalledWith(
                expect.objectContaining({
                    input: expect.objectContaining({
                        RawMessage: expect.any(Object)
                    })
                })
            );
        });
    });

    describe('sendRawEmail', () => {
        it('should send raw email with HTML content', async () => {
            const options = {
                from: 'sender@example.com',
                to: 'recipient@example.com',
                subject: 'Test',
                html: '<h1>Hello</h1>'
            };

            await mailer.sendRawEmail(options);

            expect(mockSend).toHaveBeenCalledWith(
                expect.objectContaining({
                    input: {
                        RawMessage: {
                            Data: expect.any(Uint8Array)
                        }
                    }
                })
            );
        });

        it('should send raw email with text content', async () => {
            const options = {
                from: 'sender@example.com',
                to: 'recipient@example.com',
                subject: 'Test',
                text: 'Hello'
            };

            await mailer.sendRawEmail(options);

            expect(mockSend).toHaveBeenCalledWith(
                expect.objectContaining({
                    input: {
                        RawMessage: {
                            Data: expect.any(Uint8Array)
                        }
                    }
                })
            );
        });

        it('should send raw email with attachments', async () => {
            const options = {
                from: 'sender@example.com',
                to: 'recipient@example.com',
                subject: 'Test',
                html: '<h1>Hello</h1>',
                attachments: [{
                    filename: 'test.txt',
                    content: 'Hello World'
                }]
            };

            await mailer.sendRawEmail(options);

            expect(mockSend).toHaveBeenCalledWith(
                expect.objectContaining({
                    input: {
                        RawMessage: {
                            Data: expect.any(Uint8Array)
                        }
                    }
                })
            );
        });

        it('should throw error when no recipients specified', async () => {
            const options = {
                from: 'sender@example.com',
                subject: 'Test',
                html: '<h1>Hello</h1>'
            };

            await expect(mailer.sendRawEmail(options))
                .rejects
                .toThrow('At least one recipient is required');
        });

        it('should throw error when no sender specified', async () => {
            const options = {
                to: 'recipient@example.com',
                subject: 'Test',
                html: '<h1>Hello</h1>'
            };

            await expect(mailer.sendRawEmail(options))
                .rejects
                .toThrow('From address is required');
        });
    });
});