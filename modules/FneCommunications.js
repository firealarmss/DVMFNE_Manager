/**
 * This file is part of the fne2 tg manager project.
 *
 * (c) 2024 Caleb <ko4uyj@gmail.com>
 *
 * For the full copyright and license information, see the
 * LICENSE file that was distributed with this source code.
 */

const { exec } = require('child_process');

class FneCommunications {
    constructor(server) {
        this.server = server;

    }

    /*
        This Entire file could change and be much better if FNE2 had a REST api to do this. This is the only way i can come up with
     */
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