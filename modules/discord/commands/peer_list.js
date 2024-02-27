const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, AttachmentBuilder, EmbedBuilder } = require('discord.js');
const FneCommunications = require('../../fne/FneCommunications');

module.exports = (server, logger) => {
    const MAX_MESSAGE_LENGTH = 2000;

    const fneCommunications = new FneCommunications(server, logger);
    const netConnectionStatus = Object.freeze({
        0: { text: "Waiting Connection", icon: "⏳" },
        1: { text: "Waiting Login", icon: "🔑" },
        2: { text: "Waiting Auth", icon: "🔓" },
        3: { text: "Waiting Config", icon: "⚙️" },
        4: { text: "Running", icon: "✅" },
        5: { text: "RPTL Received", icon: "📩" },
        6: { text: "Challenge Sent", icon: "🥊" },
        7: { text: "MST Running", icon: "🚀" },
        0x7FFFFFF: { text: "NET_STAT_INVALID", icon: "❌" }
    });
    return {

        data: new SlashCommandBuilder()
            .setName('peer_list')
            .setDescription('Returns list of current connected peers')
            .addStringOption(option =>
                option.setName('peerid')
                    .setDescription('The peer ID to get information about (Optional. If not set, returns a list)')
                    .setRequired(false)),


        async execute(interaction) {
            if (!interaction.member.roles.cache.has("944332213133131807")) {
                return interaction.reply({
                    content: 'You do not have the required role to use this command.',
                    ephemeral: true
                });
            }

            let peerId = interaction.options.getString('peerid');
            let response = await fneCommunications.getFnePeerList();

            if (!response) {
                interaction.reply({ content: `Error getting peer list`, files: [] });
                return;
            }
            const generatePeerMessage = (peer) => {
                let connectionState = peer.connectionState;
                let status = netConnectionStatus[connectionState] || netConnectionStatus[0x7FFFFFF];
                return `🔗 Peer ID: ${peer.peerId}, Connection State: ${status.icon} ${status.text}`;
            }

            if (peerId) {
                const peer = response.peers.find(p => p.peerId.toString() === peerId);
                if (peer) {
                    const peerMessage = generatePeerMessage(peer);
                    await interaction.reply({content: `Looking up peerId: ${peerId}\n ${peerMessage}`, files: []});
                } else {
                    await interaction.reply({content: `Peer ID ${peerId} not found.`, ephemeral: true});
                }
            } else {
                const embeds = [];
                let embed = new EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle('Peer List')
                    .setDescription(`Showing current connected peers. Peer count: ${response.peers.length}`)
                    .setTimestamp();

                response.peers.forEach((peer, index) => {
                    let connectionState = peer.connectionState;
                    let status = netConnectionStatus[connectionState] || netConnectionStatus[0x7FFFFFF];
                    const peerInfo = `Connection State: ${status.icon} ${status.text}`;

                    if (index !== 0 && index % 25 === 0) {
                        embeds.push(embed);
                        embed = new EmbedBuilder()
                            .setColor('#0099ff')
                            .setTitle(`Peer List (cont'd)`)
                            .setTimestamp();
                    }
                    embed.addFields({ name: `Peer ID: ${peer.peerId}`, value: peerInfo, inline: true });
                });

                embeds.push(embed);

                await interaction.reply({ embeds: [embeds[0]] });

                const channel = interaction.channel;
                for (let i = 1; i < embeds.length; i++) {
                    await channel.send({ embeds: [embeds[i]] });
                }
            }
        }
    };
};
