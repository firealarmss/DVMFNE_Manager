const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

class TgManagerServer {
    constructor(config) {
        this.config = config;
        this.app = express();

        this.port = config.ServerPort || 3000;
        this.name = config.name;
        this.ServerBindAddress = config.ServerBindAddress || "0.0.0.0";

        this.app.set('view engine', 'ejs');
        this.app.set('views', path.join(__dirname, '..', 'views'));

        this.app.use(express.json());
        this.app.use(bodyParser.urlencoded({ extended: false }));

        this.app.get('/', (req, res) => {
            res.render('index', {

            });
        });
    }

    start() {
        this.app.listen(this.port, this.ServerBindAddress, () => {
            console.log(`${this.name} TG Manager Server started on port ${this.port}`);
        });
    }
}

module.exports = TgManagerServer;