import { jest } from '@jest/globals';
import SESMailer from '../src/main.js';

// Mock AWS SES client
const mockSend = jest.fn();
const mockClient = {
    send: mockSend
};

// Mock nodemailer
jest.mock('nodemailer', () => ({
    createTransport: jest.fn().mockReturnValue({
        sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' })
    })
}));

describe('SESMailer', () => {
    let mailer;

    beforeEach(() => {
        mailer = new SESMailer(mockClient);
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        test('should create instance with client', () => {
            expect(mailer).toBeInstanceOf(SESMailer);
            expect(mailer.client).toBe(mockClient);
        });
    });

    describe('setDefaultSender', () => {
        test('should set default sender', () => {
            const email = 'test@example.com';
            mailer.setDefaultSender(email);
            expect(mailer.defaultFrom).toBe(email);
        });
    });

    describe('sendTemplate', () => {
        test('should send template email without attachments', async () => {
            mockSend.mockResolvedValueOnce({ MessageId: 'test-id' });

            await mailer.sendTemplate({
                from: 'sender@test.com',
                to: 'recipient@test.com',
                subject: 'Test',
                templateName: 'TestTemplate',
                templateData: { name: 'John' }
            });

            expect(mockSend).toHaveBeenCalledTimes(1);
            expect(mockSend.mock.calls[0][0].input).toMatchObject({
                Source: 'sender@test.com',
                Template: 'TestTemplate'
            });
        });

        test('should throw error if no recipient', async () => {
            await expect(mailer.sendTemplate({
                from: 'sender@test.com',
                subject: 'Test'
            })).rejects.toThrow('At least one recipient is required');
        });
    });

    describe('sendRawEmail', () => {
        test('should send raw email', async () => {
            const options = {
                from: 'sender@test.com',
                to: 'recipient@test.com',
                subject: 'Test',
                html: '<p>Test</p>'
            };

            await mailer.sendRawEmail(options);

            expect(mailer.transporter.sendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    from: options.from,
                    to: options.to,
                    subject: options.subject,
                    html: options.html
                })
            );
        });
    });
});
