const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, AttachmentBuilder } = require('discord.js');
const CsvHandler = require("../CsvHandler");
const SheetsCommunications = require('../SheetsCommunications');

module.exports = (server, logger) => {

    const sheetsCommunications = new SheetsCommunications(server.Sheets.serviceAccountKeyFile, server.Sheets.sheetId);

    return {

        data: new SlashCommandBuilder()
            .setName('acl_list')
            .setDescription('Returns the ACL list.'),

        async execute(interaction) {
            if (!interaction.member.permissions.has('ADMINISTRATOR')) {
                return interaction.reply({
                    content: 'You do not have the required permissions to use this command.',
                    ephemeral: true
                });
            }

            let csvHandler = new CsvHandler(logger);
            let response = await sheetsCommunications.read(server.Sheets.RidAcl.range, server.Sheets.RidAcl.tab);

            if (!response) {
                return interaction.reply({content: 'Failed to read the data.', ephemeral: true});
            }

            response = response.filter(row => !row[0].includes('#'));
            csvHandler.write(server.RidAclPath, csvHandler.sheetAclToCsv(response).trim());

            const attachment = new AttachmentBuilder(server.RidAclPath);

            interaction.reply({ content: `ACL file:`, files: [attachment] });
        }
    };
};
