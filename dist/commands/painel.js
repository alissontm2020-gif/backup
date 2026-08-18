"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName('painel')
    .setDescription('Envia o painel interativo de produtos da loja.')
    .addIntegerOption(option => option.setName('id')
    .setDescription('ID de um produto específico (opcional)')
    .setRequired(false));
async function execute(interaction) {
    try {
        const idProduto = interaction.options.getInteger('id');
        // SE O USUÁRIO PASSOU UM ID ESPECÍFICO
        if (idProduto) {
            const produto = await prisma.produto.findUnique({ where: { id: idProduto } });
            if (!produto) {
                return interaction.reply({ content: `❌ Nenhum produto encontrado com o ID **${idProduto}**.`, ephemeral: true });
            }
            const precoFormatado = (produto.preco / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(0x2B2D31)
                .setTitle(`🛒 ${produto.nome}`)
                .setDescription(produto.descricao || `Adquira agora o produto **${produto.nome}** por **${precoFormatado}**.`)
                .setTimestamp();
            // Adiciona a imagem se houver no banco de dados
            if (produto.imagemUrl) {
                embed.setImage(produto.imagemUrl);
            }
            const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
                .setCustomId(`comprar_${produto.id}`)
                .setLabel(`Comprar (${precoFormatado})`)
                .setStyle(discord_js_1.ButtonStyle.Success));
            if (interaction.channel && 'send' in interaction.channel) {
                await interaction.channel.send({
                    embeds: [embed],
                    components: [row]
                });
            }
            return interaction.reply({ content: `✅ Painel do produto **${produto.nome}** enviado com sucesso!`, ephemeral: true });
        }
        // SE NÃO PASSOU ID (COMPORTAMENTO PADRÃO - ENVIA TODOS OS PRODUTOS)
        const produtos = await prisma.produto.findMany();
        if (produtos.length === 0) {
            return interaction.reply({ content: '❌ Não há produtos cadastrados no sistema para exibir no painel.', ephemeral: true });
        }
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(0x2B2D31)
            .setTitle('🛒 Painel de Vendas')
            .setDescription('Selecione abaixo o produto que deseja adquirir:')
            .setTimestamp();
        const rows = [];
        let currentRow = new discord_js_1.ActionRowBuilder();
        produtos.forEach((produto, index) => {
            const precoFormatado = (produto.preco / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            currentRow.addComponents(new discord_js_1.ButtonBuilder()
                .setCustomId(`comprar_${produto.id}`)
                .setLabel(`${produto.nome} (${precoFormatado})`)
                .setStyle(discord_js_1.ButtonStyle.Success));
            if (currentRow.components.length === 5 || index === produtos.length - 1) {
                rows.push(currentRow);
                currentRow = new discord_js_1.ActionRowBuilder();
            }
        });
        if (interaction.channel && 'send' in interaction.channel) {
            await interaction.channel.send({
                embeds: [embed],
                components: rows
            });
        }
        await interaction.reply({ content: '✅ Painel de vendas geral enviado com sucesso neste canal!', ephemeral: true });
    }
    catch (error) {
        console.error(error);
        await interaction.reply({ content: '❌ Erro ao gerar o painel de vendas.', ephemeral: true });
    }
}
