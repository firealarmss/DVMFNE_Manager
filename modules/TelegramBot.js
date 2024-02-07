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

class TelegramBotManager {
    constructor(logger, server) {
        this.logger = logger;
        this.server = server;

        this.bot = undefined;
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
                        .then(r => {})
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