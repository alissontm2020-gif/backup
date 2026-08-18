import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, TextChannel } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Apaga todas as mensagens do canal atual.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

export async function execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.channel || !(interaction.channel instanceof TextChannel)) {
        return interaction.reply({ content: '❌ Este comando só pode ser usado em canais de texto.', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
        const channel = interaction.channel;
        let fetched;
        
        do {
            fetched = await channel.messages.fetch({ limit: 100 });
            if (fetched.size > 0) {
                await channel.bulkDelete(fetched, true);
            }
        } while (fetched.size >= 2);

        await interaction.editReply({ content: '✅ Canal limpo com sucesso!' });
    } catch (error) {
        console.error(error);
        await interaction.editReply({ content: '❌ Erro ao tentar limpar as mensagens do canal (mensagens com mais de 14 dias não podem ser apagadas em massa).' });
    }
}