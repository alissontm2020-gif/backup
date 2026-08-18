import { SlashCommandBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ChatInputCommandInteraction } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('painel_avisos')
    .setDescription('Cria um painel de avisos ou termos customizado com embed e imagem.');

export async function execute(interaction: ChatInputCommandInteraction) {
    const modal = new ModalBuilder()
        .setCustomId('modal_painel_avisos')
        .setTitle('Criar Painel de Avisos');

    const tituloInput = new TextInputBuilder()
        .setCustomId('aviso_titulo')
        .setLabel('Título do Painel')
        .setPlaceholder('Ex: POLÍTICA DE TROCAS')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const descricaoInput = new TextInputBuilder()
        .setCustomId('aviso_descricao')
        .setLabel('Texto / Regras / Avisos')
        .setPlaceholder('Digite as regras ou avisos aqui...')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

    const imagemInput = new TextInputBuilder()
        .setCustomId('aviso_imagem')
        .setLabel('Link da Imagem (Opcional)')
        .setPlaceholder('https://exemplo.com/imagem.png')
        .setStyle(TextInputStyle.Short)
        .setRequired(false);

    modal.addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(tituloInput),
        new ActionRowBuilder<TextInputBuilder>().addComponents(descricaoInput),
        new ActionRowBuilder<TextInputBuilder>().addComponents(imagemInput),
    );

    await interaction.showModal(modal);
}