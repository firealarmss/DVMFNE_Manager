const { Client, Collection, GatewayIntentBits, Events, REST, Routes } = require('discord.js');
const path = require('path');
const fs = require('fs');

class DiscordBot {
    constructor(logger, server) {
        this.logger = logger;
        this.server = server;

        this.client = new Client({ intents: [GatewayIntentBits.Guilds] });

        this.initializeCommands().then(r => ()=>{
            this.logger.info("Commands initialized");
        })
            .catch(e => {
                this.logger.error("Error initializing commands: " + e);
            });
        this.registerEventHandlers();

        this.client.login(this.server.Discord.token).then(r => ()=>{});
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
