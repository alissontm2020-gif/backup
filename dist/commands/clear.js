"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName('clear')
    .setDescription('Apaga todas as mensagens do canal atual.')
    .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ManageMessages);
async function execute(interaction) {
    if (!interaction.channel || !(interaction.channel instanceof discord_js_1.TextChannel)) {
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
    }
    catch (error) {
        console.error(error);
        await interaction.editReply({ content: '❌ Erro ao tentar limpar as mensagens do canal (mensagens com mais de 14 dias não podem ser apagadas em massa).' });
    }
}
