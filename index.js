/**
 * This file is part of the fne2 tg manager project.
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

    config.servers.forEach((server) => {
        let logger = new Logger(config.debug, server.name, config.LogPath, 0);
        let app = new  TgManagerServer(server, config, logger);

        app.start();
    });

} else {
    console.error('No config file specified');
    process.exit(1);
}