const apiService = require('../services/apiService');
const { formatarDinheiro, formatarNumeroPedido } = require('../utils/formatters');

// Processar escolha de categoria
async function processarCategoria(sessao, opcao) {
  // Voltar ao menu principal
  if (opcao === '0') {
    const menuHandler = require('./menuHandler');
    sessao.estado = 'MENU_PRINCIPAL';
    return menuHandler.menuPrincipal();
  }

  const categorias = sessao.dados.categorias;
  const index = parseInt(opcao) - 1;

  if (isNaN(index) || index < 0 || index >= categorias.length) {
    return '❌ Opção inválida. Digite o número da categoria desejada.';
  }

  const categoriaSelecionada = categorias[index];
  sessao.dados.categoriaAtual = categoriaSelecionada;

  // Se for pizzas (qualquer categoria que contenha "pizza"), mostrar tamanhos primeiro
  if (categoriaSelecionada.nome.toLowerCase().includes('pizza')) {
    return await mostrarTamanhos(sessao);
  }

  // Para outras categorias, mostrar produtos diretamente
  return await mostrarProdutos(sessao, categoriaSelecionada.id);
}

// Mostrar tamanhos de pizza
async function mostrarTamanhos(sessao) {
  try {
    const tamanhos = await apiService.listarTamanhos();
    sessao.dados.tamanhos = tamanhos;
    sessao.estado = 'ESCOLHER_TAMANHO';

    let menu = `🍕 *Escolha o Tamanho da Pizza*\n\n`;

    tamanhos.forEach((tam, index) => {
      menu += `*${index + 1}* - ${tam.nome} (${tam.fatias} fatias) - até ${tam.max_sabores} sabor(es)\n`;
    });

    menu += `\n*0* - Voltar às categorias`;

    return menu;
  } catch (error) {
    console.error('Erro ao listar tamanhos:', error);
    return '❌ Erro ao carregar tamanhos. Digite *0* para voltar.';
  }
}

// Processar escolha de tamanho
async function processarTamanho(sessao, opcao) {
  if (opcao === '0') {
    const menuHandler = require('./menuHandler');
    return await menuHandler.mostrarCategorias(sessao);
  }

  const tamanhos = sessao.dados.tamanhos;
  const index = parseInt(opcao) - 1;

  if (isNaN(index) || index < 0 || index >= tamanhos.length) {
    return '❌ Opção inválida. Digite o número do tamanho desejado.';
  }

  sessao.dados.tamanhoSelecionado = tamanhos[index];
  sessao.dados.saboresSelecionados = [];

  // Perguntar quantos sabores (se tamanho permite mais de 1)
  const tamanho = tamanhos[index];
  if (tamanho.max_sabores > 1) {
    sessao.estado = 'ESCOLHER_QTD_SABORES';
    let menu = `🍕 *Pizza ${tamanho.nome}* (${tamanho.fatias} fatias)\n\n`;
    menu += `Quantos sabores você deseja?\n\n`;

    for (let i = 1; i <= tamanho.max_sabores; i++) {
      if (i === 1) {
        menu += `*${i}* - 1 sabor (pizza inteira)\n`;
      } else if (i === 2) {
        menu += `*${i}* - 2 sabores (meio a meio)\n`;
      } else {
        menu += `*${i}* - ${i} sabores\n`;
      }
    }

    menu += `\n*0* - Voltar aos tamanhos`;
    return menu;
  }

  // Se só permite 1 sabor, ir direto para sabores
  sessao.dados.qtdSaboresEscolhida = 1;
  return await mostrarSabores(sessao);
}

// Processar escolha de quantidade de sabores
async function processarQtdSabores(sessao, opcao) {
  if (opcao === '0') {
    return await mostrarTamanhos(sessao);
  }

  const tamanho = sessao.dados.tamanhoSelecionado;
  const qtd = parseInt(opcao);

  if (isNaN(qtd) || qtd < 1 || qtd > tamanho.max_sabores) {
    return `❌ Opção inválida. Digite um número de 1 a ${tamanho.max_sabores}.`;
  }

  sessao.dados.qtdSaboresEscolhida = qtd;
  return await mostrarSabores(sessao);
}

// Mostrar sabores de pizza
async function mostrarSabores(sessao) {
  try {
    const categoriaId = sessao.dados.categoriaAtual.id;
    const produtos = await apiService.listarProdutosPorCategoria(categoriaId);

    // Filtrar apenas pizzas ativas
    const pizzas = produtos.filter(p => p.is_pizza && p.ativo);
    sessao.dados.pizzasDisponiveis = pizzas;
    sessao.estado = 'ESCOLHER_SABOR';

    const tamanho = sessao.dados.tamanhoSelecionado;
    const qtdSabores = sessao.dados.qtdSaboresEscolhida || 1;
    const saboresEscolhidos = sessao.dados.saboresSelecionados.length;

    let menu = `🍕 *Sabores de Pizza* (${tamanho.nome})\n`;
    menu += `Escolhendo sabor ${saboresEscolhidos + 1} de ${qtdSabores}\n\n`;

    // Agrupar pizzas por categoria/tipo
    pizzas.forEach((pizza, index) => {
      // Identificar se é premium (camarão, carne do sol, filé)
      const nomeLower = pizza.nome.toLowerCase();
      const isPremium = nomeLower.includes('camarão') ||
                        nomeLower.includes('carne do sol') ||
                        nomeLower.includes('filé');
      const indicador = isPremium ? '🔴' : '🟢';
      menu += `*${index + 1}* - ${indicador} ${pizza.nome}\n`;
    });

    menu += `\n🟢 Tradicionais/Especiais | 🔴 Premium (+R$15)`;
    menu += `\n\n📋 _Os ingredientes estão no catálogo do perfil._`;
    menu += `\n\n*0* - Voltar`;

    return menu;
  } catch (error) {
    console.error('Erro ao listar sabores:', error);
    return '❌ Erro ao carregar sabores. Digite *0* para voltar.';
  }
}

// Processar escolha de sabor
async function processarSabor(sessao, opcao) {
  if (opcao === '0') {
    // Voltar para escolher quantidade de sabores ou tamanhos
    const tamanho = sessao.dados.tamanhoSelecionado;
    if (tamanho.max_sabores > 1) {
      sessao.dados.saboresSelecionados = [];
      sessao.estado = 'ESCOLHER_QTD_SABORES';
      let menu = `🍕 *Pizza ${tamanho.nome}* (${tamanho.fatias} fatias)\n\n`;
      menu += `Quantos sabores você deseja?\n\n`;
      for (let i = 1; i <= tamanho.max_sabores; i++) {
        if (i === 1) menu += `*${i}* - 1 sabor (pizza inteira)\n`;
        else if (i === 2) menu += `*${i}* - 2 sabores (meio a meio)\n`;
        else menu += `*${i}* - ${i} sabores\n`;
      }
      menu += `\n*0* - Voltar aos tamanhos`;
      return menu;
    }
    return await mostrarTamanhos(sessao);
  }

  const pizzas = sessao.dados.pizzasDisponiveis;
  const index = parseInt(opcao) - 1;

  if (isNaN(index) || index < 0 || index >= pizzas.length) {
    return '❌ Opção inválida. Digite o número do sabor desejado.';
  }

  const pizzaSelecionada = pizzas[index];
  sessao.dados.saboresSelecionados.push(pizzaSelecionada);

  const qtdSabores = sessao.dados.qtdSaboresEscolhida || 1;
  const saboresEscolhidos = sessao.dados.saboresSelecionados.length;

  // Verificar se precisa escolher mais sabores
  if (saboresEscolhidos < qtdSabores) {
    // Ainda falta escolher mais sabores
    return `✅ *${pizzaSelecionada.nome}* adicionado!

Sabor ${saboresEscolhidos} de ${qtdSabores} escolhido.

` + await mostrarSabores(sessao);
  }

  // Todos os sabores escolhidos, ir para bordas
  return await mostrarBordas(sessao);
}

// Processar escolha de segundo sabor (mantido para compatibilidade)
async function processarSegundoSabor(sessao, opcao) {
  if (opcao === '1') {
    return await mostrarSabores(sessao);
  } else if (opcao === '2') {
    return await mostrarBordas(sessao);
  }

  return '❌ Digite *1* para adicionar outro sabor ou *2* para continuar.';
}

// Mostrar bordas disponíveis
async function mostrarBordas(sessao) {
  try {
    const todasBordas = await apiService.listarBordas();
    // Filtrar bordas recheadas (excluir "Sem Borda" ou preço 0)
    const bordas = todasBordas.filter(b =>
      parseFloat(b.preco) > 0 && !b.nome.toLowerCase().includes('sem borda')
    );
    sessao.dados.bordas = bordas;
    sessao.estado = 'ESCOLHER_BORDA';

    let menu = `🧀 *Escolha a Borda*\n\n`;
    menu += `*1* - Tradicional (sem borda recheada) - Grátis\n`;

    bordas.forEach((borda, index) => {
      menu += `*${index + 2}* - ${borda.nome} - +${formatarDinheiro(borda.preco)}\n`;
    });

    return menu;
  } catch (error) {
    console.error('Erro ao listar bordas:', error);
    // Continuar sem borda
    sessao.dados.bordaSelecionada = null;
    return await confirmarItem(sessao);
  }
}

// Processar escolha de borda
async function processarBorda(sessao, opcao) {
  const bordas = sessao.dados.bordas;
  const index = parseInt(opcao) - 2;

  if (opcao === '1') {
    sessao.dados.bordaSelecionada = null;
  } else if (index >= 0 && index < bordas.length) {
    sessao.dados.bordaSelecionada = bordas[index];
  } else {
    return '❌ Opção inválida. Digite o número da borda desejada.';
  }

  return await confirmarItem(sessao);
}

// Mostrar produtos da categoria
async function mostrarProdutos(sessao, categoriaId) {
  try {
    const produtos = await apiService.listarProdutosPorCategoria(categoriaId);
    const produtosAtivos = produtos.filter(p => p.ativo);

    sessao.dados.produtosDisponiveis = produtosAtivos;
    sessao.estado = 'ESCOLHER_PRODUTO';

    let menu = `📦 *${sessao.dados.categoriaAtual.nome}*\n\n`;

    produtosAtivos.forEach((prod, index) => {
      const preco = prod.preco?.preco || prod.precos?.[0]?.preco || 0;
      menu += `*${index + 1}* - ${prod.nome} - ${formatarDinheiro(preco)}\n`;
    });

    menu += `\n*0* - Voltar às categorias`;

    return menu;
  } catch (error) {
    console.error('Erro ao listar produtos:', error);
    return '❌ Erro ao carregar produtos. Digite *0* para voltar.';
  }
}

// Processar escolha de produto
async function processarProduto(sessao, opcao) {
  if (opcao === '0') {
    const menuHandler = require('./menuHandler');
    return await menuHandler.mostrarCategorias(sessao);
  }

  const produtos = sessao.dados.produtosDisponiveis;
  const index = parseInt(opcao) - 1;

  if (isNaN(index) || index < 0 || index >= produtos.length) {
    return '❌ Opção inválida. Digite o número do produto desejado.';
  }

  const produtoSelecionado = produtos[index];
  sessao.dados.produtoSelecionado = produtoSelecionado;

  // Adicionar ao carrinho diretamente (não é pizza)
  const preco = produtoSelecionado.preco?.preco || produtoSelecionado.precos?.[0]?.preco || 0;

  const item = {
    tipo: 'produto',
    produto: produtoSelecionado,
    nome: produtoSelecionado.nome,
    preco: parseFloat(preco),
    quantidade: 1
  };

  sessao.carrinho.push(item);

  sessao.estado = 'CONFIRMAR_ITEM';
  return `✅ *${produtoSelecionado.nome}* adicionado ao carrinho!

Preço: ${formatarDinheiro(preco)}

*1* - Adicionar mais itens
*2* - Finalizar pedido

Digite o número da opção:`;
}

// Confirmar item (pizza)
async function confirmarItem(sessao) {
  const tamanho = sessao.dados.tamanhoSelecionado;
  const sabores = sessao.dados.saboresSelecionados;
  const borda = sessao.dados.bordaSelecionada;

  // Calcular preço (maior preço dos sabores)
  let precoBase = 0;
  sabores.forEach(sabor => {
    const precoPizza = sabor.precos?.find(p => p.tamanho_id === tamanho.id);
    if (precoPizza && parseFloat(precoPizza.preco) > precoBase) {
      precoBase = parseFloat(precoPizza.preco);
    }
  });

  const precoBorda = borda ? parseFloat(borda.preco) : 0;
  const precoTotal = precoBase + precoBorda;

  // Montar descrição
  const descricaoSabores = sabores.map(s => s.nome).join(' + ');
  const descricaoBorda = borda ? `Borda: ${borda.nome}` : 'Borda Tradicional';

  const item = {
    tipo: 'pizza',
    tamanho: tamanho,
    sabores: sabores,
    borda: borda,
    nome: `Pizza ${tamanho.nome} ${descricaoSabores}`,
    descricao: `${descricaoSabores} | ${descricaoBorda}`,
    preco: precoTotal,
    quantidade: 1
  };

  sessao.carrinho.push(item);
  sessao.dados = { categorias: sessao.dados.categorias };
  sessao.estado = 'CONFIRMAR_ITEM';

  return `✅ *Pizza adicionada ao carrinho!*

🍕 ${tamanho.nome} - ${descricaoSabores}
🧀 ${descricaoBorda}
💰 ${formatarDinheiro(precoTotal)}

*1* - Adicionar mais itens
*2* - Finalizar pedido

Digite o número da opção:`;
}

// Processar confirmação de item
async function processarConfirmacaoItem(sessao, opcao) {
  if (opcao === '1') {
    const menuHandler = require('./menuHandler');
    return await menuHandler.mostrarCategorias(sessao);
  } else if (opcao === '2') {
    return await mostrarCarrinho(sessao);
  }

  return '❌ Digite *1* para adicionar mais itens ou *2* para finalizar.';
}

// Mostrar carrinho
async function mostrarCarrinho(sessao) {
  if (sessao.carrinho.length === 0) {
    sessao.estado = 'MENU_PRINCIPAL';
    return `🛒 Seu carrinho está vazio!

Digite *1* para fazer um pedido.`;
  }

  sessao.estado = 'CARRINHO';

  let subtotal = 0;
  let resumo = `🛒 *Seu Carrinho*\n\n`;

  sessao.carrinho.forEach((item, index) => {
    subtotal += item.preco * item.quantidade;
    resumo += `${index + 1}. ${item.nome}\n`;
    if (item.descricao) {
      resumo += `   ${item.descricao}\n`;
    }
    resumo += `   ${formatarDinheiro(item.preco)}\n\n`;
  });

  resumo += `━━━━━━━━━━━━━━━━━━
*Subtotal:* ${formatarDinheiro(subtotal)}

*1* - Continuar comprando
*2* - Remover item
*3* - Finalizar pedido
*0* - Cancelar pedido`;

  sessao.dados.subtotal = subtotal;

  return resumo;
}

// Processar ações do carrinho
async function processarCarrinho(sessao, opcao) {
  switch (opcao) {
    case '1':
      const menuHandler = require('./menuHandler');
      return await menuHandler.mostrarCategorias(sessao);

    case '2':
      if (sessao.carrinho.length === 1) {
        sessao.carrinho = [];
        sessao.estado = 'MENU_PRINCIPAL';
        return `🛒 Carrinho esvaziado.

Digite *1* para fazer um novo pedido.`;
      }

      let lista = `🗑️ *Qual item deseja remover?*\n\n`;
      sessao.carrinho.forEach((item, index) => {
        lista += `*${index + 1}* - ${item.nome}\n`;
      });
      lista += `\n*0* - Voltar`;

      sessao.estado = 'REMOVER_ITEM';
      return lista;

    case '3':
      sessao.estado = 'TIPO_ENTREGA';
      return `🚗 *Tipo de Entrega*

*1* - 🛵 Entrega (Taxa a calcular)
*2* - 🏪 Retirar no balcão (Grátis)

Digite o número da opção:`;

    case '0':
      sessao.carrinho = [];
      sessao.estado = 'MENU_PRINCIPAL';
      return `❌ Pedido cancelado.

Digite *1* para fazer um novo pedido ou *0* para menu principal.`;

    default:
      return '❌ Opção inválida. Digite 1, 2, 3 ou 0.';
  }
}

// Processar tipo de entrega
async function processarTipoEntrega(sessao, opcao) {
  if (opcao === '1') {
    sessao.dados.tipoEntrega = 'entrega';

    // Verificar se cliente tem endereço cadastrado
    const cliente = sessao.cliente;
    if (!cliente?.endereco || !cliente?.bairro) {
      // Precisa coletar endereço
      sessao.estado = 'COLETAR_ENDERECO';
      return `📍 *Endereço de Entrega*

Para entregar seu pedido, preciso do seu endereço completo.

Digite seu *endereço* (Rua, número, complemento):`;
    }

    // Cliente tem endereço, continuar
    return await mostrarEnderecoEPagamento(sessao);

  } else if (opcao === '2') {
    sessao.dados.tipoEntrega = 'retirada';
    sessao.dados.taxaEntrega = 0;
    sessao.dados.total = sessao.dados.subtotal;

    sessao.estado = 'FORMA_PAGAMENTO';
    return `🏪 *Retirada no Balcão*

📍 Rua das Pizzas, 123 - Centro

💰 *Total:* ${formatarDinheiro(sessao.dados.total)}

💳 *Forma de Pagamento:*

*1* - 💵 Dinheiro
*2* - 💳 Cartão de Crédito
*3* - 💳 Cartão de Débito
*4* - 📱 PIX

Digite o número da opção:`;
  }

  return '❌ Digite *1* para entrega ou *2* para retirada.';
}

// Processar coleta de endereço durante pedido
async function processarColetaEndereco(sessao, texto) {
  if (texto.length < 5) {
    return '❌ Por favor, digite um endereço válido com rua e número.';
  }

  sessao.dados.enderecoTemp = texto;
  sessao.estado = 'COLETAR_BAIRRO';

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

// Processar coleta de bairro durante pedido
async function processarColetaBairro(sessao, texto) {
  const taxas = sessao.dados.taxasDisponiveis;
  const opcao = parseInt(texto);

  let bairroSelecionado = '';
  let taxaEntrega = 0;

  if (taxas && opcao >= 1 && opcao <= taxas.length) {
    const taxaSelecionada = taxas[opcao - 1];
    bairroSelecionado = taxaSelecionada.bairro;
    taxaEntrega = parseFloat(taxaSelecionada.taxa);
  } else if (texto.length >= 2) {
    bairroSelecionado = texto;
    taxaEntrega = 5; // Taxa padrão para bairros não cadastrados
  } else {
    return '❌ Por favor, digite o número do bairro ou o nome do bairro.';
  }

  // Atualizar cliente no banco
  try {
    const clienteAtualizado = await apiService.atualizarCliente(sessao.cliente.id, {
      endereco: sessao.dados.enderecoTemp,
      bairro: bairroSelecionado
    });
    sessao.cliente = clienteAtualizado;
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    // Continuar mesmo com erro - usar dados locais
    sessao.cliente.endereco = sessao.dados.enderecoTemp;
    sessao.cliente.bairro = bairroSelecionado;
  }

  sessao.dados.taxaEntrega = taxaEntrega;
  sessao.dados.total = sessao.dados.subtotal + taxaEntrega;

  // Limpar dados temporários
  delete sessao.dados.enderecoTemp;
  delete sessao.dados.taxasDisponiveis;

  return await mostrarEnderecoEPagamento(sessao);
}

// Mostrar endereço confirmado e formas de pagamento
async function mostrarEnderecoEPagamento(sessao) {
  const cliente = sessao.cliente;
  let taxaEntrega = 0;

  // Buscar taxa pelo bairro do cliente
  if (cliente?.bairro) {
    try {
      const taxa = await apiService.buscarTaxaPorBairro(cliente.bairro);
      if (taxa) {
        taxaEntrega = parseFloat(taxa.taxa);
      }
    } catch (error) {
      console.error('Erro ao buscar taxa:', error);
    }
  }

  sessao.dados.taxaEntrega = taxaEntrega;
  sessao.dados.total = sessao.dados.subtotal + taxaEntrega;

  sessao.estado = 'FORMA_PAGAMENTO';
  return `📍 *Endereço de Entrega:*
${cliente.endereco}
${cliente.bairro}

🛵 *Taxa de entrega:* ${formatarDinheiro(taxaEntrega)}
💰 *Total:* ${formatarDinheiro(sessao.dados.total)}

💳 *Forma de Pagamento:*

*1* - 💵 Dinheiro
*2* - 💳 Cartão de Crédito (na entrega)
*3* - 💳 Cartão de Débito (na entrega)
*4* - 📱 PIX

Digite o número da opção:`;
}

// Processar forma de pagamento
async function processarFormaPagamento(sessao, opcao) {
  const formas = {
    '1': 'dinheiro',
    '2': 'cartao_credito',
    '3': 'cartao_debito',
    '4': 'pix'
  };

  if (!formas[opcao]) {
    return '❌ Opção inválida. Digite um número de 1 a 4.';
  }

  sessao.dados.formaPagamento = formas[opcao];

  // Se for dinheiro, perguntar sobre troco
  if (opcao === '1') {
    sessao.estado = 'TROCO_VALOR';
    return `💵 *Troco*

Total do pedido: ${formatarDinheiro(sessao.dados.total)}

Precisa de troco? Digite o valor da nota (ex: 50, 100) ou *0* se não precisa de troco.`;
  }

  // Se for PIX, mostrar chave
  if (opcao === '4') {
    sessao.dados.troco = 0;
    return await mostrarResumoPedido(sessao);
  }

  sessao.dados.troco = 0;
  return await mostrarResumoPedido(sessao);
}

// Processar valor do troco
async function processarTrocoValor(sessao, texto) {
  const valor = parseFloat(texto.replace(',', '.'));

  if (texto === '0') {
    sessao.dados.troco = 0;
  } else if (isNaN(valor) || valor < sessao.dados.total) {
    return `❌ Por favor, digite um valor válido maior que ${formatarDinheiro(sessao.dados.total)} ou *0* se não precisa de troco.`;
  } else {
    sessao.dados.troco = valor;
  }

  return await mostrarResumoPedido(sessao);
}

// Mostrar resumo do pedido
async function mostrarResumoPedido(sessao) {
  sessao.estado = 'CONFIRMAR_PEDIDO';

  const formasPagamento = {
    'dinheiro': '💵 Dinheiro',
    'cartao_credito': '💳 Cartão de Crédito',
    'cartao_debito': '💳 Cartão de Débito',
    'pix': '📱 PIX'
  };

  let resumo = `📋 *Resumo do Pedido*\n\n`;
  resumo += `👤 *Cliente:* ${sessao.cliente.nome}\n`;

  if (sessao.dados.tipoEntrega === 'entrega') {
    resumo += `📍 *Entrega:* ${sessao.cliente.endereco}, ${sessao.cliente.bairro}\n`;
  } else {
    resumo += `🏪 *Retirada no balcão*\n`;
  }

  resumo += `\n━━━ *Itens* ━━━\n`;

  sessao.carrinho.forEach((item, index) => {
    resumo += `\n${index + 1}. ${item.nome}`;
    if (item.descricao) {
      resumo += `\n   ${item.descricao}`;
    }
    resumo += `\n   ${formatarDinheiro(item.preco)}`;
  });

  resumo += `\n\n━━━━━━━━━━━━━━━━━━`;
  resumo += `\n*Subtotal:* ${formatarDinheiro(sessao.dados.subtotal)}`;

  if (sessao.dados.tipoEntrega === 'entrega') {
    resumo += `\n*Taxa Entrega:* ${formatarDinheiro(sessao.dados.taxaEntrega)}`;
  }

  resumo += `\n*TOTAL:* ${formatarDinheiro(sessao.dados.total)}`;
  resumo += `\n\n💳 *Pagamento:* ${formasPagamento[sessao.dados.formaPagamento]}`;

  if (sessao.dados.formaPagamento === 'dinheiro' && sessao.dados.troco > 0) {
    const trocoValor = sessao.dados.troco - sessao.dados.total;
    resumo += `\n💵 *Troco para:* ${formatarDinheiro(sessao.dados.troco)} (Troco: ${formatarDinheiro(trocoValor)})`;
  }

  if (sessao.dados.formaPagamento === 'pix') {
    resumo += `\n\n📱 *Chave PIX:* 77988197145 (Rogério S. O.)`;
    resumo += `\n\n⚠️ _Após enviar o pedido, envie o comprovante de pagamento aqui._`;
  }

  resumo += `\n\n━━━━━━━━━━━━━━━━━━`;
  resumo += `\n*1* - ✅ Enviar Pedido`;
  resumo += `\n*2* - ❌ Cancelar`;

  return resumo;
}

// Processar confirmação do pedido
async function processarConfirmacaoPedido(sessao, opcao, telefone) {
  if (opcao === '2') {
    sessao.carrinho = [];
    sessao.dados = {};
    sessao.estado = 'MENU_PRINCIPAL';
    return `❌ Pedido cancelado.

Digite *1* para fazer um novo pedido ou *0* para menu principal.`;
  }

  if (opcao !== '1') {
    return '❌ Digite *1* para confirmar ou *2* para cancelar.';
  }

  // Montar itens do pedido
  const itens = sessao.carrinho.map(item => {
    if (item.tipo === 'pizza') {
      return {
        produto_id: item.sabores[0].id,
        tamanho_id: item.tamanho.id,
        borda_id: item.borda?.id || null,
        quantidade: item.quantidade,
        preco_unitario: item.preco,
        observacao: item.sabores.length > 1 ? `Meio a meio: ${item.descricao}` : null
      };
    } else {
      return {
        produto_id: item.produto.id,
        quantidade: item.quantidade,
        preco_unitario: item.preco
      };
    }
  });

  // Salvar dados antes de limpar
  const tipoEntrega = sessao.dados.tipoEntrega;
  const formaPagamento = sessao.dados.formaPagamento;
  const total = sessao.dados.total;

  // Criar pedido na API
  try {
    const pedido = await apiService.criarPedido({
      cliente_id: sessao.cliente.id,
      tipo_entrega: tipoEntrega,
      forma_pagamento: formaPagamento,
      troco_para: sessao.dados.troco || null,
      endereco_entrega: tipoEntrega === 'entrega'
        ? `${sessao.cliente.endereco}, ${sessao.cliente.bairro}`
        : null,
      subtotal: sessao.dados.subtotal,
      taxa_entrega: sessao.dados.taxaEntrega,
      total: total,
      itens: itens,
      telefone: telefone
    });

    // Limpar carrinho e dados
    sessao.carrinho = [];
    sessao.dados = {};
    sessao.estado = 'MENU_PRINCIPAL';

    // Mensagem diferente para PIX
    if (formaPagamento === 'pix') {
      return `📤 *Pedido Enviado!*

🎉 Seu pedido ${formatarNumeroPedido(pedido.id)} foi recebido!

💰 *Total:* ${formatarDinheiro(total)}

📱 *Chave PIX:* 77988197145 (Rogério S. O.)

⚠️ *IMPORTANTE:* Envie o comprovante de pagamento aqui para confirmarmos seu pedido.

Aguardamos a confirmação do pagamento para iniciar o preparo.

Digite *0* para voltar ao menu principal.`;
    }

    // Mensagem para outros pagamentos
    return `📤 *Pedido Enviado!*

🎉 Seu pedido ${formatarNumeroPedido(pedido.id)} foi recebido!

💰 *Total:* ${formatarDinheiro(total)}

⏳ Aguarde a confirmação do seu pedido. Você receberá uma mensagem assim que for confirmado.

Acompanhe seu pedido digitando *2* no menu principal.

Obrigado por escolher a *LaSenhorita Pizzaria*! 🍕

Digite *0* para voltar ao menu principal.`;

  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    return `❌ Erro ao processar pedido. Por favor, tente novamente.

Digite *1* para tentar novamente ou *0* para menu principal.`;
  }
}

// Processar remoção de item do carrinho
async function processarRemoverItem(sessao, opcao) {
  if (opcao === '0') {
    return await mostrarCarrinho(sessao);
  }

  const index = parseInt(opcao) - 1;

  if (isNaN(index) || index < 0 || index >= sessao.carrinho.length) {
    return '❌ Opção inválida. Digite o número do item que deseja remover.';
  }

  const itemRemovido = sessao.carrinho[index];
  sessao.carrinho.splice(index, 1);

  if (sessao.carrinho.length === 0) {
    sessao.estado = 'MENU_PRINCIPAL';
    return `🗑️ *${itemRemovido.nome}* removido!

🛒 Seu carrinho está vazio agora.

Digite *1* para fazer um novo pedido.`;
  }

  return `🗑️ *${itemRemovido.nome}* removido!\n\n` + await mostrarCarrinho(sessao);
}

module.exports = {
  processarCategoria,
  processarTamanho,
  processarQtdSabores,
  processarSabor,
  processarSegundoSabor,
  processarBorda,
  processarProduto,
  processarConfirmacaoItem,
  processarCarrinho,
  processarRemoverItem,
  processarTipoEntrega,
  processarColetaEndereco,
  processarColetaBairro,
  processarFormaPagamento,
  processarTrocoValor,
  processarConfirmacaoPedido
};
