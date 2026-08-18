import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('lock')
    .setDescription('Tranca o canal atual para os membros.');

export async function execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.channel || !('permissionOverwrites' in interaction.channel)) {
        return interaction.reply({ content: '❌ Este comando só pode ser usado em canais de texto.', ephemeral: true });
    }

    try {
        const everyoneRole = interaction.guild!.roles.everyone;
        await interaction.channel.permissionOverwrites.edit(everyoneRole, { SendMessages: false });

        const embed = new EmbedBuilder()
            .setColor(0xE74C3C)
            .setTitle('🔒 Canal Trancado')
            .setDescription('Este canal foi temporariamente trancado pela administração.')
            .setTimestamp();

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId('unlock_channel')
                .setLabel('🔓 Destrancar Canal')
                .setStyle(ButtonStyle.Success)
        );

        await interaction.reply({ embeds: [embed], components: [row] });
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: '❌ Erro ao trancar o canal.', ephemeral: true });
    }
}