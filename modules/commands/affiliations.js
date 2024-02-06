const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, AttachmentBuilder, EmbedBuilder } = require('discord.js');
const FneCommunications = require('../FneCommunications');

module.exports = (server, logger) => {
    const MAX_MESSAGE_LENGTH = 2000;

    const fneCommunications = new FneCommunications(server, logger);

    return {

        data: new SlashCommandBuilder()
            .setName('affiliations')
            .setDescription('Returns list of current affs'),


        async execute(interaction) {
            if (!interaction.member.roles.cache.has("944332213133131807")) {
                return interaction.reply({
                    content: 'You do not have the required role to use this command.',
                    ephemeral: true
                });
            }

            let response = await fneCommunications.getFneAffiliationList();

            if (!response || !response.affiliations) {
                interaction.reply({ content: `Error getting aff list`, files: [] });
                return;
            }

            const embed = createAffiliationEmbed(response.affiliations);
            interaction.reply({ embeds: [embed] });
        }
    };

    function createAffiliationEmbed(affiliations) {
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Peer Affiliations')
            .setDescription(`Showing affiliations for ${affiliations.length} peers.`)
            .setTimestamp();

        let fieldsToAdd = [];

        affiliations.forEach(peer => {
            if (fieldsToAdd.length < 25) {
                let fieldValue = '';
                peer.affiliations.forEach(affiliation => {
                    const line = `DST ID: ${affiliation.dstId}, SRC ID: ${affiliation.srcId}\n`;
                    if (fieldValue.length + line.length < 1024) {
                        fieldValue += line;
                    }
                });

                if (fieldValue === '') {
                    fieldValue = 'No affiliations';
                }

                fieldsToAdd.push({ name: `Peer ID: ${peer.peerId}`, value: fieldValue, inline: false });
            }
        });

        if (fieldsToAdd.length > 0) {
            embed.addFields(fieldsToAdd);
        }

        return embed;
    }

    // Old method for sending affiliations as a message. Keeping around for now
    function formatAffiliations(affiliations) {
        let message = '';
        let count = 0;

        affiliations.forEach(peer => {
            message += `Peer ID: ${peer.peerId}\nAffiliations: ${peer.affiliations.length}\n`;
            count += peer.affiliations.length;
            peer.affiliations.forEach(affiliation => {
                message += ` - DST ID: ${affiliation.dstId}, SRC ID: ${affiliation.srcId}\n`;
            });
            message += '\n';
        });

        const summary = `Total Affiliations: ${count} | Peer Count: ${affiliations.length}\n\n`;

        message = summary + message;

        return message;
    }

};
