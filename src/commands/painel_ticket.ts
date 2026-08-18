import { SlashCommandBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ChatInputCommandInteraction } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('painel_ticket')
    .setDescription('Cria o painel de atendimento da Kora Shop.');

export async function execute(interaction: ChatInputCommandInteraction) {
    const modal = new ModalBuilder()
        .setCustomId('modal_painel_ticket')
        .setTitle('Painel de Atendimento - Kora Shop');

    const imagemInput = new TextInputBuilder()
        .setCustomId('ticket_imagem')
        .setLabel('Link da Imagem do Banner')
        .setPlaceholder('https://exemplo.com/banner.png')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    modal.addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(imagemInput),
    );

    await interaction.showModal(modal);
}