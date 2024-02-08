/**
 * This file is part of the DVMFNE Manager project.
 *
 * (c) 2024 Caleb <ko4uyj@gmail.com>
 *
 * For the full copyright and license information, see the
 * LICENSE file that was distributed with this source code.
 */

class TwilioSmsSender {
    constructor(logger, server) {
        this.logger = logger;
        this.server = server;

        this.twilio = require('twilio');
        this.client = undefined;
    }

    initalize() {
        this.client = this.twilio(this.server.Twilio.accountSid, this.server.Twilio.authToken);
    }

    async sendSms(to, message) {
        if (!this.client) {
            this.logger.error('Twilio sms sender client not initialized', 'TWILIO SMS SENDER');
        }

        try {
            await this.client.messages.create({
                body: message,
                from: this.server.Twilio.fromNumber,
                to: to
            });
        } catch (e) {
            this.logger.error(e, 'TWILIO SMS SENDER');
        }
    }
}

module.exports = TwilioSmsSender;