"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName('lock')
    .setDescription('Tranca o canal atual para os membros.');
async function execute(interaction) {
    if (!interaction.channel || !('permissionOverwrites' in interaction.channel)) {
        return interaction.reply({ content: '❌ Este comando só pode ser usado em canais de texto.', ephemeral: true });
    }
    try {
        const everyoneRole = interaction.guild.roles.everyone;
        await interaction.channel.permissionOverwrites.edit(everyoneRole, { SendMessages: false });
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(0xE74C3C)
            .setTitle('🔒 Canal Trancado')
            .setDescription('Este canal foi temporariamente trancado pela administração.')
            .setTimestamp();
        const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId('unlock_channel')
            .setLabel('🔓 Destrancar Canal')
            .setStyle(discord_js_1.ButtonStyle.Success));
        await interaction.reply({ embeds: [embed], components: [row] });
    }
    catch (error) {
        console.error(error);
        await interaction.reply({ content: '❌ Erro ao trancar o canal.', ephemeral: true });
    }
}
