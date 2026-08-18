"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName('painel_avisos')
    .setDescription('Cria um painel de avisos ou termos customizado com embed e imagem.');
async function execute(interaction) {
    const modal = new discord_js_1.ModalBuilder()
        .setCustomId('modal_painel_avisos')
        .setTitle('Criar Painel de Avisos');
    const tituloInput = new discord_js_1.TextInputBuilder()
        .setCustomId('aviso_titulo')
        .setLabel('Título do Painel')
        .setPlaceholder('Ex: POLÍTICA DE TROCAS')
        .setStyle(discord_js_1.TextInputStyle.Short)
        .setRequired(true);
    const descricaoInput = new discord_js_1.TextInputBuilder()
        .setCustomId('aviso_descricao')
        .setLabel('Texto / Regras / Avisos')
        .setPlaceholder('Digite as regras ou avisos aqui...')
        .setStyle(discord_js_1.TextInputStyle.Paragraph)
        .setRequired(true);
    const imagemInput = new discord_js_1.TextInputBuilder()
        .setCustomId('aviso_imagem')
        .setLabel('Link da Imagem (Opcional)')
        .setPlaceholder('https://exemplo.com/imagem.png')
        .setStyle(discord_js_1.TextInputStyle.Short)
        .setRequired(false);
    modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(tituloInput), new discord_js_1.ActionRowBuilder().addComponents(descricaoInput), new discord_js_1.ActionRowBuilder().addComponents(imagemInput));
    await interaction.showModal(modal);
}
