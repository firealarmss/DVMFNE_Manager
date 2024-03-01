/**
 * This file is part of the DVMFNE Manager project.
 *
 * (c) 2024 Caleb <ko4uyj@gmail.com>
 *
 * For the full copyright and license information, see the
 * LICENSE file that was distributed with this source code.
 */

const https = require('https');

class DiscordWebhook {
    constructor(logger, server) {
        this.logger = logger;
        this.server = server;

        if (!this.server.Discord.Webhook.enabled) {
            this.logger.warn("No discord webhook configuration found", "DISCORD WEBHOOK");
        }
    }

    createPeerAlert(peerInfo, peer){
        return {
            username: `${this.server.name} Peer Watcher`,
            avatar_url: "",
            //content: "DOWN PEER ALERT",
            embeds: [
                {
                    "title": "DOWN PEER ALERT",
                    "color": 15258703,
                    "thumbnail": {
                        "url": "",
                    },
                    "fields": [
                        {
                            "name": `Peer ID: ${peerInfo.peerId}`,
                            "value": `${peerInfo.name} is down`,
                            "inline": true
                        }
                    ]
                }
            ]
        }
    }

    send(message, url){
        const parsedUrl = new URL(url);

        const options = {
            hostname: parsedUrl.hostname,
            port: 443,
            path: parsedUrl.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                if (data) {
                    try {
                        const parsedData = JSON.parse(data);
                        this.logger.debug(parsedData, 'DISCORD WEBHOOK');
                    } catch (e) {
                        this.logger.error('Error parsing JSON response:' + e, 'DISCORD WEBHOOK');
                    }
                } else {
                    this.logger.debug('No response body from discord webhook', 'DISCORD WEBHOOK');
                }
            });
        });

        req.on('error', (e) => {
            this.logger.error(`problem with request: ${e.message}`, 'DISCORD WEBHOOK');
        });

        req.write(JSON.stringify(message));
        req.end();
    }
}

module.exports = DiscordWebhook;