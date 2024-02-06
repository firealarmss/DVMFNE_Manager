/**
 * This file is part of the fne2 tg manager project.
 *
 * (c) 2024 Caleb <ko4uyj@gmail.com>
 *
 * For the full copyright and license information, see the
 * LICENSE file that was distributed with this source code.
 */

const FneCommunications = require("./FneCommunications");

//This class is temporary until CFNE has a reporter of some sort.

class PeerWatcher {
    constructor(logger, server, dbManager) {
        this.logger = logger;
        this.server = server;
        this.dbManager = dbManager;

        this.currentPeers = [];
        this.fneCommunications = new FneCommunications(server, logger);
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
        }, 5000);

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

        this.dbManager.getPeerInfo(peerId, (err, peerInfo) => {
            if (err) {
                this.logger.error(`Error fetching peer info for ${peerId}: ${err}`, "PEER WATCHER");
                return;
            }

            if (peer && peerInfo) {
                if (peer.connected) {
                    console.log(`Peer ${peerId} (${peerInfo.name}) is connected.`);
                } else {
                    console.log(`Peer ${peerId} (${peerInfo.name}) is disconnected with state: ${peer.connectionState}`);
                }
            } else {
                console.log(`Peer ${peerId} (${peerInfo.name}) not connected or peer information is not available.`);
            }
        });
    }
}

module.exports = PeerWatcher;