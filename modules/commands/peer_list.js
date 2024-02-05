const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, AttachmentBuilder } = require('discord.js');
const FneCommunications = require('../FneCommunications');

module.exports = (server, logger) => {
    const MAX_MESSAGE_LENGTH = 2000;

    const fneCommunications = new FneCommunications(server, logger);
    const netConnectionStatus = Object.freeze({
        0: { text: "Waiting Connection", icon: "⏳" },
        1: { text: "Waiting Login", icon: "🔑" },
        2: { text: "Waiting Auth", icon: "🔓" }, // Changed to unlock symbol
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
                let currentMessage = '';
                const messagesToSend = [];

                response.peers.forEach(peer => {
                    const peerMessage = generatePeerMessage(peer);

                    if ((currentMessage.length + peerMessage.length + 1) > MAX_MESSAGE_LENGTH) {
                        messagesToSend.push(currentMessage);
                        currentMessage = peerMessage;
                    } else {
                        currentMessage += (currentMessage.length > 0 ? '\n' : '') + peerMessage;
                    }
                });

                if (currentMessage.length > 0) {
                    messagesToSend.push(currentMessage);
                }

                if (messagesToSend.length > 0) {
                    const channel = interaction.channel;
                    await interaction.reply('Sending Peer list. Peer count: ' + response.peers.length);
                    await channel.send({content: messagesToSend[0], files: []});

                    for (let i = 1; i < messagesToSend.length; i++) {
                        await channel.send({content: messagesToSend[i], files: []});
                    }
                } else {
                    await interaction.reply({content: "No peers to display.", ephemeral: true});
                }
            }
        }
    };
};
