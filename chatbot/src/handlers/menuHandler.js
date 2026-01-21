const apiService = require('../services/apiService');
const { formatarDinheiro, formatarTelefone } = require('../utils/formatters');

// Menu principal de boas-vindas
function menuPrincipal() {
  return `🍕 *LaSenhorita Pizzaria* 🍕
Olá! Seja bem-vindo(a)!

Escolha uma opção:

*1* - 🛒 Fazer Pedido
*2* - 📋 Consultar Pedido
*3* - 📍 Horário e Localização
*4* - 📞 Falar com Atendente

Digite o número da opção desejada:`;
}

// Processar início da conversa
async function processarInicio(sessao, opcao, telefone) {
  // Verificar se cliente já está cadastrado
  try {
    const cliente = await apiService.buscarClientePorTelefone(telefone);

    if (cliente) {
      sessao.cliente = cliente;
      sessao.estado = 'MENU_PRINCIPAL';
      return `🍕 *LaSenhorita Pizzaria* 🍕
Olá, *${cliente.nome}*! Que bom ter você de volta! 😊

Escolha uma opção:

*1* - 🛒 Fazer Pedido
*2* - 📋 Consultar Pedido
*3* - 📍 Horário e Localização
*4* - 📞 Falar com Atendente

Digite o número da opção desejada:`;
    } else {
      sessao.estado = 'MENU_PRINCIPAL';
      return menuPrincipal();
    }
  } catch (error) {
    sessao.estado = 'MENU_PRINCIPAL';
    return menuPrincipal();
  }
}

// Processar opção do menu principal
async function processarMenuPrincipal(sessao, opcao, telefone) {
  switch (opcao) {
    case '1':
      // Verificar cadastro antes de fazer pedido
      if (!sessao.cliente) {
        sessao.estado = 'CADASTRO_NOME';
        return `📝 *Cadastro*

Para fazer seu pedido, preciso de algumas informações.

Qual é o seu *nome*?`;
      }
      return await mostrarCategorias(sessao);

    case '2':
      if (!sessao.cliente) {
        return `❌ Você precisa ter feito pelo menos um pedido para consultar.

Digite *1* para fazer um pedido ou *0* para voltar ao menu.`;
      }
      sessao.estado = 'CONSULTAR_PEDIDO';
      return await mostrarPedidosCliente(sessao);

    case '3':
      return `📍 *Horário e Localização*

🕐 *Horário de Funcionamento:*
Segunda a Quinta: 18h às 23h
Sexta e Sábado: 18h às 00h
Domingo: 18h às 22h

📍 *Endereço:*
Rua das Pizzas, 123 - Centro

📱 *Telefone:* (XX) XXXXX-XXXX

Digite *0* para voltar ao menu principal.`;

    case '4':
      return `📞 *Falar com Atendente*

Um momento, estamos direcionando você para um de nossos atendentes.

Enquanto isso, você pode enviar sua dúvida ou solicitação que responderemos em breve! 😊

Digite *0* para voltar ao menu principal.`;

    default:
      return `❌ Opção inválida. Por favor, digite um número de 1 a 4.

${menuPrincipal()}`;
  }
}

// Processar cadastro - Nome
async function processarCadastroNome(sessao, texto, telefone) {
  if (texto.length < 2) {
    return '❌ Por favor, digite um nome válido.';
  }

  sessao.dados.nome = texto;
  sessao.dados.telefone = telefone;
  sessao.estado = 'CADASTRO_ENDERECO';

  return `✅ Obrigado, *${texto}*!

Agora, qual é o seu *endereço completo* para entrega?
(Rua, número, complemento)`;
}

// Processar cadastro - Endereço
async function processarCadastroEndereco(sessao, texto, telefone) {
  if (texto.length < 5) {
    return '❌ Por favor, digite um endereço válido com rua e número.';
  }

  sessao.dados.endereco = texto;
  sessao.estado = 'CADASTRO_BAIRRO';

  // Buscar bairros disponíveis
  try {
    const taxas = await apiService.listarTaxas();
    let listaBairros = '📍 *Bairros que atendemos:*\n\n';

    taxas.forEach((taxa, index) => {
      listaBairros += `*${index + 1}* - ${taxa.bairro} (Taxa: ${formatarDinheiro(taxa.taxa)})\n`;
    });

    sessao.dados.taxasDisponiveis = taxas;

    return `${listaBairros}
Digite o *número* do seu bairro:`;
  } catch (error) {
    return `Qual é o *bairro*?`;
  }
}

// Processar cadastro - Bairro
async function processarCadastroBairro(sessao, texto, telefone) {
  const taxas = sessao.dados.taxasDisponiveis;
  const opcao = parseInt(texto);

  if (taxas && opcao >= 1 && opcao <= taxas.length) {
    const taxaSelecionada = taxas[opcao - 1];
    sessao.dados.bairro = taxaSelecionada.bairro;
    sessao.dados.taxaEntrega = parseFloat(taxaSelecionada.taxa);
  } else {
    sessao.dados.bairro = texto;
    sessao.dados.taxaEntrega = 0;
  }

  // Cadastrar cliente
  try {
    const novoCliente = await apiService.cadastrarCliente({
      nome: sessao.dados.nome,
      telefone: sessao.dados.telefone,
      endereco: sessao.dados.endereco,
      bairro: sessao.dados.bairro
    });

    sessao.cliente = novoCliente;
    sessao.dados = {};

    return await mostrarCategorias(sessao);
  } catch (error) {
    console.error('Erro ao cadastrar cliente:', error);
    return `❌ Erro ao salvar cadastro. Por favor, tente novamente.

Digite *0* para voltar ao menu principal.`;
  }
}

// Mostrar categorias disponíveis
async function mostrarCategorias(sessao) {
  try {
    const categorias = await apiService.listarCategorias();
    sessao.dados.categorias = categorias;
    sessao.estado = 'ESCOLHER_CATEGORIA';

    let menu = `🍕 *Cardápio LaSenhorita*

Escolha uma categoria:\n\n`;

    categorias.forEach((cat, index) => {
      const emojis = {
        'Pizzas': '🍕',
        'Bebidas': '🥤',
        'Porções': '🍟',
        'Sobremesas': '🍰'
      };
      const emoji = emojis[cat.nome] || '📦';
      menu += `*${index + 1}* - ${emoji} ${cat.nome}\n`;
    });

    menu += `\n*0* - Voltar ao menu principal`;

    return menu;
  } catch (error) {
    console.error('Erro ao listar categorias:', error);
    return `❌ Erro ao carregar cardápio. Tente novamente.

Digite *0* para voltar ao menu principal.`;
  }
}

// Mostrar pedidos do cliente
async function mostrarPedidosCliente(sessao) {
  try {
    const pedidos = await apiService.buscarPedidosCliente(sessao.cliente.id);

    if (!pedidos || pedidos.length === 0) {
      sessao.estado = 'MENU_PRINCIPAL';
      return `📋 *Seus Pedidos*

Você ainda não fez nenhum pedido.

Digite *1* para fazer um pedido.`;
    }

    // Mostrar últimos 5 pedidos
    const ultimosPedidos = pedidos.slice(0, 5);

    let lista = `📋 *Seus Últimos Pedidos*\n\n`;

    ultimosPedidos.forEach((pedido, index) => {
      const status = {
        'pendente': '🆕',
        'confirmado': '✅',
        'preparando': '👨‍🍳',
        'pronto': '📦',
        'saiu_entrega': '🛵',
        'entregue': '✔️',
        'cancelado': '❌'
      };
      lista += `*${index + 1}* - Pedido #${pedido.id} - ${status[pedido.status] || '❓'} ${pedido.status}\n`;
    });

    lista += `\nDigite o número para ver detalhes ou *0* para voltar.`;

    sessao.dados.pedidos = ultimosPedidos;

    return lista;
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    sessao.estado = 'MENU_PRINCIPAL';
    return `❌ Erro ao buscar pedidos. Tente novamente.

Digite *0* para voltar ao menu principal.`;
  }
}

module.exports = {
  menuPrincipal,
  processarInicio,
  processarMenuPrincipal,
  processarCadastroNome,
  processarCadastroEndereco,
  processarCadastroBairro,
  mostrarCategorias
};
