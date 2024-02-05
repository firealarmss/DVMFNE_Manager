const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, AttachmentBuilder } = require('discord.js');
const FneCommunications = require('../FneCommunications');

module.exports = (server, logger) => {

    const fneCommunications = new FneCommunications(server, logger);

    return {

        data: new SlashCommandBuilder()
            .setName('peer_count')
            .setDescription('Returns count of current connected peers'),

        async execute(interaction) {
            if (!interaction.member.permissions.has('ADMINISTRATOR')) {
                return interaction.reply({
                    content: 'You do not have the required permissions to use this command.',
                    ephemeral: true
                });
            }

            let response = await fneCommunications.getFnePeerList();
            if (!response) {
                interaction.reply({ content: `Error getting peer list`, files: [] });
                return;
            }

            interaction.reply({ content: `Current connected peer count: ${response.peers.length}`, files: [] });
        }
    };
};
