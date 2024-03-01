/**
 * This file is part of the DVMFNE Manager project.
 *
 * (c) 2024 Caleb <ko4uyj@gmail.com>
 *
 * For the full copyright and license information, see the
 * LICENSE file that was distributed with this source code.
 */
const {SocketLabsClient} = require('@socketlabs/email');

class Mailer {
    constructor(logger, server) {
        this.logger = logger;
        this.server = server;

        if (!this.server.Mailer.SocketLabs.enabled) {
            this.logger.error("No mailer configuration found", "MAILER");
            return;
        }

        if (this.server.Mailer.SocketLabs.enabled) {
            this.emailClient = new SocketLabsClient(parseInt(this.server.Mailer.SocketLabs.serverId), this.server.Mailer.SocketLabs.injectionApi);
        }
    }

    async send(subject, body, email){
        let message;

        message = {
            to: email,
            from: this.server.Mailer.fromEmail,
            subject: subject,
            textBody: body,
            htmlBody: body,
            messageType: 'basic'
        }

        this.emailClient.send(message);

        this.logger.debug(`Send email ${subject} and body ${body} to ${email}`, "MAILER");
    }
}

module.exports = Mailer;