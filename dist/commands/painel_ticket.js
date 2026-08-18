"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName('painel_ticket')
    .setDescription('Cria o painel de atendimento da Kora Shop.');
async function execute(interaction) {
    const modal = new discord_js_1.ModalBuilder()
        .setCustomId('modal_painel_ticket')
        .setTitle('Painel de Atendimento - Kora Shop');
    const imagemInput = new discord_js_1.TextInputBuilder()
        .setCustomId('ticket_imagem')
        .setLabel('Link da Imagem do Banner')
        .setPlaceholder('https://exemplo.com/banner.png')
        .setStyle(discord_js_1.TextInputStyle.Short)
        .setRequired(true);
    modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(imagemInput));
    await interaction.showModal(modal);
}
