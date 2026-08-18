"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName('produto')
    .setDescription('Cadastra um novo produto no sistema.');
async function execute(interaction) {
    const modal = new discord_js_1.ModalBuilder()
        .setCustomId('modal_criar_produto')
        .setTitle('Cadastrar Novo Produto');
    const nomeInput = new discord_js_1.TextInputBuilder()
        .setCustomId('produto_nome')
        .setLabel('Nome do Produto')
        .setStyle(discord_js_1.TextInputStyle.Short)
        .setRequired(true);
    const precoInput = new discord_js_1.TextInputBuilder()
        .setCustomId('produto_preco')
        .setLabel('Preço (Ex: 10.00 ou 10,00)')
        .setStyle(discord_js_1.TextInputStyle.Short)
        .setRequired(true);
    const estoqueInput = new discord_js_1.TextInputBuilder()
        .setCustomId('produto_estoque')
        .setLabel('Quantidade em Estoque')
        .setStyle(discord_js_1.TextInputStyle.Short)
        .setRequired(true);
    const imagemInput = new discord_js_1.TextInputBuilder()
        .setCustomId('produto_imagem')
        .setLabel('Link da Imagem (Opcional)')
        .setStyle(discord_js_1.TextInputStyle.Short)
        .setRequired(false);
    const descricaoInput = new discord_js_1.TextInputBuilder()
        .setCustomId('produto_descricao')
        .setLabel('Descrição')
        .setStyle(discord_js_1.TextInputStyle.Paragraph)
        .setRequired(false);
    modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(nomeInput), new discord_js_1.ActionRowBuilder().addComponents(precoInput), new discord_js_1.ActionRowBuilder().addComponents(estoqueInput), new discord_js_1.ActionRowBuilder().addComponents(imagemInput), new discord_js_1.ActionRowBuilder().addComponents(descricaoInput));
    await interaction.showModal(modal);
}
