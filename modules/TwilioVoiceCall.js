/**
 * This file is part of the fne2 tg manager project.
 *
 * (c) 2024 Caleb <ko4uyj@gmail.com>
 *
 * For the full copyright and license information, see the
 * LICENSE file that was distributed with this source code.
 */

class TwilioVoiceCall {
    constructor(logger, server) {
        this.logger = logger;
        this.server = server;
        this.client = undefined;
    }

    initialize() {
        this.logger.info('Starting Twilio Outbound Voice Call', 'TWILIO VOICE');

        this.client = require('twilio')(this.server.Twilio.accountSid, this.server.Twilio.authToken);
    }

    async makeVoiceCall(to, message) {
        if (!this.client) {
            this.logger.error('Twilio client not initialized', 'TWILIO VOICE');
            return;
        }

        this.logger.info(`Making voice call to ${to}`, 'TWILIO VOICE');
        this.client.calls
            .create({
                twiml: `<Response><Say>${message}</Say></Response>`,
                to: to,
                from: this.server.Twilio.fromNumber
            })
            .then(call => this.logger.info(`Call SID: ${call.sid}`, 'TWILIO VOICE'));
    }
}

module.exports = TwilioVoiceCall;