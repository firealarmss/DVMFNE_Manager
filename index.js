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
const TgManagerServer = require('./modules/web/ManagerServer');
const Logger = require('./modules/Logger');
const AutoAcl = require('./modules/fne/AutoAcl');
const DiscordBot = require('./modules/discord/DiscordBot');
const DbManager = require("./modules/DbManager");
const TwilioInboundMessageServer = require('./modules/twilio/TwilioInboundMessageServer');
const TelegramBot = require('./modules/telegram/TelegramBot');
const TwilioInboundCallServer = require('./modules/twilio/TwilioInboundCallServer');

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
    servers: undefined
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

    console.log(`DVMFNE Manager\n\ndebug: ${config.debug}\nLog Path: ${LogPath}\nLoaded: ${config.servers.length} servers\n`);

    config.servers.forEach((server) => {
        let logger = new Logger(config.debug, server.name, config.LogPath, 0);
        let dbManager = new DbManager("./db/users.db", logger);
        let app = new  TgManagerServer(server, config, dbManager, logger);
        let autoAcl = new AutoAcl(logger, server);
        let twilioInboundMessageServer = new TwilioInboundMessageServer(logger, server);
        let telegramBot = new TelegramBot(logger, server);
        let twilioInboundCallServer = new TwilioInboundCallServer(logger, server);

        if (config.debug) {
            logger.dbug("debug server params");
            console.log(`Enabled: ${server.Sheets.enabled}\nSheet ID: ${server.Sheets.sheetId}\nSheets JSON File: ${server.Sheets.serviceAccountKeyFile}`)
        }

        if (server.type === "FNE2"){
            logger.warn("FNE2 is no longer supported!", "CONFIG LOADER");
        }

        app.start();

        if (server.Twilio && server.Twilio.enabled && server.Twilio.inbound) {
            twilioInboundMessageServer.start();
        } else {
            logger.info("Twilio Inbound Message Server is disabled", "CONFIG LOADER");
        }

        if (server.Twilio && server.Twilio.enabled && server.Twilio.inboundCall) {
            twilioInboundCallServer.start();
        } else {
            logger.info("Twilio Inbound Call Server is disabled", "CONFIG LOADER");
        }

        if (server.Discord && server.Discord.enabled) {
            new DiscordBot(logger, server);
        } else {
            logger.info("Discord Bot is disabled", "CONFIG LOADER");
        }

        if (server.Telegram && server.Telegram.enabled) {
            telegramBot.start();
        } else {
            logger.info("Telegram Bot is disabled", "CONFIG LOADER");
        }

        if (server.autoAclInterval && server.autoAclInterval > 0) {
            autoAcl.start();
        } else {
            logger.info("AutoAcl is disabled", "CONFIG LOADER");
        }
    });
} else {
    console.error('No config file specified');
    process.exit(1);
}