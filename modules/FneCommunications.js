/**
 * This file is part of the fne2 tg manager project.
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
        this.restClient = new RESTClient(server.RestAddress, server.RestPort, server.RestPassword, this.logger);
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