/**
 * This file is part of the fne2 tg manager project.
 *
 * (c) 2024 Caleb <ko4uyj@gmail.com>
 *
 * For the full copyright and license information, see the
 * LICENSE file that was distributed with this source code.
 */

class Mailer {
    constructor(logger, server) {
        this.logger = logger;
        this.server = server;
    }

    send(subject, body, email){
        this.logger.info(`Send email ${subject} and body ${body} to ${email}`);
    }
}

module.exports = Mailer;