/**
 * This file is part of the fne2 tg manager project.
 *
 * (c) 2024 Caleb <ko4uyj@gmail.com>
 *
 * For the full copyright and license information, see the
 * LICENSE file that was distributed with this source code.
 */

const express = require('express');
const bodyParser = require('body-parser');
const { MessagingResponse } = require('twilio').twiml;
const FneCommunications = require('./FneCommunications');

class TwilioInboundMessageServer {
    constructor(logger, server) {
        this.logger = logger;
        this.server = server;

        this.app = express();
        this.app.use(bodyParser.urlencoded({ extended: false }));

        let fneCommunications = new FneCommunications(this.server, this.logger);

        this.app.post('/', async (req, res) => {
            const twiml = new MessagingResponse();
            let affiliationCount = 0;

            if (req.body.Body === 'STATS') {
                let peerResponse = await fneCommunications.getFnePeerList();
                let affResponse = await fneCommunications.getFneAffiliationList();

                affResponse.affiliations.forEach(peer => {
                    peer.affiliations.forEach(affiliation => {
                        affiliationCount++;
                    });
                });

                if (!peerResponse || !affResponse) {
                    twiml.message("Error getting peer or aff list");
                    return;
                }

                twiml.message(`${this.server.name} Current Stats:\n\nPeers: ${peerResponse.peers.length}\nAffiliations: ${affiliationCount}`);
            } else {
                twiml.message('Command not found');
            }
            res.type('text/xml').send(twiml.toString());
        });
    }

    start() {
        this.app.listen(this.server.Twilio.serverPort, () => {
            this.logger.info('Inbound Twilio Server started on: ' + this.server.Twilio.serverPort, 'TWILIO SERVER');
        });
    }
}

module.exports = TwilioInboundMessageServer;