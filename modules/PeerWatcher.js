/**
 * This file is part of the fne2 tg manager project.
 *
 * (c) 2024 Caleb <ko4uyj@gmail.com>
 *
 * For the full copyright and license information, see the
 * LICENSE file that was distributed with this source code.
 */

const FneCommunications = require("./FneCommunications");
const Mailer = require("./Mailer");
const DiscordWebhook = require("./DiscordWebhook");

// Many parts of this class is temporary until CFNE has a reporter of some sort.

class PeerWatcher {
    constructor(logger, server, dbManager) {
        this.logger = logger;
        this.server = server;
        this.dbManager = dbManager;

        this.currentPeers = [];
        this.lastKnownPeerStates = {};
        this.fneCommunications = new FneCommunications(server, logger);

        if (this.server.Mailer.enabled) {
            this.mailer = new Mailer(logger, server);
        }

        if (this.server.Discord.Webhook.enabled) {
            this.discordWebhook = new DiscordWebhook(logger, server);
        }
        this.intervalId = undefined;
    }

    start() {
        this.logger.info("Starting Peer Watcher", "PEER WATCHER");

        this.intervalId = setInterval(async () => {
            await this.getPeerList();

            this.dbManager.getAllPeerInfos((err, peerInfos) => {
                if (err) {
                    this.logger.error("Error fetching peer info from the database", "PEER WATCHER");
                    return;
                }

                this.monitorPeerIds = peerInfos.reduce((acc, peerInfo) => {
                    acc[peerInfo.peerId] = peerInfo;
                    return acc;
                }, {});

                Object.keys(this.monitorPeerIds).forEach(async (peerId) => {
                    await this.checkPeerStatus(parseInt(peerId));
                });
            });
        }, this.server.PeerWatcher.interval * 1000 * 60);

        this.logger.info("Started Peer Watcher", "PEER WATCHER");
    }

    stop(){
        this.logger.info("Stopping Peer Watcher", "PEER WATCHER");
        clearInterval(this.intervalId);
        this.logger.info("Stopped Peer Watcher", "PEER WATCHER");
    }

    async getPeerList(){
        await this.fneCommunications.getFnePeerList().then((response) => {
            if (!response) {
                this.logger.error("Error getting peer list", "PEER WATCHER");
                return;
            }
            this.currentPeers = response.peers;
            //console.log(this.currentPeers);
        });
    }

    async checkPeerStatus(peerId) {
        const peer = this.currentPeers.find(p => p.peerId === peerId);

        this.dbManager.getPeerInfo(peerId, async (err, peerInfo) => {
            if (err) {
                this.logger.error(`Error fetching peer info for ${peerId}: ${err}`, "PEER WATCHER");
                return;
            }

            let newState;
            if (peer && peerInfo) {
                newState = peer.connected ? 1 : 0;
                if (peer.connected) {
                    this.logger.dbug(`Peer ${peerId} (${peerInfo.name}) is connected.`, "PEER WATCHER");
                }
            } else {
                newState = 0;
            }

            if (this.lastKnownPeerStates[peerId] === 1 && newState === 0) {
                await this.sendAlert(peerInfo, peer, newState === 1 ? "connected" : "disconnected");
            }

            this.lastKnownPeerStates[peerId] = newState;

            this.dbManager.changePeerConnectionState(peerId, newState, (err) => {
                if (err) {
                    this.logger.error(`Error updating connection state for ${peerId}: ${err}`, "PEER WATCHER");
                } else {
                    this.logger.dbug(`Updated connection state for ${peerId} to ${newState}`, "PEER WATCHER");
                }
            });
        });
    }

    async sendAlert(peerInfo, peer, type) {
        if (this.server.Mailer.enabled) {
            if (peer) {
                this.logger.info(`Peer ${peerInfo.peerId} (${peerInfo.name}) is disconnected with state: ${peer.connectionState}`, "PEER WATCHER");
                await this.mailer.send(`${this.server.name} DOWN PEER ALERT`, `Peer ${peerInfo.name} is ${type} with state: ${peer.connectionState}`, peerInfo.email);
            } else {
                this.logger.info(`Peer ${peerInfo.peerId} (${peerInfo.name}) not connected or peer information is not available.`, "PEER WATCHER");
                await this.mailer.send(`${this.server.name} DOWN PEER ALERT`, `Peer ${peerInfo.name} is ${type}`, peerInfo.email);
            }
        }

        if (this.server.Discord.Webhook.enabled){
            const message = this.discordWebhook.createPeerAlert(peerInfo, peer);
            this.discordWebhook.send(message, peerInfo.discordWebhookUrl);
        }
    }
}

module.exports = PeerWatcher;