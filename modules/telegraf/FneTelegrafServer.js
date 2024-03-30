/**
 * This file is part of the DVMFNE Manager project.
 *
 * (c) 2024 Caleb <ko4uyj@gmail.com>
 *
 * For the full copyright and license information, see the
 * LICENSE file that was distributed with this source code.
 */

const express = require('express');
const bodyParser = require('body-parser');

class FneTelegrafServer {
    constructor(port, bindAddress, io, debug, logger) {
        this.port = port || 3000;
        this.bindAddress = bindAddress || "0.0.0.0";
        this.io = io;
        this.debug = debug;
        this.logger = logger;

        if (!this.io) {
            this.logger.error("Socket IO not provided. Killing myself.", "TELEGRAF SERVER");
            process.exit(1);
        }

        this.app = express();

        this.setupMiddleware();
        this.setupRoutes();
    }

    setupMiddleware() {
        this.app.use(bodyParser.json());
    }

    setupRoutes() {
        this.app.post('/receive-data', (req, res) => {
            req.body.metrics.forEach(metric => {
                if (this.debug) {
                    console.log('-----------------------');
                    console.log(`Event Name: ${metric.name}`);
                    console.log(`Timestamp: ${metric.timestamp}`);
                    console.log('Fields:', metric.fields);
                    console.log('Tags:', metric.tags);
                    console.log('-----------------------');
                }

                this.io.emit('callEvent', metric);
            });
            res.status(200).send('received');
        });
    }

    start() {
        this.app.listen(this.port, () => {
            this.logger.info(`Started Telegraf on port ${this.port}`, "TELEGRAF SERVER");
        });
    }
}

module.exports = FneTelegrafServer;