/**
 * This file is part of the fne2 tg manager project.
 *
 * (c) 2024 Caleb <ko4uyj@gmail.com>
 *
 * For the full copyright and license information, see the
 * LICENSE file that was distributed with this source code.
 */

const express = require('express');
const VoiceResponse = require('twilio').twiml.VoiceResponse;
const urlencoded = require('body-parser').urlencoded;
const FneCommunications = require('./FneCommunications');

/*const netConnectionStatus = Object.freeze({
    0: { text: "Waiting Connection", icon: "⏳" },
    1: { text: "Waiting Login", icon: "🔑" },
    2: { text: "Waiting Auth", icon: "🔓" },
    3: { text: "Waiting Config", icon: "⚙️" },
    4: { text: "Running", icon: "✅" },
    5: { text: "RPTL Received", icon: "📩" },
    6: { text: "Challenge Sent", icon: "🥊" },
    7: { text: "MST Running", icon: "🚀" },
    0x7FFFFFF: { text: "NET_STAT_INVALID", icon: "❌" }
});*/

class TwilioInboundCallServer {
    constructor(logger, server) {
        this.logger = logger;
        this.server = server;

        this.app = express();

        this.app.use(urlencoded({ extended: false }));

        this.app.post('/voice', (request, response) => {
            const twiml = new VoiceResponse();

            const gather = twiml.gather({
                numDigits: 1,
                action: '/gather',
            });
            gather.say(`Welcome to the ${this.server.name} D.V.M. F.N.E. Manager. For F.N.E. stats, press 1. To repeat this message, press any other key.`);

            twiml.redirect('/voice');

            response.type('text/xml');
            response.send(twiml.toString());
        });

        this.app.post('/gather', async (request, response) => {
            const twiml = new VoiceResponse();

            if (request.body.Digits) {
                switch (request.body.Digits) {
                    case '1':
                        let stats = await this.getStats();
                        twiml.say(stats);
                        break;
                    default:
                        twiml.say("Not a choice idiot!");
                        twiml.pause();
                        twiml.redirect('/voice');
                        break;
                }
            } else {
                twiml.redirect('/voice');
            }

            response.type('text/xml');
            response.send(twiml.toString());
        });

    }

    async getStats() {
        let affiliationCount = 0;
        let fneCommunications = new FneCommunications(this.server, this.logger);
        let peerResponse = await fneCommunications.getFnePeerList();
        let affResponse = await fneCommunications.getFneAffiliationList();

        if (!peerResponse || !affResponse) {
            return `Error getting peer or aff list`;
        }

        affResponse.affiliations.forEach(peer => {
            peer.affiliations.forEach(affiliation => {
                affiliationCount++;
            });
        });

        return `The ${this.server.name} current server statistics are as follows. Current. Peer. Connections. Are: ${peerResponse.peers.length} and the current. affiliated. radios. are: ${affiliationCount}`;
    }

    start() {
        this.app.listen(this.server.Twilio.inboundCallPort, () => {
            this.logger.info(`Twilio Inbound Call Server listening on port ${this.server.Twilio.inboundCallPort}`, 'TWILIO INBOUND CALL');
        });
    }

    stop() {
        /* stub */
    }
}

module.exports = TwilioInboundCallServer;