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

            const embeds = createAffiliationEmbed(response.affiliations);
            await interaction.reply({ embeds: [embeds[0]] });

            for (let i = 1; i < embeds.length; i++) {
                await interaction.channel.send({ embeds: [embeds[i]] });
            }
        }
    };

    function createAffiliationEmbed(affiliations) {
        const embeds = [];
        let embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Peer Affiliations')
            .setDescription(`Showing affiliations for ${affiliations.length} peers.`)
            .setTimestamp();

        let affiliationText = '';
        let affiliationCount = 0;

        affiliations.forEach(peer => {
            peer.affiliations.forEach(affiliation => {
                const newLine = `Peer ID: ${peer.peerId}, DST ID: ${affiliation.dstId}, SRC ID: ${affiliation.srcId}\n`;
                if ((affiliationText.length + newLine.length) > 1024 || affiliationCount >= 25) {
                    embed.addFields({ name: `Affiliations`, value: affiliationText, inline: false });
                    affiliationText = newLine;
                    affiliationCount = 1;

                    if (affiliationCount === 25) {
                        embeds.push(embed);
                        embed = new EmbedBuilder()
                            .setColor('#0099ff')
                            .setTitle('Peer Affiliations (cont\'d)')
                            .setTimestamp();
                        affiliationCount = 0;
                    }
                } else {
                    affiliationText += newLine;
                    affiliationCount++;
                }
            });
        });

        if (affiliationText.length > 0) {
            embed.addFields({ name: `Affiliations`, value: affiliationText, inline: false });
        }

        embeds.push(embed);
        return embeds;
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
