import { Client, GatewayIntentBits, REST, Routes, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, TextChannel, PermissionFlagsBits, ChannelType, Interaction } from 'discord.js';
import dotenv from 'dotenv';
import { ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import axios from 'axios';

import * as painelCommand from './commands/painel';
import * as produtoCommand from './commands/produto';
import * as painelGrupoCommand from './commands/painel_grupo';
import * as lockCommand from './commands/lock';
import * as painelAvisosCommand from './commands/painel_avisos';
import * as painelTicketCommand from './commands/painel_ticket';

dotenv.config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers 
    ],
});
const db = require('./db');

const commands = [
    painelCommand.data?.toJSON(),
    produtoCommand.data?.toJSON(),
    painelGrupoCommand.data?.toJSON(),
    lockCommand.data?.toJSON(),
    painelAvisosCommand.data?.toJSON(),
    painelTicketCommand.data?.toJSON()
].filter(Boolean);

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);

(async () => {
    try {
        console.log('Registrando comandos...');
        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID!, process.env.GUILD_ID!),
            { body: commands }
        );
        console.log('Comandos registrados!');
    } catch (error) {
        console.error(error);
    }
})();

const transacoesProdutos = new Map<string, { itensDescricao: string; precoCentavos: number; userId: string; username: string }>();

async function concluirVendaESolicitarLog(interaction: any, transactionId: string) {
    const dados = transacoesProdutos.get(transactionId);

    if (!dados) {
        return interaction.editReply({ content: '❌ Dados da transação expirados ou não encontrados.' });
    }

    const clientRoleId = process.env.CLIENT_ROLE_ID;
    if (clientRoleId && interaction.guild) {
        try {
            const member = await interaction.guild.members.fetch(dados.userId);
            if (member && !member.roles.cache.has(clientRoleId)) {
                await member.roles.add(clientRoleId);
            }
        } catch (err) {
            console.error('Erro ao atribuir cargo de cliente ao usuário:', err);
        }
    }

    try {
        const compradorUser = await client.users.fetch(dados.userId);
        if (compradorUser) {
            const dmEmbed = new EmbedBuilder()
                .setColor(0x2B2D31)
                .setTitle('Obrigado pela compra! 🛍️❤️')
                .setDescription('Para receber seu produto, deixe um feedback no canal de feedbacks e, em seguida, abra um ticket para solicitar o envio.\nAgradecemos pela confiança e pela compra! 🚀')
                .setTimestamp();

            const feedbackLink = process.env.FEEDBACK_CHANNEL_LINK || 'https://discord.com';
            const ticketLink = process.env.TICKET_CHANNEL_LINK || 'https://discord.com';

            const rowBotoes = new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                    .setLabel('Feedback 💖')
                    .setStyle(ButtonStyle.Link)
                    .setURL(feedbackLink),
                new ButtonBuilder()
                    .setLabel('Receber Compra 🎟️')
                    .setStyle(ButtonStyle.Link)
                    .setURL(ticketLink)
            );

            await compradorUser.send({ embeds: [dmEmbed], components: [rowBotoes] }).catch(() => {});
        }
    } catch (err) {
        console.error('Erro ao enviar mensagem na DM do comprador:', err);
    }

    await interaction.editReply({ 
        content: `✅ **Pagamento confirmado com sucesso!** Este canal será fechado automaticamente em **30 segundos**.`,
        components: [] 
    });

    const logChannelId = process.env.LOG_CHANNEL_ID;
    if (logChannelId) {
        const logChannel = client.channels.cache.get(logChannelId) as TextChannel;
        
        if (logChannel) {
            const precoFormatado = (dados.precoCentavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            const meuId = process.env.MEU_DISCORD_ID;
            const mencaoAdmin = meuId ? `<@${meuId}>` : '';

            const logEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('🛍️ Venda Concluída!')
                .setDescription(`O usuário **${dados.username}** teve seu pagamento aprovado! 💸`)
                .addFields(
                    { name: 'Itens do Carrinho', value: dados.itensDescricao, inline: false },
                    { name: 'Valor Total Pago', value: `\`${precoFormatado}\``, inline: false }
                )
                .setFooter({ text: 'Kora Shop • Sistema Automático' })
                .setTimestamp();

            await logChannel.send({
                content: mencaoAdmin,
                embeds: [logEmbed]
            });
        }
    }

    transacoesProdutos.delete(transactionId);

    const canalCarrinho = interaction.channel;
    if (canalCarrinho && 'delete' in canalCarrinho) {
        setTimeout(async () => {
            try {
                await (canalCarrinho as TextChannel).delete();
            } catch (e) {
                console.error('Erro ao deletar o canal de carrinho após 30s:', e);
            }
        }, 30000);
    }
}

client.on('guildMemberAdd', async (member) => {
    const roleId = process.env.AUTO_ROLE_ID;
    if (!roleId) return;
    try { await member.roles.add(roleId); } catch (error) { console.error(error); }
});

client.on('interactionCreate', async (interaction: any) => {
    // === COMANDOS DE CHAT ===
    if (interaction.isChatInputCommand()) {
        try {
            if (interaction.commandName === 'painel') await painelCommand.execute(interaction);
            if (interaction.commandName === 'produto') await produtoCommand.execute(interaction);
            if (interaction.commandName === 'painel_grupo') await painelGrupoCommand.execute(interaction);
            if (interaction.commandName === 'lock') await lockCommand.execute(interaction);
            if (interaction.commandName === 'painel_avisos') await painelAvisosCommand.execute(interaction);
            
            if (interaction.commandName === 'painel_ticket') {
                const imagemFixaUrl = 'https://cdn.discordapp.com/attachments/1526981076545835063/1539054004229906442/content.png?ex=6a84eb3c&is=6a8399bc&hm=456aab6b9fcb88734bcd51443681871c95657e4bda8daf82634470cc9c1a206c&';

                const ticketEmbed = new EmbedBuilder()
                    .setColor(0x2B2D31)
                    .setTitle('Atendimento Kora Shop 🚀')
                    .setDescription(
                        'Após solicitar um atendimento, aguarde um integrante da equipe responde-lo(a). O atendimento é realizado de forma privada, contudo, somente integrantes da equipe terá acesso ao atendimento. Tenha ciência que a nossa equipe não se encontra presente 24 horas por dia.\n\n' +
                        '💬 **Dúvidas:** Para tirar dúvidas gerais.\n' +
                        '📦 **Receber Compra:** Para solicitar a entrega (Exige envio prévio de feedback).'
                    );

                if (imagemFixaUrl && imagemFixaUrl.startsWith('http')) {
                    ticketEmbed.setImage(imagemFixaUrl);
                }

                const rowBotoes = new ActionRowBuilder<ButtonBuilder>().addComponents(
                    new ButtonBuilder()
                        .setCustomId('ticket_duvida')
                        .setLabel('Dúvidas')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('💬'),
                    new ButtonBuilder()
                        .setCustomId('ticket_receber')
                        .setLabel('Receber Compra')
                        .setStyle(ButtonStyle.Success)
                        .setEmoji('📦')
                );

                if (interaction.channel && 'send' in interaction.channel) {
                    await interaction.channel.send({
                        embeds: [ticketEmbed],
                        components: [rowBotoes]
                    });
                }

                await interaction.reply({ content: '✅ Painel de atendimento criado com sucesso!', ephemeral: true });
            }
        } catch (error) {
            console.error(`Erro ao executar o comando ${interaction.commandName}:`, error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: '❌ Ocorreu um erro ao executar este comando.', ephemeral: true }).catch(() => {});
            }
        }
    }

    // === MODAL: PAINEL GRUPO ===
    if (interaction.isModalSubmit()) {
        if (interaction.customId === 'modal_painel_grupo') { 
            const titulo = interaction.fields.getTextInputValue('grupo_titulo');
            const descricao = interaction.fields.getTextInputValue('grupo_descricao');
            const idsString = interaction.fields.getTextInputValue('grupo_ids');
            
            const idsArray = idsString.split(',').map((id: string) => parseInt(id.trim())).filter(Boolean);

            if (idsArray.length === 0) {
                return interaction.reply({ content: '❌ Nenhum ID válido fornecido.', ephemeral: true });
            }
        } 
    }

    // === MODAL: CRIAR PRODUTO ===
    if (interaction.isModalSubmit()) {
        if (interaction.customId === 'modal_criar_produto') {
            const nome = interaction.fields.getTextInputValue('produto_nome');
            const precoString = interaction.fields.getTextInputValue('produto_preco');
            const estoqueStr = interaction.fields.getTextInputValue('produto_estoque');
            const imagem = interaction.fields.getTextInputValue('produto_imagem');
            const descricao = interaction.fields.getTextInputValue('produto_descricao');

            const precoLimpo = precoString.replace(',', '.');
            const precoParsed = parseFloat(precoLimpo);
            const precoCentavos = isNaN(precoParsed) ? 0 : Math.round(precoParsed * 100);
            const estoque = parseInt(estoqueStr) || 0;

            try {
                const [result]: any = await db.query(
                    'INSERT INTO Produto (nome, descricao, preco, estoque, imagemUrl) VALUES (?, ?, ?, ?, ?)',
                    [nome, descricao, precoCentavos, estoque, imagem || null]
                );

                await interaction.reply({ 
                    content: `✅ Produto **${nome}** (ID: \`${result.insertId}\`) cadastrado com sucesso!`, 
                    ephemeral: true 
                });
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: '❌ Erro ao salvar o produto.', ephemeral: true });
            }
        }
    }

    // === MENU SELECIONADO: COMPRAR GRUPO ===
    if (interaction.isStringSelectMenu()) {
        if (interaction.customId === 'menu_comprar_grupo') {
            const selectedValue = interaction.values[0]; 
            
            if (selectedValue.startsWith('pre_carrinho_')) {
                const produtoId = parseInt(selectedValue.replace('pre_carrinho_', ''));

                try {
                    const [rows]: any = await db.query('SELECT * FROM Produto WHERE id = ?', [produtoId]);
                    const produto = rows[0];
                    if (!produto) return interaction.reply({ content: '❌ Produto não encontrado.', ephemeral: true });

                    const precoFormatado = (produto.preco / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

                    const btnRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
                        new ButtonBuilder()
                            .setCustomId(`comprar_${produto.id}`)
                            .setLabel(`Adicionar ao Carrinho (${precoFormatado})`)
                            .setStyle(ButtonStyle.Success)
                            .setEmoji('🛒')
                    );

                    await interaction.reply({
                        content: `📦 Você selecionou **${produto.nome}**.\nClique no botão abaixo para adicionar ao seu carrinho unificado.`,
                        components: [btnRow],
                        ephemeral: true 
                    });
                } catch (error) {
                    console.error(error);
                    await interaction.reply({ content: '❌ Erro ao processar sua seleção.', ephemeral: true });
                }
            }
        }
    }

    // === BOTÕES ===
    if (interaction.isButton()) {
        if (interaction.customId === 'close_ticket') {
            await interaction.reply({ content: '🔒 Fechando este ticket em 3 segundos...' });
            setTimeout(async () => {
                try {
                    await (interaction.channel as TextChannel).delete();
                } catch (e) { console.error('Erro ao deletar canal:', e); }
            }, 3000);
        }

        if (interaction.customId.startsWith('comprar_')) {
            const produtoId = parseInt(interaction.customId.split('_')[1]);
            const userId = interaction.user.id;
            const qtd = 1; 
            await interaction.deferReply({ ephemeral: true });

            try {
                const [rows]: any = await db.query('SELECT * FROM Produto WHERE id = ?', [produtoId]);
                const produto = rows[0];
                if (!produto) {
                    return interaction.editReply({ content: '❌ Produto não encontrado no sistema.' });
                }
                if (produto.estoque <= 0) {
                    return interaction.editReply({ content: '❌ Este produto está esgotado no momento.' });
                }

                const guild = interaction.guild;
                if (!guild) {
                    return interaction.editReply({ content: '❌ Erro ao identificar o servidor.' });
                }

                await db.query(`
                    INSERT INTO CartItem (userId, produtoId, quantidade) 
                    VALUES (?, ?, ?) 
                    ON DUPLICATE KEY UPDATE quantidade = quantidade + ?`, 
                    [userId, produtoId, qtd, qtd]
                );

                const [itensCarrinho]: any = await db.query(`
                    SELECT CartItem.*, 
                    Produto.id as produto_id, 
                    Produto.nome as produto_nome, 
                    Produto.descricao as produto_descricao, 
                    Produto.preco as produto_preco, 
                    Produto.estoque as produto_estoque, 
                    Produto.imagemUrl as produto_imagemUrl
                    FROM CartItem
                    JOIN Produto ON CartItem.produtoId = Produto.id
                    WHERE CartItem.userId = ?
                `, [userId]);

                let valorTotalCentavos = 0;
                const camposEmbedItens: string[] = [];

                itensCarrinho.forEach((item: any) => {
                    const subtotal = item.produto_preco * item.quantidade;
                    valorTotalCentavos += subtotal;
                    const subtotalFormatado = (subtotal / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                    camposEmbedItens.push(`\`${item.quantidade}x\` **${item.produto_nome}** — Subtotal: \`${subtotalFormatado}\``);
                });

                const valorTotalFormatado = (valorTotalCentavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                const channelName = `carrinho-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '') || `carrinho-${interaction.user.id}`;
                
                await guild.channels.fetch();
                let ticketChannel = guild.channels.cache.find((c: any) => c.name === channelName && c.type === ChannelType.GuildText) as TextChannel;

                const carrinhoEmbed = new EmbedBuilder()
                    .setColor(0x2B2D31)
                    .setTitle('🛒 Seu Carrinho Consolidado - Kora Shop')
                    .setDescription(`Olá <@${interaction.user.id}>! Aqui estão todos os produtos adicionados ao seu carrinho atual:`)
                    .addFields(
                        { name: '📦 Itens Selecionados', value: camposEmbedItens.join('\n'), inline: false },
                        { name: '💰 Valor Total Acumulado', value: `\`${valorTotalFormatado}\``, inline: false }
                    )
                    .setFooter({ text: 'Kora Shop • Carrinho Inteligente' })
                    .setTimestamp();

                const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`finalizar_pagamento_geral`)
                        .setLabel(`💳 Gerar Pix (${valorTotalFormatado})`)
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId(`cancelar_carrinho`)
                        .setLabel('❌ Cancelar / Fechar')
                        .setStyle(ButtonStyle.Danger)  
                );

                if (!ticketChannel) {
                    const categoryId = process.env.CATEGORY_TICKET_ID || null;
                    const permissionOverwrites: any = [
                        { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
                        { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
                    ];

                    if (process.env.OWNER_ROLE_ID) {
                        permissionOverwrites.push({
                            id: process.env.OWNER_ROLE_ID,
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
                        });
                    }

                    ticketChannel = await guild.channels.create({
                        name: channelName,
                        type: ChannelType.GuildText,
                        parent: categoryId ? categoryId : undefined,
                        permissionOverwrites: permissionOverwrites,
                    });

                    await ticketChannel.send({
                        content: `<@${interaction.user.id}>, seu canal exclusivo de carrinho foi criado aqui: ${ticketChannel}`,
                        embeds: [carrinhoEmbed],
                        components: [row]
                    });
                } else {
                    const mensagens = await ticketChannel.messages.fetch({ limit: 10 });
                    const ultimaMensagemBot = mensagens.find((m: any) => m.author.id === interaction.client.user?.id && m.components.length > 0);
                    
                    if (ultimaMensagemBot) {
                        const rowDesativada = new ActionRowBuilder<ButtonBuilder>().addComponents(
                            new ButtonBuilder()
                                .setCustomId('expirado')
                                .setLabel('🔄 Carrinho Atualizado acima')
                                .setStyle(ButtonStyle.Secondary)
                                .setDisabled(true)
                        );
                        await ultimaMensagemBot.edit({ components: [rowDesativada] }).catch(() => {});
                    }

                    await ticketChannel.send({
                        content: `<@${interaction.user.id}>, seu carrinho foi atualizado com um novo item!`,
                        embeds: [carrinhoEmbed],
                        components: [row]
                    });
                }

                await interaction.editReply({ content: `✅ Item adicionado ao carrinho! Acesse aqui: ${ticketChannel}` });

            } catch (error) {
                console.error('Erro detalhado ao atualizar carrinho:', error);
                await interaction.editReply({ content: '❌ Erro ao atualizar o carrinho.' });
            }
        }
    }
}); 

client.once('ready', async () => {
    console.log(`[SUCESSO] Bot conectado como ${client.user?.tag}!`);

    const roleId = process.env.AUTO_ROLE_ID;
    if (roleId) {
        for (const [, guild] of client.guilds.cache) {
            try {
                const members = await guild.members.fetch();
                for (const [, member] of members) {
                    if (!member.user.bot && !member.roles.cache.has(roleId)) {
                        await member.roles.add(roleId).catch(() => {});
                    }
                }
            } catch (err) {
                console.error(`[ERRO] Falha ao buscar membros do servidor ${guild.name}:`, err);
            }
        }
    }
});

client.login(process.env.DISCORD_TOKEN);