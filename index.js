/**
 * This file is part of the DVMFNE Manager project.
 *
 * (c) 2024 Caleb <ko4uyj@gmail.com>
 *
 * For the full copyright and license information, see the
 * LICENSE file that was distributed with this source code.
 */

const yargs = require('yargs');
const fs = require('fs');
const yaml = require('js-yaml');
const TgManagerServer = require('./modules/ManagerServer');
const Logger = require('./modules/Logger');
const AutoAcl = require('./modules/AutoAcl');
const DiscordBot = require('./modules/DiscordBot');
const PeerWatcher = require('./modules/PeerWatcher');
const DbManager = require("./modules/DbManager");
const TwilioInboundMessageServer = require('./modules/TwilioInboundMessageServer');
const TelegramBot = require('./modules/TelegramBot');
const TwilioInboundCallServer = require('./modules/TwilioInboundCallServer');

const argv = yargs

    .option('c', {
        alias: 'config',
        describe: 'Path to config file',
        type: 'string',
    })
    .help()
    .alias('help', 'h')
    .argv;

let config = {
    Servers: undefined
};

if (argv.config) {
    try {
        const configFileContents = fs.readFileSync(argv.config, 'utf8');
        config = yaml.load(configFileContents);
    } catch (e) {
        console.error("Error reading config file: \n" + e);
        process.exit(1);
    }

    let LogPath = config.LogPath || "Disabled";

    console.log(`DVMFNE Manager\n\nDebug: ${config.Debug}\nLog Path: ${LogPath}\nLoaded: ${config.Servers.length} servers\n`);

    config.Servers.forEach((server) => {
        let logger = new Logger(config.Debug, server.name, config.LogPath, 0);
        let dbManager = new DbManager("./db/users.db", logger);
        let app = new  TgManagerServer(server, config, dbManager, logger);
        let autoAcl = new AutoAcl(logger, server);
        let peerWatcher = new PeerWatcher(logger, server, dbManager);
        let twilioInboundMessageServer = new TwilioInboundMessageServer(logger, server);
        let telegramBot = new TelegramBot(logger, server);
        let twilioInboundCallServer = new TwilioInboundCallServer(logger, server);

        if (server.type === "FNE2"){
            logger.warn("FNE2 is no longer supported!", "CONFIG LOADER");
        }

        app.start();

        if (server.Twilio && server.Twilio.enabled && server.Twilio.inbound) {
            twilioInboundMessageServer.start();
        }

        if (server.Twilio && server.Twilio.enabled && server.Twilio.inboundCall) {
            twilioInboundCallServer.start();
        }

        if (server.PeerWatcher && server.PeerWatcher.enabled) {
            peerWatcher.start();
        }

        if (server.Discord.enabled) {
            new DiscordBot(logger, server);
        }

        if (server.Telegram && server.Telegram.enabled) {
            telegramBot.start();
        }

        if (server.AutoAclInterval && server.AutoAclInterval > 0) {
            autoAcl.start();
        }
    });
} else {
    console.error('No config file specified');
    process.exit(1);
}