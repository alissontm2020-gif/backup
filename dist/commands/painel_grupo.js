"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName('painel_grupo')
    .setDescription('Cria um painel interativo de grupos através de um formulário.');
async function execute(interaction) {
    // Cria a janela modal
    const modal = new discord_js_1.ModalBuilder()
        .setCustomId('modal_painel_grupo')
        .setTitle('Criar Painel de Produtos');
    // Pergunta o Título
    const tituloInput = new discord_js_1.TextInputBuilder()
        .setCustomId('grupo_titulo')
        .setLabel('Título do Painel')
        .setStyle(discord_js_1.TextInputStyle.Short)
        .setRequired(true);
    // Pergunta a Descrição (Permite quebras de linha)
    const descricaoInput = new discord_js_1.TextInputBuilder()
        .setCustomId('grupo_descricao')
        .setLabel('Descrição do Painel')
        .setStyle(discord_js_1.TextInputStyle.Paragraph)
        .setRequired(true);
    // Pergunta os IDs (1,2,3)
    const idsInput = new discord_js_1.TextInputBuilder()
        .setCustomId('grupo_ids')
        .setLabel('IDs dos Produtos (ex: 1, 2, 3)')
        .setStyle(discord_js_1.TextInputStyle.Short)
        .setRequired(true);
    // Adiciona os inputs ao Modal
    modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(tituloInput), new discord_js_1.ActionRowBuilder().addComponents(descricaoInput), new discord_js_1.ActionRowBuilder().addComponents(idsInput));
    // Mostra o Modal para o usuário
    await interaction.showModal(modal);
}
