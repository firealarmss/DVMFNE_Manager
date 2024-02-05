const { Client, Collection, GatewayIntentBits, Events, REST, Routes } = require('discord.js');
const path = require('path');
const fs = require('fs');
const FneCommunications = require('./FneCommunications');

class DiscordBot {
    constructor(logger, server) {
        this.logger = logger;
        this.server = server;

        this.client = new Client({ intents: [GatewayIntentBits.Guilds] });

        this.fneCommunications = new FneCommunications(server, logger);

        this.initializeCommands().then(r => ()=>{
            this.logger.info("Commands initialized");
        })
            .catch(e => {
                this.logger.error("Error initializing commands: " + e);
            });
        this.registerEventHandlers();

        this.client.login(this.server.Discord.token).then(r => ()=>{});

        if (this.server.Discord.channelNameStats.enabled) {
            this.initializeChannelNameEditors();
        }
    }

    async initializeCommands() {
        this.client.commands = new Collection();
        const commandsPath = path.join(__dirname, 'commands');
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            const command = require(filePath)(this.server, this.logger);
            this.client.commands.set(command.data.name, command);
        }
    }

    registerEventHandlers() {
        this.client.once(Events.ClientReady, async () => {
            this.logger.info(`${this.client.user.tag} bot connect`, "DISCORD BOT");
            await this.registerCommands();
        });

        this.client.on(Events.InteractionCreate, async interaction => {
            if (!interaction.isChatInputCommand()) return;

            const command = this.client.commands.get(interaction.commandName);

            if (!command) return;

            try {
                await command.execute(interaction);
            } catch (error) {
                this.logger.error(error, "DISCORD BOT");
                await interaction.reply({ content: 'There was an error with that command', ephemeral: true });
            }
        });
    }

    initializeChannelNameEditors() {
        this.setupChannelNameEditor(
            this.server.Discord.channelNameStats.affiliationChannelId,
            this.updateAffiliationCountChannelName,
            this.server.Discord.channelNameStats.affiliationInterval * 1000 * 60
        ).then(r => {});
        this.setupChannelNameEditor(
            this.server.Discord.channelNameStats.peerChannelId,
            this.updatePeerCountChannelName,
            this.server.Discord.channelNameStats.peerInterval * 1000 * 60
        ).then(r => {});
    }

    async setupChannelNameEditor(channelId, updateFunction, updateInterval) {
        setInterval(async () => {
            try {
                const channel = await this.client.channels.fetch(channelId);
                if (!channel) {
                    this.logger.error(`Channel with ID ${channelId} does not exist`, "DISCORD BOT");
                    return;
                }

                await updateFunction.call(this, channel);
            } catch (error) {
                this.logger.error(error, "Error in channel name editor", "DISCORD BOT");
            }
        }, updateInterval);
    }

    async updateAffiliationCountChannelName(channel) {
        let response = await this.fneCommunications.getFneAffiliationList();
        if (!response) {
            this.logger.error('Failed to get affiliation list', "DISCORD BOT");
            return;
        }

        const affiliationCount = response.affiliations.reduce((count, peer) => count + peer.affiliations.length, 0);
        const newChannelName = `Affiliations: ${affiliationCount}`;
        await this.updateChannelName(channel, newChannelName);
    }

    async updatePeerCountChannelName(channel) {
        let response = await this.fneCommunications.getFnePeerList();
        if (!response) {
            this.logger.error('Failed to get peer list', "DISCORD BOT");
            return;
        }

        const newChannelName = `Peers: ${response.peers.length}`;
        await this.updateChannelName(channel, newChannelName);
    }

    async updateChannelName(channel, newChannelName) {
        if (channel.name !== newChannelName) {
            await channel.setName(newChannelName);
            this.logger.info(`Updated channel name to ${newChannelName}`, "DISCORD BOT");
        } else {
            this.logger.info("Channel already has the desired name");
        }
    }

    async registerCommands() {
        const commands = [];
        const commandsPath = path.join(__dirname, 'commands');
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            const command = require(filePath)(this.server, this.logger).data.toJSON();
            commands.push(command);
        }

        const rest = new REST({ version: '10' }).setToken(this.server.Discord.token);

        try {
            this.logger.info('Started refreshing application commands', "DISCORD BOT");

            await rest.put(
                Routes.applicationGuildCommands(this.server.Discord.clientId, this.server.Discord.guildId),
                { body: commands },
            );

            this.logger.info('Successfully reloaded application commands', "DISCORD BOT");
        } catch (error) {
            console.error(error);
        }
    }
}

module.exports = DiscordBot;
