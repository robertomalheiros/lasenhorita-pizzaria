const wppconnect = require('@wppconnect-team/wppconnect');
const menuHandler = require('./handlers/menuHandler');
const pedidoHandler = require('./handlers/pedidoHandler');
const statusHandler = require('./handlers/statusHandler');

// Estado das conversas (em memória)
const sessoes = new Map();

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
  iniciarBot(client);
})
.catch((erro) => {
  console.error('❌ Erro ao conectar WhatsApp:', erro);
});

function iniciarBot(client) {
  client.onMessage(async (message) => {
    // Ignorar mensagens de grupos e status
    if (message.isGroupMsg || message.from === 'status@broadcast') {
      return;
    }

    const telefone = message.from.replace('@c.us', '');
    const texto = message.body.trim();

    console.log(`📱 Mensagem de ${telefone}: ${texto}`);

    try {
      // Obter ou criar sessão do usuário
      let sessao = sessoes.get(telefone);
      if (!sessao) {
        sessao = {
          estado: 'INICIO',
          dados: {},
          carrinho: [],
          cliente: null
        };
        sessoes.set(telefone, sessao);
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

  // Comando global para voltar ao menu
  if (opcao === '0' || opcao === 'menu' || opcao === 'inicio') {
    sessao.estado = 'INICIO';
    sessao.dados = {};
    sessao.carrinho = [];
    return menuHandler.menuPrincipal();
  }

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
