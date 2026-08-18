import { SlashCommandBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ChatInputCommandInteraction } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('painel_grupo')
    .setDescription('Cria um painel interativo de grupos através de um formulário.');

export async function execute(interaction: ChatInputCommandInteraction) {
    // Cria a janela modal
    const modal = new ModalBuilder()
        .setCustomId('modal_painel_grupo')
        .setTitle('Criar Painel de Produtos');

    // Pergunta o Título
    const tituloInput = new TextInputBuilder()
        .setCustomId('grupo_titulo')
        .setLabel('Título do Painel')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    // Pergunta a Descrição (Permite quebras de linha)
    const descricaoInput = new TextInputBuilder()
        .setCustomId('grupo_descricao')
        .setLabel('Descrição do Painel')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

    // Pergunta os IDs (1,2,3)
    const idsInput = new TextInputBuilder()
        .setCustomId('grupo_ids')
        .setLabel('IDs dos Produtos (ex: 1, 2, 3)')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    // Adiciona os inputs ao Modal
    modal.addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(tituloInput),
        new ActionRowBuilder<TextInputBuilder>().addComponents(descricaoInput),
        new ActionRowBuilder<TextInputBuilder>().addComponents(idsInput)
    );

    // Mostra o Modal para o usuário
    await interaction.showModal(modal);
}