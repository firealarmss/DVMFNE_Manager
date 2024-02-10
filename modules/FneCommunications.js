/**
 * This file is part of the DVMFNE Manager project.
 *
 * (c) 2024 Caleb <ko4uyj@gmail.com>
 *
 * For the full copyright and license information, see the
 * LICENSE file that was distributed with this source code.
 */

const { exec } = require('child_process');
const RESTClient = require('./RESTClient');

class FneCommunications {
    constructor(server, logger) {
        this.server = server;
        this.logger = logger;
        this.restClient = new RESTClient(server.Rest.address, server.Rest.port, server.Rest.password, false, this.logger);
    }

    async getRidAcl() {
        try {
            const response = await this.restClient.send('GET', '/rid/query', null);
            if (response.status === 200) {
                return response;
            }
        } catch (error) {
            console.error('Error:', error.message);
        }
    }

    async forceUpdate(){
        try {
            const response = await this.restClient.send('GET', '/force-update', null);
            if (response.status === 200) {
                return response;
            }
        } catch (error) {
            console.error('Error:', error.message);
        }
    }

    async getFneStats() {
        const peerResponse = await this.getFnePeerList();
        const affResponse = await this.getFneAffiliationList();
        const statusResponse = await this.getFneStatus();
        let affiliationCount = 0;
        let affiliationList; //TODO

        if (!peerResponse || !affResponse || !statusResponse) {
            this.logger.error("Error getting peer or aff or status response list");
            return;
        }

        await affResponse.affiliations.forEach(peer => {
            peer.affiliations.forEach(affiliation => {
                affiliationCount++;
            });
        });

        return {fneStatus: statusResponse, affiliationCount: affiliationCount, peerCount: peerResponse.peers.length, peers: peerResponse.peers}
    }

    async getFneAffiliationList(){
        try {
            const response = await this.restClient.send('GET', '/report-affiliations', null);
            if (response.status === 200) {
                return response;
            }
        } catch (error) {
            console.error('Error:', error.message);
        }
    }

    async getFnePeerList(){
        try {
            const response = await this.restClient.send('GET', '/peer/query', null);
            if (response.status === 200) {
                return response;
            }
        } catch (error) {
            console.error('Error:', error.message);
        }
    }

    async getFneStatus() {
        try {
            const response = await this.restClient.send('GET', '/status', null);
            if (response.status === 200) {
                return response;
            }
        } catch (error) {
            console.error('Error:', error.message);
        }
    }

    restartFneService() {
        return new Promise((resolve, reject) => {
            exec('dir', (err, stdout, stderr) => {
                if (err) {
                    console.error(`stderr: ${stderr}`);
                    reject(false);
                } else {
                    //console.log(`stdout: ${stdout}`);
                    resolve(true);
                }
            });
        });
    }

    startFneService() {
        return new Promise((resolve, reject) => {
            exec(this.server.StartCommand, (err, stdout, stderr) => {
                if (err) {
                    console.error(`stderr: ${stderr}`);
                    reject(false);
                } else {
                    //console.log(`stdout: ${stdout}`);
                    resolve(true);
                }
            });
        });
    }

    stopFneService() {
        return new Promise((resolve, reject) => {
            exec(this.server.StopCommand, (err, stdout, stderr) => {
                if (err) {
                    console.error(`stderr: ${stderr}`);
                    reject(false);
                } else {
                    //console.log(`stdout: ${stdout}`);
                    resolve(true);
                }
            });
        });
    }

    getFneServiceStatus() {
        return new Promise((resolve, reject) => {
            exec(this.server.StatusCommand, (err, stdout, stderr) => {
                if (err) {
                    console.error(`stderr: ${stderr}`);
                    reject(false);
                } else {
                    //console.log(`stdout: ${stdout}`);
                    this.commandOutput = stdout;
                    resolve(true);
                }
            });
        });
    }
}

module.exports = FneCommunications;