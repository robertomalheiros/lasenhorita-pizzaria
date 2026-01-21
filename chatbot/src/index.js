const wppconnect = require('@wppconnect-team/wppconnect');
const express = require('express');
const menuHandler = require('./handlers/menuHandler');
const pedidoHandler = require('./handlers/pedidoHandler');
const statusHandler = require('./handlers/statusHandler');

// Estado das conversas (em memória)
const sessoes = new Map();

// Referência global do cliente WhatsApp
let whatsappClient = null;

// Servidor HTTP para receber notificações
const app = express();
app.use(express.json());

// Endpoint de health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    connected: whatsappClient !== null,
    timestamp: new Date().toISOString()
  });
});

// Endpoint para enviar mensagem de notificação
app.post('/notify', async (req, res) => {
  try {
    const { telefone, mensagem } = req.body;

    if (!telefone || !mensagem) {
      return res.status(400).json({ error: 'Telefone e mensagem são obrigatórios' });
    }

    if (!whatsappClient) {
      return res.status(503).json({ error: 'WhatsApp não conectado' });
    }

    // Formatar telefone (apenas números)
    let telefoneFormatado = telefone.replace(/\D/g, '');
    if (!telefoneFormatado.startsWith('55')) {
      telefoneFormatado = '55' + telefoneFormatado;
    }

    console.log(`📤 Tentando enviar notificação para ${telefoneFormatado}...`);

    // Tentar diferentes métodos de envio
    let enviado = false;
    let ultimoErro = null;

    // 1. Primeiro: Tentar encontrar o chat existente pelo número
    try {
      const allChats = await whatsappClient.getAllChats();
      const chatExistente = allChats.find(chat => {
        const chatPhone = chat.id?.user || chat.contact?.id?.user || '';
        return chatPhone.includes(telefoneFormatado.replace(/^55/, '')) ||
               telefoneFormatado.includes(chatPhone);
      });

      if (chatExistente) {
        console.log(`✅ Chat existente encontrado: ${chatExistente.id._serialized}`);
        await whatsappClient.sendText(chatExistente.id._serialized, mensagem);
        enviado = true;
        console.log(`📤 Notificação enviada via chat existente para ${telefoneFormatado}`);
      }
    } catch (chatError) {
      console.log(`⚠️ Não encontrou chat existente: ${chatError.message}`);
      ultimoErro = chatError;
    }

    // 2. Segundo: Tentar enviar diretamente para @c.us
    if (!enviado) {
      try {
        const chatId = telefoneFormatado + '@c.us';
        await whatsappClient.sendText(chatId, mensagem);
        enviado = true;
        console.log(`📤 Notificação enviada via @c.us para ${telefoneFormatado}`);
      } catch (cusError) {
        console.log(`⚠️ Falha ao enviar via @c.us: ${cusError.message}`);
        ultimoErro = cusError;
      }
    }

    // 3. Terceiro: Verificar sessão em memória pelo telefone
    if (!enviado) {
      // Procurar nas sessões pelo telefone (sem 55)
      const telefoneSemDDI = telefoneFormatado.replace(/^55/, '');
      for (const [key, sessao] of sessoes.entries()) {
        if (key.includes(telefoneSemDDI) || telefoneSemDDI.includes(key)) {
          if (sessao.chatId) {
            try {
              await whatsappClient.sendText(sessao.chatId, mensagem);
              enviado = true;
              console.log(`📤 Notificação enviada via sessão armazenada para ${telefoneFormatado}`);
              break;
            } catch (sessaoError) {
              console.log(`⚠️ Falha ao enviar via sessão: ${sessaoError.message}`);
              ultimoErro = sessaoError;
            }
          }
        }
      }
    }

    if (enviado) {
      return res.json({ success: true, message: 'Mensagem enviada' });
    } else {
      console.error(`❌ Não foi possível enviar notificação para ${telefoneFormatado}`);
      return res.status(500).json({
        error: 'Não foi possível enviar mensagem',
        details: ultimoErro?.message || 'Número não encontrado em nenhum chat'
      });
    }
  } catch (error) {
    console.error('Erro ao enviar notificação:', error);
    return res.status(500).json({ error: 'Erro ao enviar mensagem', details: error.message });
  }
});

// Iniciar servidor HTTP
const PORT = process.env.NOTIFICATION_PORT || 3100;
app.listen(PORT, () => {
  console.log(`🔔 Servidor de notificações rodando na porta ${PORT}`);
});

// Inicializar WPPConnect
wppconnect.create({
  session: 'lasenhorita-pizzaria',
  catchQR: (base64Qrimg, asciiQR) => {
    console.log('\n========== QR CODE ==========');
    console.log(asciiQR);
    console.log('==============================\n');
    console.log('Escaneie o QR Code acima com o WhatsApp da pizzaria');
  },
  statusFind: (statusSession, session) => {
    console.log('Status da sessão:', statusSession);
  },
  headless: true,
  logQR: true,
  puppeteerOptions: {
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-first-run',
      '--no-zygote',
      '--single-process'
    ],
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser'
  }
})
.then((client) => {
  console.log('✅ WhatsApp conectado com sucesso!');
  whatsappClient = client; // Salvar referência global
  iniciarBot(client);
})
.catch((erro) => {
  console.error('❌ Erro ao conectar WhatsApp:', erro);
});

// Função para extrair telefone real do objeto message
async function extrairTelefoneReal(client, message) {
  try {
    // Tentar obter do sender.id (formato: 55XXXXXXXXXXX@c.us)
    if (message.sender?.id) {
      const senderId = message.sender.id;
      if (senderId.includes('@c.us')) {
        return senderId.replace('@c.us', '').replace(/^55/, '');
      }
    }

    // Tentar obter do author
    if (message.author && message.author.includes('@c.us')) {
      return message.author.replace('@c.us', '').replace(/^55/, '');
    }

    // Se for LID, tentar usar getContact para obter número real
    if (message.from.includes('@lid')) {
      try {
        const contact = await client.getContact(message.from);
        console.log('📋 Contact info:', JSON.stringify(contact, null, 2));

        // O número pode estar em contact.id ou contact.number
        if (contact?.id?.user) {
          return contact.id.user.replace(/^55/, '');
        }
        if (contact?.number) {
          return contact.number.replace(/^55/, '');
        }
      } catch (contactError) {
        console.error('⚠️ Erro ao obter contato:', contactError.message);
      }
    }

    // Fallback: usar message.from removendo sufixos
    return message.from.replace(/@(c\.us|lid)$/, '').replace(/^55/, '');
  } catch (error) {
    console.error('⚠️ Erro ao extrair telefone:', error.message);
    return message.from.replace(/@(c\.us|lid)$/, '').replace(/^55/, '');
  }
}

// Função auxiliar para salvar contato no WhatsApp e no banco
async function salvarClienteAutomatico(client, telefone, nomeWhatsApp, chatId) {
  const apiService = require('./services/apiService');

  // Formatar telefone (apenas números, sem 55)
  const telefoneFormatado = telefone.replace(/\D/g, '').replace(/^55/, '');

  try {
    // 1. Salvar contato no WhatsApp
    try {
      const telefoneCompleto = '55' + telefoneFormatado;
      const contactId = telefoneCompleto + '@c.us';

      // Verificar se já é um contato
      const isContact = await client.checkNumberStatus(contactId);
      console.log(`📱 Status do número ${telefoneFormatado}:`, isContact);

      if (isContact?.numberExists) {
        // Criar/atualizar contato no WhatsApp
        const nomeContato = nomeWhatsApp || 'Cliente LaSenhorita';
        await client.createContact(contactId, nomeContato);
        console.log(`📇 Contato salvo no WhatsApp: ${nomeContato} (${telefoneFormatado})`);
      }
    } catch (whatsappError) {
      console.error(`⚠️ Erro ao salvar contato no WhatsApp:`, whatsappError.message);
    }

    // 2. Salvar no banco de dados
    const clienteExistente = await apiService.buscarClientePorTelefone(telefoneFormatado);
    if (clienteExistente) {
      console.log(`👤 Cliente já existe no banco: ${clienteExistente.nome} (${telefoneFormatado})`);
      return clienteExistente;
    }

    // Criar novo cliente com dados básicos do WhatsApp
    const novoCliente = await apiService.cadastrarCliente({
      nome: nomeWhatsApp || 'Cliente WhatsApp',
      telefone: telefoneFormatado,
      endereco: null,
      bairro: null
    });
    console.log(`✅ Novo cliente salvo no banco: ${novoCliente.nome} (${telefoneFormatado})`);
    return novoCliente;
  } catch (error) {
    console.error(`⚠️ Erro ao salvar cliente (${telefoneFormatado}):`, error.message);
    return null;
  }
}

function iniciarBot(client) {
  client.onMessage(async (message) => {
    // Ignorar mensagens de grupos e status
    if (message.isGroupMsg || message.from === 'status@broadcast') {
      return;
    }

    // Log completo da mensagem para debug
    console.log('📨 Mensagem recebida - from:', message.from, '| sender.id:', message.sender?.id);

    // Extrair telefone real (lidar com LID)
    const telefone = await extrairTelefoneReal(client, message);
    const texto = message.body?.trim() || '';
    const chatId = message.from; // Manter o chatId original para responder

    // Obter nome do contato do WhatsApp
    const nomeWhatsApp = message.sender?.pushname || message.notifyName || null;

    console.log(`📱 Mensagem de ${nomeWhatsApp || 'Desconhecido'} (Tel: ${telefone}): ${texto.substring(0, 50)}`);

    try {
      // Salvar/atualizar cliente automaticamente na primeira interação
      const clienteSalvo = await salvarClienteAutomatico(client, telefone, nomeWhatsApp, chatId);

      // Obter ou criar sessão do usuário (usar telefone real como chave)
      let sessao = sessoes.get(telefone);
      if (!sessao) {
        sessao = {
          estado: 'INICIO',
          dados: {},
          carrinho: [],
          cliente: clienteSalvo,
          chatId: chatId // Guardar o chatId original para responder
        };
        sessoes.set(telefone, sessao);
      } else if (!sessao.cliente && clienteSalvo) {
        sessao.cliente = clienteSalvo;
        sessao.chatId = chatId;
      }

      // Processar mensagem baseada no estado atual
      const resposta = await processarMensagem(sessao, texto, telefone);

      // Atualizar sessão
      sessoes.set(telefone, sessao);

      // Enviar resposta
      if (resposta) {
        await client.sendText(message.from, resposta);
        console.log(`📤 Resposta enviada para ${telefone}`);
      }
    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
      await client.sendText(
        message.from,
        '❌ Desculpe, ocorreu um erro. Por favor, tente novamente digitando *0* para voltar ao menu principal.'
      );
    }
  });

  console.log('🤖 Bot LaSenhorita Pizzaria iniciado e aguardando mensagens...');
}

async function processarMensagem(sessao, texto, telefone) {
  const opcao = texto.toLowerCase().trim();

  // Comando para cancelar e voltar ao menu principal (somente 'menu' ou 'cancelar')
  if (opcao === 'menu' || opcao === 'cancelar') {
    sessao.estado = 'INICIO';
    sessao.dados = {};
    sessao.carrinho = [];
    return menuHandler.menuPrincipal();
  }

  // O "0" agora é tratado dentro de cada estado para voltar ao submenu anterior

  // Máquina de estados
  switch (sessao.estado) {
    case 'INICIO':
      return await menuHandler.processarInicio(sessao, opcao, telefone);

    case 'MENU_PRINCIPAL':
      return await menuHandler.processarMenuPrincipal(sessao, opcao, telefone);

    case 'CADASTRO_NOME':
      return await menuHandler.processarCadastroNome(sessao, texto, telefone);

    case 'CADASTRO_ENDERECO':
      return await menuHandler.processarCadastroEndereco(sessao, texto, telefone);

    case 'CADASTRO_BAIRRO':
      return await menuHandler.processarCadastroBairro(sessao, texto, telefone);

    case 'ESCOLHER_CATEGORIA':
      return await pedidoHandler.processarCategoria(sessao, opcao);

    case 'ESCOLHER_TAMANHO':
      return await pedidoHandler.processarTamanho(sessao, opcao);

    case 'ESCOLHER_SABOR':
      return await pedidoHandler.processarSabor(sessao, opcao);

    case 'ESCOLHER_SEGUNDO_SABOR':
      return await pedidoHandler.processarSegundoSabor(sessao, opcao);

    case 'ESCOLHER_BORDA':
      return await pedidoHandler.processarBorda(sessao, opcao);

    case 'ESCOLHER_PRODUTO':
      return await pedidoHandler.processarProduto(sessao, opcao);

    case 'CONFIRMAR_ITEM':
      return await pedidoHandler.processarConfirmacaoItem(sessao, opcao);

    case 'CARRINHO':
      return await pedidoHandler.processarCarrinho(sessao, opcao);

    case 'REMOVER_ITEM':
      return await pedidoHandler.processarRemoverItem(sessao, opcao);

    case 'TIPO_ENTREGA':
      return await pedidoHandler.processarTipoEntrega(sessao, opcao);

    case 'FORMA_PAGAMENTO':
      return await pedidoHandler.processarFormaPagamento(sessao, opcao);

    case 'TROCO_VALOR':
      return await pedidoHandler.processarTrocoValor(sessao, texto);

    case 'CONFIRMAR_PEDIDO':
      return await pedidoHandler.processarConfirmacaoPedido(sessao, opcao, telefone);

    case 'CONSULTAR_PEDIDO':
      return await statusHandler.processarConsultaPedido(sessao, opcao, telefone);

    default:
      sessao.estado = 'INICIO';
      return menuHandler.menuPrincipal();
  }
}
