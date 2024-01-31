/**
 * This file is part of the fne2 tg manager project.
 *
 * (c) 2024 Caleb <ko4uyj@gmail.com>
 *
 * For the full copyright and license information, see the
 * LICENSE file that was distributed with this source code.
 */

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const TgRulesHandler = require('./TgRulesHandler.js');

class TgManagerServer {
    constructor(config) {
        config.ServerPort = undefined;

        this.config = config;
        this.app = express();

        this.port = config.ServerPort || 3000;
        this.name = config.name;
        this.ServerBindAddress = config.ServerBindAddress || "0.0.0.0";
        this.RulePath = config.RulePath;

        this.app.set('view engine', 'ejs');
        this.app.set('views', path.join(__dirname, '..', 'views'));

        this.app.use(express.json());
        this.app.use(bodyParser.json());

        this.app.use(bodyParser.urlencoded({ extended: false }));

        this.app.get('/', (req, res) => {
            let tgRulesHandler = new TgRulesHandler(this.RulePath);
            tgRulesHandler.read();
            //console.log(JSON.stringify(tgRulesHandler.rules));

            res.render('index', {
                rules: tgRulesHandler.rules,
                name: this.name
            });
        });

        this.app.post('/writeTgRuleChanges', (req, res) => {
            let rules = req.body;
            let tgRulesHandler = new TgRulesHandler(this.RulePath);

            tgRulesHandler.write(rules);

            //  console.log(JSON.stringify(rules))
            res.sendStatus(200);
        });
    }

    start() {
        this.app.listen(this.port, this.ServerBindAddress, () => {
            console.log(`${this.name} TG Manager Server started on port ${this.port}`);
        });
    }
}

module.exports = TgManagerServer;