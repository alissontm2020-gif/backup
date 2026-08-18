"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const dotenv_1 = __importDefault(require("dotenv"));
const axios_1 = __importDefault(require("axios"));
const client_1 = require("@prisma/client");
const painelCommand = __importStar(require("./commands/painel"));
const produtoCommand = __importStar(require("./commands/produto"));
const painelGrupoCommand = __importStar(require("./commands/painel_grupo"));
const lockCommand = __importStar(require("./commands/lock"));
const painelAvisosCommand = __importStar(require("./commands/painel_avisos"));
const painelTicketCommand = __importStar(require("./commands/painel_ticket"));
dotenv_1.default.config();
const client = new discord_js_1.Client({
    intents: [
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.GuildMessages,
        discord_js_1.GatewayIntentBits.MessageContent,
        discord_js_1.GatewayIntentBits.GuildMembers
    ],
});
const prisma = new client_1.PrismaClient();
const commands = [
    painelCommand.data?.toJSON(),
    produtoCommand.data?.toJSON(),
    painelGrupoCommand.data?.toJSON(),
    lockCommand.data?.toJSON(),
    painelAvisosCommand.data?.toJSON(),
    painelTicketCommand.data?.toJSON()
].filter(Boolean);
const rest = new discord_js_1.REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
(async () => {
    try {
        console.log('Registrando comandos...');
        await rest.put(discord_js_1.Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: commands });
        console.log('Comandos registrados!');
    }
    catch (error) {
        console.error(error);
    }
})();
const transacoesProdutos = new Map();
async function concluirVendaESolicitarLog(interaction, transactionId) {
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
        }
        catch (err) {
            console.error('Erro ao atribuir cargo de cliente ao usuário:', err);
        }
    }
    try {
        const compradorUser = await client.users.fetch(dados.userId);
        if (compradorUser) {
            const dmEmbed = new discord_js_1.EmbedBuilder()
                .setColor(0x2B2D31)
                .setTitle('Obrigado pela compra! 🛍️❤️')
                .setDescription('Para receber seu produto, deixe um feedback no canal de feedbacks e, em seguida, abra um ticket para solicitar o envio.\nAgradecemos pela confiança e pela compra! 🚀')
                .setTimestamp();
            const feedbackLink = process.env.FEEDBACK_CHANNEL_LINK || 'https://discord.com';
            const ticketLink = process.env.TICKET_CHANNEL_LINK || 'https://discord.com';
            const rowBotoes = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
                .setLabel('Feedback 💖')
                .setStyle(discord_js_1.ButtonStyle.Link)
                .setURL(feedbackLink), new discord_js_1.ButtonBuilder()
                .setLabel('Receber Compra 🎟️')
                .setStyle(discord_js_1.ButtonStyle.Link)
                .setURL(ticketLink));
            await compradorUser.send({ embeds: [dmEmbed], components: [rowBotoes] }).catch(() => { });
        }
    }
    catch (err) {
        console.error('Erro ao enviar mensagem na DM do comprador:', err);
    }
    await interaction.editReply({
        content: `✅ **Pagamento confirmado com sucesso!** Este canal será fechado automaticamente em **30 segundos**.`,
        components: []
    });
    const logChannelId = process.env.LOG_CHANNEL_ID;
    if (logChannelId) {
        const logChannel = client.channels.cache.get(logChannelId);
        if (logChannel) {
            const precoFormatado = (dados.precoCentavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            const meuId = process.env.MEU_DISCORD_ID;
            const mencaoAdmin = meuId ? `<@${meuId}>` : '';
            const logEmbed = new discord_js_1.EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('🛍️ Venda Concluída!')
                .setDescription(`O usuário **${dados.username}** teve seu pagamento aprovado! 💸`)
                .addFields({ name: 'Itens do Carrinho', value: dados.itensDescricao, inline: false }, { name: 'Valor Total Pago', value: `\`${precoFormatado}\``, inline: false })
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
                await canalCarrinho.delete();
            }
            catch (e) {
                console.error('Erro ao deletar o canal de carrinho após 30s:', e);
            }
        }, 30000);
    }
}
client.on('guildMemberAdd', async (member) => {
    const roleId = process.env.AUTO_ROLE_ID;
    if (!roleId)
        return;
    try {
        await member.roles.add(roleId);
    }
    catch (error) {
        console.error(error);
    }
});
client.on('interactionCreate', async (interaction) => {
    if (interaction.isChatInputCommand()) {
        try {
            if (interaction.commandName === 'painel')
                await painelCommand.execute(interaction);
            if (interaction.commandName === 'produto')
                await produtoCommand.execute(interaction);
            if (interaction.commandName === 'painel_grupo')
                await painelGrupoCommand.execute(interaction);
            if (interaction.commandName === 'lock')
                await lockCommand.execute(interaction);
            if (interaction.commandName === 'painel_avisos')
                await painelAvisosCommand.execute(interaction);
            if (interaction.commandName === 'painel_ticket') {
                const imagemFixaUrl = 'https://cdn.discordapp.com/attachments/1526981076545835063/1539054004229906442/content.png?ex=6a84eb3c&is=6a8399bc&hm=456aab6b9fcb88734bcd51443681871c95657e4bda8daf82634470cc9c1a206c&';
                const ticketEmbed = new discord_js_1.EmbedBuilder()
                    .setColor(0x2B2D31)
                    .setTitle('Atendimento Kora Shop 🚀')
                    .setDescription('Após solicitar um atendimento, aguarde um integrante da equipe responde-lo(a). O atendimento é realizado de forma privada, contudo, somente integrantes da equipe terá acesso ao atendimento. Tenha ciência que a nossa equipe não se encontra presente 24 horas por dia.\n\n' +
                    '💬 **Dúvidas:** Para tirar dúvidas gerais.\n' +
                    '📦 **Receber Compra:** Para solicitar a entrega (Exige envio prévio de feedback).');
                if (imagemFixaUrl && imagemFixaUrl.startsWith('http')) {
                    ticketEmbed.setImage(imagemFixaUrl);
                }
                const rowBotoes = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
                    .setCustomId('ticket_duvida')
                    .setLabel('Dúvidas')
                    .setStyle(discord_js_1.ButtonStyle.Primary)
                    .setEmoji('💬'), new discord_js_1.ButtonBuilder()
                    .setCustomId('ticket_receber')
                    .setLabel('Receber Compra')
                    .setStyle(discord_js_1.ButtonStyle.Success)
                    .setEmoji('📦'));
                if (interaction.channel && 'send' in interaction.channel) {
                    await interaction.channel.send({
                        embeds: [ticketEmbed],
                        components: [rowBotoes]
                    });
                }
                await interaction.reply({ content: '✅ Painel de atendimento criado com sucesso!', ephemeral: true });
            }
        }
        catch (error) {
            console.error(`Erro ao executar o comando ${interaction.commandName}:`, error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: '❌ Ocorreu um erro ao executar este comando.', ephemeral: true }).catch(() => { });
            }
        }
    }
    if (interaction.isModalSubmit()) {
        if (interaction.customId === 'modal_painel_grupo') {
            const titulo = interaction.fields.getTextInputValue('grupo_titulo');
            const descricao = interaction.fields.getTextInputValue('grupo_descricao');
            const idsString = interaction.fields.getTextInputValue('grupo_ids');
            const idsArray = idsString.split(',').map((id) => parseInt(id.trim())).filter((id) => !isNaN(id));
            if (idsArray.length === 0) {
                return interaction.reply({ content: '❌ Nenhum ID válido fornecido.', ephemeral: true });
            }
            try {
                const produtos = await prisma.produto.findMany({
                    where: { id: { in: idsArray } }
                });
                if (produtos.length === 0) {
                    return interaction.reply({ content: '❌ Nenhum dos produtos informados foi encontrado.', ephemeral: true });
                }
                const embed = new discord_js_1.EmbedBuilder()
                    .setColor(0xED4245)
                    .setTitle(titulo)
                    .setDescription(descricao)
                    .setTimestamp();
                const selectMenu = new (require('discord.js').StringSelectMenuBuilder)()
                    .setCustomId('menu_comprar_grupo')
                    .setPlaceholder('➡️ Clique aqui para ver as opções')
                    .addOptions(produtos.map(produto => {
                    const precoFormatado = (produto.preco / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                    return {
                        label: produto.nome.substring(0, 100),
                        description: `Preço: ${precoFormatado} | Estoque: ${produto.estoque}`.substring(0, 100),
                        value: `pre_carrinho_${produto.id}`,
                        emoji: '🔪'
                    };
                }));
                const row = new discord_js_1.ActionRowBuilder().addComponents(selectMenu);
                if (interaction.channel && 'send' in interaction.channel) {
                    await interaction.channel.send({ embeds: [embed], components: [row] });
                }
                await interaction.reply({ content: '✅ Painel de grupo criado com sucesso!', ephemeral: true });
            }
            catch (error) {
                console.error(error);
                await interaction.reply({ content: '❌ Erro ao buscar produtos ou gerar painel.', ephemeral: true });
            }
        }
        if (interaction.customId === 'modal_painel_avisos') {
            const titulo = interaction.fields.getTextInputValue('aviso_titulo');
            const descricao = interaction.fields.getTextInputValue('aviso_descricao');
            const imagem = interaction.fields.getTextInputValue('aviso_imagem');
            const avisoEmbed = new discord_js_1.EmbedBuilder()
                .setColor(0xF1C40F)
                .setTitle(titulo)
                .setDescription(descricao)
                .setTimestamp();
            if (imagem && imagem.startsWith('http')) {
                avisoEmbed.setImage(imagem);
            }
            const autoButton = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
                .setCustomId('tag_mensagem_automatica')
                .setLabel('Mensagem Automática')
                .setStyle(discord_js_1.ButtonStyle.Secondary)
                .setDisabled(true));
            if (interaction.channel && 'send' in interaction.channel) {
                await interaction.channel.send({
                    embeds: [avisoEmbed],
                    components: [autoButton]
                });
            }
            await interaction.reply({ content: '✅ Painel de avisos criado com sucesso!', ephemeral: true });
        }
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
                const produto = await prisma.produto.create({
                    data: { nome, descricao, preco: precoCentavos, estoque, imagemUrl: imagem || null }
                });
                await interaction.reply({
                    content: `✅ Produto **${produto.nome}** (ID: \`${produto.id}\`) cadastrado com sucesso!`, ephemeral: true
                });
            }
            catch (error) {
                console.error(error);
                await interaction.reply({ content: '❌ Erro ao salvar o produto.', ephemeral: true });
            }
        }
    }
    if (interaction.isStringSelectMenu()) {
        if (interaction.customId === 'menu_comprar_grupo') {
            const selectedValue = interaction.values[0];
            if (selectedValue.startsWith('pre_carrinho_')) {
                const produtoId = parseInt(selectedValue.replace('pre_carrinho_', ''));
                try {
                    const produto = await prisma.produto.findUnique({ where: { id: produtoId } });
                    if (!produto)
                        return interaction.reply({ content: '❌ Produto não encontrado.', ephemeral: true });
                    const precoFormatado = (produto.preco / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                    const btnRow = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
                        .setCustomId(`comprar_${produto.id}`)
                        .setLabel(`Adicionar ao Carrinho (${precoFormatado})`)
                        .setStyle(discord_js_1.ButtonStyle.Success)
                        .setEmoji('🛒'));
                    await interaction.reply({
                        content: `📦 Você selecionou **${produto.nome}**.\nClique no botão abaixo para adicionar ao seu carrinho unificado.`,
                        components: [btnRow],
                        ephemeral: true
                    });
                }
                catch (error) {
                    console.error(error);
                    await interaction.reply({ content: '❌ Erro ao processar sua seleção.', ephemeral: true });
                }
            }
        }
    }
    if (interaction.isButton()) {
        // Lógica para fechar o ticket
        if (interaction.customId === 'close_ticket') {
            await interaction.reply({ content: '🔒 Fechando este ticket em 3 segundos...' });
            setTimeout(async () => {
                try {
                    await interaction.channel.delete();
                }
                catch (e) {
                    console.error('Erro ao deletar canal:', e);
                }
            }, 3000);
        }
        // Ticket de Dúvidas
        if (interaction.customId === 'ticket_duvida') {
            await interaction.deferReply({ ephemeral: true });
            const guild = interaction.guild;
            if (!guild)
                return interaction.editReply({ content: '❌ Erro ao identificar o servidor.' });
            const categoryId = '1539051853759647795';
            const channelName = `duvida-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '') || `duvida-${interaction.user.id}`;
            await guild.channels.fetch();
            let ticketChannel = guild.channels.cache.find((c) => c.name === channelName && c.type === discord_js_1.ChannelType.GuildText && c.parentId === categoryId);
            if (!ticketChannel) {
                const permissionOverwrites = [
                    { id: guild.roles.everyone.id, deny: [discord_js_1.PermissionFlagsBits.ViewChannel] },
                    { id: interaction.user.id, allow: [discord_js_1.PermissionFlagsBits.ViewChannel, discord_js_1.PermissionFlagsBits.SendMessages, discord_js_1.PermissionFlagsBits.ReadMessageHistory] },
                ];
                if (process.env.OWNER_ROLE_ID) {
                    permissionOverwrites.push({
                        id: process.env.OWNER_ROLE_ID,
                        allow: [discord_js_1.PermissionFlagsBits.ViewChannel, discord_js_1.PermissionFlagsBits.SendMessages, discord_js_1.PermissionFlagsBits.ReadMessageHistory],
                    });
                }
                ticketChannel = await guild.channels.create({
                    name: channelName,
                    type: discord_js_1.ChannelType.GuildText,
                    parent: categoryId,
                    permissionOverwrites: permissionOverwrites,
                });
                const welcomeEmbed = new discord_js_1.EmbedBuilder()
                    .setColor(0x2B2D31)
                    .setTitle('💬 Ticket de Dúvidas - Kora Shop')
                    .setDescription(`Olá <@${interaction.user.id}>! Sua dúvida foi aberta com sucesso. Aguarde um momento e nossa equipe já te atenderá.`)
                    .setTimestamp();
                const rowClose = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
                    .setCustomId('close_ticket')
                    .setLabel('Fechar Ticket')
                    .setStyle(discord_js_1.ButtonStyle.Danger)
                    .setEmoji('🔒'));
                await ticketChannel.send({ content: `<@${interaction.user.id}>`, embeds: [welcomeEmbed], components: [rowClose] });
            }
            const channelUrl = `https://discord.com/channels/${guild.id}/${ticketChannel.id}`;
            const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
                .setLabel('Ir para o Ticket')
                .setStyle(discord_js_1.ButtonStyle.Link)
                .setURL(channelUrl));
            return interaction.editReply({
                content: '✅ | Ticket criado com sucesso!',
                components: [row]
            });
        }
        // Ticket de Receber Compra
        if (interaction.customId === 'ticket_receber') {
            const feedbackChannelId = process.env.FEEDBACK_CHANNEL_ID;
            if (!feedbackChannelId) {
                return interaction.reply({
                    content: '⚠️ O canal de feedback não foi configurado pelo administrador no sistema (.env).',
                    ephemeral: true
                });
            }
            try {
                const feedbackChannel = await interaction.guild?.channels.fetch(feedbackChannelId);
                if (!feedbackChannel) {
                    return interaction.reply({ content: '❌ Canal de feedback não encontrado.', ephemeral: true });
                }
                const messages = await feedbackChannel.messages.fetch({ limit: 100 });
                const userSentFeedback = messages.some(m => m.author.id === interaction.user.id);
                if (!userSentFeedback) {
                    return interaction.reply({
                        content: '❌ **Você ainda não enviou uma mensagem no canal de feedbacks!**\nPor favor, envie seu feedback primeiro para poder abrir um ticket de recebimento de compra.',
                        ephemeral: true
                    });
                }
                await interaction.deferReply({ ephemeral: true });
                const guild = interaction.guild;
                if (!guild)
                    return interaction.editReply({ content: '❌ Erro ao identificar o servidor.' });
                const categoryId = '1539051619109568572';
                const channelName = `receber-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '') || `receber-${interaction.user.id}`;
                await guild.channels.fetch();
                let ticketChannel = guild.channels.cache.find((c) => c.name === channelName && c.type === discord_js_1.ChannelType.GuildText && c.parentId === categoryId);
                if (!ticketChannel) {
                    const permissionOverwrites = [
                        { id: guild.roles.everyone.id, deny: [discord_js_1.PermissionFlagsBits.ViewChannel] },
                        { id: interaction.user.id, allow: [discord_js_1.PermissionFlagsBits.ViewChannel, discord_js_1.PermissionFlagsBits.SendMessages, discord_js_1.PermissionFlagsBits.ReadMessageHistory] },
                    ];
                    if (process.env.OWNER_ROLE_ID) {
                        permissionOverwrites.push({
                            id: process.env.OWNER_ROLE_ID,
                            allow: [discord_js_1.PermissionFlagsBits.ViewChannel, discord_js_1.PermissionFlagsBits.SendMessages, discord_js_1.PermissionFlagsBits.ReadMessageHistory],
                        });
                    }
                    ticketChannel = await guild.channels.create({
                        name: channelName,
                        type: discord_js_1.ChannelType.GuildText,
                        parent: categoryId,
                        permissionOverwrites: permissionOverwrites,
                    });
                    const welcomeEmbed = new discord_js_1.EmbedBuilder()
                        .setColor(0x2B2D31)
                        .setTitle('📦 Ticket de Receber Compra - Kora Shop')
                        .setDescription(`Olá <@${interaction.user.id}>! Feedback validado com sucesso. Envie os detalhes da sua compra aqui e aguarde um atendente.`)
                        .setTimestamp();
                    const rowClose = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
                        .setCustomId('close_ticket')
                        .setLabel('Fechar Ticket')
                        .setStyle(discord_js_1.ButtonStyle.Danger)
                        .setEmoji('🔒'));
                    await ticketChannel.send({ content: `<@${interaction.user.id}>`, embeds: [welcomeEmbed], components: [rowClose] });
                }
                const channelUrl = `https://discord.com/channels/${guild.id}/${ticketChannel.id}`;
                const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
                    .setLabel('Ir para o Ticket')
                    .setStyle(discord_js_1.ButtonStyle.Link)
                    .setURL(channelUrl));
                return interaction.editReply({
                    content: '✅ | Ticket criado com sucesso!',
                    components: [row]
                });
            }
            catch (error) {
                console.error('Erro ao verificar feedback ou criar ticket:', error);
                if (interaction.deferred) {
                    return interaction.editReply({ content: '❌ Ocorreu um erro ao processar seu ticket.' });
                }
                return interaction.reply({ content: '❌ Ocorreu um erro ao verificar seu feedback.', ephemeral: true });
            }
        }
        if (interaction.customId === 'unlock_channel') {
            const ownerRoleId = process.env.OWNER_ROLE_ID;
            const member = interaction.member;
            let hasOwnerRole = false;
            let isAdmin = false;
            if (member && 'roles' in member) {
                const roles = member.roles;
                if (roles.cache && typeof roles.cache.has === 'function') {
                    hasOwnerRole = roles.cache.has(ownerRoleId);
                }
            }
            if (member && 'permissions' in member && member.permissions) {
                isAdmin = member.permissions.has(discord_js_1.PermissionFlagsBits.Administrator);
            }
            if (!hasOwnerRole && !isAdmin) {
                return interaction.reply({
                    content: '❌ Apenas membros com o cargo **Owner** podem destrancar este canal!',
                    ephemeral: true
                });
            }
            if (!interaction.channel || !('permissionOverwrites' in interaction.channel)) {
                return interaction.reply({ content: '❌ Erro ao identificar o canal.', ephemeral: true });
            }
            try {
                const everyoneRole = interaction.guild.roles.everyone;
                await interaction.channel.permissionOverwrites.edit(everyoneRole, { SendMessages: null });
                await interaction.update({
                    content: `🔓 Canal destrancado por **${interaction.user.tag}**.`,
                    embeds: [],
                    components: []
                });
            }
            catch (error) {
                console.error(error);
                await interaction.reply({ content: '❌ Erro ao destrancar o canal.', ephemeral: true });
            }
        }
        if (interaction.customId.startsWith('comprar_')) {
            const produtoId = parseInt(interaction.customId.split('_')[1]);
            const userId = interaction.user.id;
            await interaction.deferReply({ ephemeral: true });
            try {
                const produto = await prisma.produto.findUnique({ where: { id: produtoId } });
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
                await prisma.cartItem.upsert({
                    where: { userId_produtoId: { userId, produtoId } },
                    update: { quantidade: { increment: 1 } },
                    create: { userId, produtoId, quantidade: 1 }
                });
                const itensCarrinho = await prisma.cartItem.findMany({
                    where: { userId },
                    include: { produto: true }
                });
                let valorTotalCentavos = 0;
                const camposEmbedItens = [];
                itensCarrinho.forEach((item) => {
                    const subtotal = item.produto.preco * item.quantidade;
                    valorTotalCentavos += subtotal;
                    const subtotalFormatado = (subtotal / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                    camposEmbedItens.push(`\`${item.quantidade}x\` **${item.produto.nome}** — Subtotal: \`${subtotalFormatado}\``);
                });
                const valorTotalFormatado = (valorTotalCentavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                const channelName = `carrinho-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '') || `carrinho-${interaction.user.id}`;
                await guild.channels.fetch();
                let ticketChannel = guild.channels.cache.find((c) => c.name === channelName && c.type === discord_js_1.ChannelType.GuildText);
                const carrinhoEmbed = new discord_js_1.EmbedBuilder()
                    .setColor(0x2B2D31)
                    .setTitle('🛒 Seu Carrinho Consolidado - Kora Shop')
                    .setDescription(`Olá <@${interaction.user.id}>! Aqui estão todos os produtos adicionados ao seu carrinho atual:`)
                    .addFields({ name: '📦 Itens Selecionados', value: camposEmbedItens.join('\n'), inline: false }, { name: '💰 Valor Total Acumulado', value: `\`${valorTotalFormatado}\``, inline: false })
                    .setFooter({ text: 'Kora Shop • Carrinho Inteligente' })
                    .setTimestamp();
                const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
                    .setCustomId(`finalizar_pagamento_geral`)
                    .setLabel(`💳 Gerar Pix (${valorTotalFormatado})`)
                    .setStyle(discord_js_1.ButtonStyle.Success), new discord_js_1.ButtonBuilder()
                    .setCustomId(`cancelar_carrinho`)
                    .setLabel('❌ Cancelar / Fechar')
                    .setStyle(discord_js_1.ButtonStyle.Danger));
                if (!ticketChannel) {
                    const categoryId = process.env.CATEGORY_TICKET_ID || null;
                    const permissionOverwrites = [
                        { id: guild.roles.everyone.id, deny: [discord_js_1.PermissionFlagsBits.ViewChannel] },
                        { id: interaction.user.id, allow: [discord_js_1.PermissionFlagsBits.ViewChannel, discord_js_1.PermissionFlagsBits.SendMessages, discord_js_1.PermissionFlagsBits.ReadMessageHistory] },
                    ];
                    if (process.env.OWNER_ROLE_ID) {
                        permissionOverwrites.push({
                            id: process.env.OWNER_ROLE_ID,
                            allow: [discord_js_1.PermissionFlagsBits.ViewChannel, discord_js_1.PermissionFlagsBits.SendMessages, discord_js_1.PermissionFlagsBits.ReadMessageHistory],
                        });
                    }
                    ticketChannel = await guild.channels.create({
                        name: channelName,
                        type: discord_js_1.ChannelType.GuildText,
                        parent: categoryId ? categoryId : undefined,
                        permissionOverwrites: permissionOverwrites,
                    });
                    await ticketChannel.send({
                        content: `<@${interaction.user.id}>, seu canal exclusivo de carrinho foi criado aqui: ${ticketChannel}`,
                        embeds: [carrinhoEmbed],
                        components: [row]
                    });
                }
                else {
                    const mensagens = await ticketChannel.messages.fetch({ limit: 10 });
                    const ultimaMensagemBot = mensagens.find(m => m.author.id === client.user?.id && m.components.length > 0);
                    if (ultimaMensagemBot) {
                        const rowDesativada = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
                            .setCustomId('expirado')
                            .setLabel('🔄 Carrinho Atualizado acima')
                            .setStyle(discord_js_1.ButtonStyle.Secondary)
                            .setDisabled(true));
                        await ultimaMensagemBot.edit({ components: [rowDesativada] }).catch(() => { });
                    }
                    await ticketChannel.send({
                        content: `<@${interaction.user.id}>, seu carrinho foi atualizado com um novo item!`,
                        embeds: [carrinhoEmbed],
                        components: [row]
                    });
                }
                await interaction.editReply({ content: `✅ Item adicionado ao carrinho! Acesse aqui: ${ticketChannel}` });
            }
            catch (error) {
                console.error('Erro detalhado ao atualizar carrinho:', error);
                await interaction.editReply({ content: '❌ Erro ao atualizar o carrinho.' });
            }
        }
        if (interaction.customId === 'cancelar_carrinho') {
            if (!interaction.channel || !('delete' in interaction.channel)) {
                return interaction.reply({ content: '❌ Não foi possível apagar este canal.', ephemeral: true });
            }
            try {
                await prisma.cartItem.deleteMany({ where: { userId: interaction.user.id } });
            }
            catch (e) { }
            await interaction.reply({ content: '🗑️ Carrinho limpo e canal fechando em 3 segundos...', ephemeral: true });
            setTimeout(async () => {
                try {
                    await interaction.channel.delete();
                }
                catch (e) {
                    console.error(e);
                }
            }, 3000);
        }
        if (interaction.customId === 'finalizar_pagamento_geral') {
            await interaction.deferReply();
            const userId = interaction.user.id;
            try {
                const itensCarrinho = await prisma.cartItem.findMany({
                    where: { userId },
                    include: { produto: true }
                });
                if (itensCarrinho.length === 0) {
                    return interaction.editReply({ content: '❌ Seu carrinho está vazio.' });
                }
                let valorTotalCentavos = 0;
                const descricoes = [];
                itensCarrinho.forEach((item) => {
                    valorTotalCentavos += item.produto.preco * item.quantidade;
                    descricoes.push(`\`${item.quantidade}x ${item.produto.nome}\``);
                });
                const respostaApi = await axios_1.default.post('https://panterapay-production.up.railway.app/transactions', {
                    amount: valorTotalCentavos
                }, {
                    headers: { 'Authorization': process.env.PANTERA_API_KEY }
                });
                const transactionId = respostaApi.data.id;
                const pixCopiaECola = respostaApi.data.copyPaste;
                const itensTextoFormatado = descricoes.join('\n');
                transacoesProdutos.set(transactionId, {
                    itensDescricao: itensTextoFormatado,
                    precoCentavos: valorTotalCentavos,
                    userId: interaction.user.id,
                    username: interaction.user.username
                });
                await prisma.cartItem.deleteMany({ where: { userId } });
                const actionRow = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
                    .setCustomId(`check_${transactionId}`)
                    .setLabel('🔍 Verificar Pagamento')
                    .setStyle(discord_js_1.ButtonStyle.Primary));
                await interaction.editReply({
                    content: `🛒 **Pagamento unificado gerado com sucesso!**\n\n**Itens:**\n${itensTextoFormatado}\n\nCopie o código Pix abaixo:\n\`\`\`${pixCopiaECola}\`\`\``,
                    components: [actionRow]
                });
            }
            catch (error) {
                console.error('Erro na API:', error.response?.data || error.message);
                await interaction.editReply({ content: '❌ Erro ao gerar pagamento unificado via Pix.' });
            }
        }
        if (interaction.customId.startsWith('check_')) {
            const transactionId = interaction.customId.split('_')[1];
            await interaction.deferReply({ ephemeral: true });
            try {
                const response = await axios_1.default.get(`https://panterapay-production.up.railway.app/transactions/${transactionId}`, {
                    headers: { 'Authorization': process.env.PANTERA_API_KEY }
                });
                if (response.data.status === 'paid' || response.data.status === 'approved') {
                    await concluirVendaESolicitarLog(interaction, transactionId);
                }
                else {
                    await interaction.editReply({ content: '⏳ **Pagamento ainda não identificado.**' });
                }
            }
            catch (error) {
                console.error(error);
                await interaction.editReply({ content: '❌ Erro ao consultar status.' });
            }
        }
        if (interaction.customId.startsWith('bypass_')) {
            const transactionId = interaction.customId.split('_')[1];
            await interaction.deferReply({ ephemeral: true });
            try {
                await concluirVendaESolicitarLog(interaction, transactionId);
            }
            catch (error) {
                console.error(error);
                await interaction.editReply({ content: '❌ Erro ao forçar aprovação de teste.' });
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
                        await member.roles.add(roleId).catch(() => { });
                    }
                }
            }
            catch (err) {
                console.error(`[ERRO] Falha ao buscar membros do servidor ${guild.name}:`, err);
            }
        }
    }
});
client.login(process.env.DISCORD_TOKEN);
