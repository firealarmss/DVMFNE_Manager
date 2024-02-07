/**
 * This file is part of the fne2 tg manager project.
 *
 * (c) 2024 Caleb <ko4uyj@gmail.com>
 *
 * For the full copyright and license information, see the
 * LICENSE file that was distributed with this source code.
 */

const TelegramBot = require('node-telegram-bot-api');
const FneCommunications = require('./FneCommunications');
const {EmbedBuilder} = require("discord.js");

const netConnectionStatus = Object.freeze({
    0: { text: "Waiting Connection", icon: "⏳" },
    1: { text: "Waiting Login", icon: "🔑" },
    2: { text: "Waiting Auth", icon: "🔓" },
    3: { text: "Waiting Config", icon: "⚙️" },
    4: { text: "Running", icon: "✅" },
    5: { text: "RPTL Received", icon: "📩" },
    6: { text: "Challenge Sent", icon: "🥊" },
    7: { text: "MST Running", icon: "🚀" },
    0x7FFFFFF: { text: "NET_STAT_INVALID", icon: "❌" }
});

class TelegramBotManager {
    constructor(logger, server) {
        this.logger = logger;
        this.server = server;

        this.bot = undefined;
    }

    generatePeerMessage (peer) {
        let connectionState = peer.connectionState;
        let status = netConnectionStatus[connectionState] || netConnectionStatus[0x7FFFFFF];
        return `🔗 Peer ID: ${peer.peerId}, Connection State: ${status.icon} ${status.text}\n`;
    }

    start() {
        this.logger.info('Starting Telegram Bot', 'TELEGRAM BOT');

        this.bot = new TelegramBot(this.server.Telegram.token, { polling: true });
        let affiliationCount = 0;

        this.bot.on('message', async (msg) => {
            const chatId = msg.chat.id;
            const messageText = msg.text;

            if (messageText === '/start') {
                this.bot.sendMessage(chatId, `Welcome to the ${this.server.name} Telegram Bot`)
                    .then(r => {})
                    .catch(e => {
                        this.logger.error(e, 'TELEGRAM BOT');
                    });
            } else if (messageText === '/stats') {
                let fneCommunications = new FneCommunications(this.server, this.logger);
                let peerResponse = await fneCommunications.getFnePeerList();
                let affResponse = await fneCommunications.getFneAffiliationList();

                if (!peerResponse || !affResponse) {
                    this.bot.sendMessage(chatId, `Error getting peer or aff list`)
                        .then(r => {
                        })
                        .catch(e => {
                            this.logger.error(e, 'TELEGRAM BOT');
                        });
                    return;
                }

                affResponse.affiliations.forEach(peer => {
                    peer.affiliations.forEach(affiliation => {
                        affiliationCount++;
                    });
                });

                this.bot.sendMessage(chatId, `${this.server.name} Stats:\n\n Peers: ${peerResponse.peers.length}\nAffiliations: ${affiliationCount}`)
                    .then(r => {
                    })
                    .catch(e => {
                        this.logger.error(e, 'TELEGRAM BOT');
                    });
            } else if (messageText === '/peer_list') {
                let fneCommunications = new FneCommunications(this.server, this.logger);
                let peerResponse = await fneCommunications.getFnePeerList();
                let peerMessage = "";

                if (!peerResponse) {
                    this.bot.sendMessage(chatId, `Error getting peer list`)
                        .then(r => {
                        })
                        .catch(e => {
                            this.logger.error(e, 'TELEGRAM BOT');
                        });
                    return;
                }

                await peerResponse.peers.forEach((peer, index) => {
                    peerMessage += this.generatePeerMessage(peer);
                });

                this.bot.sendMessage(chatId, `${this.server.name} Peer List:\n\n${peerMessage}`)
                    .then(r => {
                    })
                    .catch(e => {
                        this.logger.error(e, 'TELEGRAM BOT');
                    });
            } else if (messageText === '/affiliations') {
                let fneCommunications = new FneCommunications(this.server, this.logger);
                let affResponse = await fneCommunications.getFneAffiliationList();
                let affMessage = "";
                let affiliationCount = 0;

                affResponse.affiliations.forEach(peer => {
                    peer.affiliations.forEach(affiliation => {
                        affMessage += `Peer ID: ${peer.peerId}, DST ID: ${affiliation.dstId}, SRC ID: ${affiliation.srcId}\n`;
                        affiliationCount++;
                    });
                });

                this.bot.sendMessage(chatId, `${this.server.name} Affiliations: (${affiliationCount})\n\n${affMessage}`)
                    .then(r => {})
                    .catch(e => {
                        this.logger.error(e, 'TELEGRAM BOT');
                    });
            } else if (messageText === '/help') {
                this.bot.sendMessage(chatId, `Available commands:\n\n/stats - Get current stats\n/peer_list - Get current peer list\n/affiliations - View current affiliations
                 \n/help - Show this message`)
                    .then(r => {})
                    .catch(e => {
                        this.logger.error(e, 'TELEGRAM BOT');
                    });
            } else {
                this.bot.sendMessage(chatId, `Command not found`)
                    .then(r => {})
                    .catch(e => {
                        this.logger.error(e, 'TELEGRAM BOT');
                    });
            }
        });
        this.logger.info('Telegram Bot started', 'TELEGRAM BOT')
    }
}

module.exports = TelegramBotManager;