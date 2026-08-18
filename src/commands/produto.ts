import { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ChatInputCommandInteraction } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('produto')
    .setDescription('Cadastra um novo produto no sistema.');

export async function execute(interaction: ChatInputCommandInteraction) {
    const modal = new ModalBuilder()
        .setCustomId('modal_criar_produto')
        .setTitle('Cadastrar Novo Produto');

    const nomeInput = new TextInputBuilder()
        .setCustomId('produto_nome')
        .setLabel('Nome do Produto')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const precoInput = new TextInputBuilder()
        .setCustomId('produto_preco')
        .setLabel('Preço (Ex: 10.00 ou 10,00)')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const estoqueInput = new TextInputBuilder()
        .setCustomId('produto_estoque')
        .setLabel('Quantidade em Estoque')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const imagemInput = new TextInputBuilder()
        .setCustomId('produto_imagem')
        .setLabel('Link da Imagem (Opcional)')
        .setStyle(TextInputStyle.Short)
        .setRequired(false);

    const descricaoInput = new TextInputBuilder()
        .setCustomId('produto_descricao')
        .setLabel('Descrição')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false);

    modal.addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(nomeInput),
        new ActionRowBuilder<TextInputBuilder>().addComponents(precoInput),
        new ActionRowBuilder<TextInputBuilder>().addComponents(estoqueInput),
        new ActionRowBuilder<TextInputBuilder>().addComponents(imagemInput),
        new ActionRowBuilder<TextInputBuilder>().addComponents(descricaoInput),
    );

    await interaction.showModal(modal);
}