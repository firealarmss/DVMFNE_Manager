/**
 * This file is part of the fne2 tg manager project.
 *
 * (c) 2024 Caleb <ko4uyj@gmail.com>
 *
 * For the full copyright and license information, see the
 * LICENSE file that was distributed with this source code.
 */

//This method is temporary until CFNE has a reporter of some sort.

class PeerWatcher {
    constructor(logger, server) {
        this.logger = logger;
        this.server = server;
    }

    start(){
        this.logger.info("Started Peer Watcher", "PEER WATCHER");
    }
}

module.exports = PeerWatcher;