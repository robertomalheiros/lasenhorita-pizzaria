const apiService = require('../services/apiService');
const {
  formatarDinheiro,
  formatarDataHora,
  formatarStatus,
  formatarFormaPagamento,
  formatarTipoEntrega,
  formatarNumeroPedido
} = require('../utils/formatters');

// Processar consulta de pedido
async function processarConsultaPedido(sessao, opcao, telefone) {
  if (opcao === '0') {
    sessao.estado = 'MENU_PRINCIPAL';
    const menuHandler = require('./menuHandler');
    return menuHandler.menuPrincipal();
  }

  const pedidos = sessao.dados.pedidos;
  const index = parseInt(opcao) - 1;

  if (!pedidos || isNaN(index) || index < 0 || index >= pedidos.length) {
    return '❌ Opção inválida. Digite o número do pedido ou *0* para voltar.';
  }

  try {
    const pedido = await apiService.buscarPedido(pedidos[index].id);
    return montarDetalhesPedido(pedido);
  } catch (error) {
    console.error('Erro ao buscar detalhes do pedido:', error);
    return '❌ Erro ao buscar detalhes. Tente novamente.';
  }
}

// Montar detalhes completos do pedido
function montarDetalhesPedido(pedido) {
  let detalhes = `📋 *Pedido ${formatarNumeroPedido(pedido.id)}*\n\n`;

  detalhes += `📅 *Data:* ${formatarDataHora(pedido.created_at)}\n`;
  detalhes += `📌 *Status:* ${formatarStatus(pedido.status)}\n`;
  detalhes += `🚗 *Tipo:* ${formatarTipoEntrega(pedido.tipo_entrega)}\n`;

  if (pedido.tipo_entrega === 'entrega' && pedido.endereco_entrega) {
    detalhes += `📍 *Endereço:* ${pedido.endereco_entrega}\n`;
  }

  detalhes += `\n━━━ *Itens* ━━━\n`;

  if (pedido.itens && pedido.itens.length > 0) {
    pedido.itens.forEach((item, index) => {
      const nomeProduto = item.produto?.nome || 'Produto';
      const tamanho = item.tamanho?.nome ? ` (${item.tamanho.nome})` : '';
      const borda = item.borda?.nome ? ` - Borda ${item.borda.nome}` : '';

      detalhes += `\n${index + 1}. ${nomeProduto}${tamanho}${borda}`;
      detalhes += `\n   Qtd: ${item.quantidade} x ${formatarDinheiro(item.preco_unitario)}`;

      if (item.observacao) {
        detalhes += `\n   📝 ${item.observacao}`;
      }
    });
  }

  detalhes += `\n\n━━━━━━━━━━━━━━━━━━`;
  detalhes += `\n*Subtotal:* ${formatarDinheiro(pedido.subtotal)}`;

  if (pedido.tipo_entrega === 'entrega') {
    detalhes += `\n*Taxa Entrega:* ${formatarDinheiro(pedido.taxa_entrega)}`;
  }

  if (pedido.desconto > 0) {
    detalhes += `\n*Desconto:* -${formatarDinheiro(pedido.desconto)}`;
  }

  detalhes += `\n*TOTAL:* ${formatarDinheiro(pedido.total)}`;

  detalhes += `\n\n💳 *Pagamento:* ${formatarFormaPagamento(pedido.forma_pagamento)}`;

  if (pedido.forma_pagamento === 'dinheiro' && pedido.troco_para) {
    const troco = parseFloat(pedido.troco_para) - parseFloat(pedido.total);
    detalhes += `\n💵 *Troco para:* ${formatarDinheiro(pedido.troco_para)}`;
    detalhes += `\n💵 *Troco:* ${formatarDinheiro(troco)}`;
  }

  // Informações de status específicas
  detalhes += `\n\n━━━ *Acompanhamento* ━━━\n`;

  switch (pedido.status) {
    case 'pendente':
      detalhes += `\n⏳ Aguardando confirmação da pizzaria...`;
      break;
    case 'confirmado':
      detalhes += `\n✅ Seu pedido foi confirmado!`;
      detalhes += `\n⏳ Em breve começaremos a preparar.`;
      break;
    case 'preparando':
      detalhes += `\n👨‍🍳 Sua pizza está sendo preparada!`;
      detalhes += `\n⏳ Falta pouco...`;
      break;
    case 'pronto':
      if (pedido.tipo_entrega === 'retirada') {
        detalhes += `\n📦 Seu pedido está PRONTO!`;
        detalhes += `\n🏪 Pode retirar no balcão.`;
      } else {
        detalhes += `\n📦 Seu pedido está pronto!`;
        detalhes += `\n🛵 Aguardando motoboy...`;
      }
      break;
    case 'saiu_entrega':
      detalhes += `\n🛵 Seu pedido saiu para entrega!`;
      if (pedido.motoboy?.nome) {
        detalhes += `\n👤 Motoboy: ${pedido.motoboy.nome}`;
      }
      break;
    case 'entregue':
      detalhes += `\n✔️ Pedido entregue com sucesso!`;
      detalhes += `\n😋 Bom apetite!`;
      break;
    case 'cancelado':
      detalhes += `\n❌ Este pedido foi cancelado.`;
      break;
  }

  detalhes += `\n\nDigite *0* para voltar ao menu principal.`;

  return detalhes;
}

// Buscar status rápido do pedido
async function buscarStatusRapido(pedidoId) {
  try {
    const pedido = await apiService.buscarPedido(pedidoId);
    return `📋 *Pedido ${formatarNumeroPedido(pedidoId)}*\n\n📌 Status: ${formatarStatus(pedido.status)}`;
  } catch (error) {
    return null;
  }
}

module.exports = {
  processarConsultaPedido,
  montarDetalhesPedido,
  buscarStatusRapido
};
