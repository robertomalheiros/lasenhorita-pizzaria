// Formatar valor monetário
function formatarDinheiro(valor) {
  return `R$ ${parseFloat(valor).toFixed(2).replace('.', ',')}`;
}

// Formatar telefone para exibição
function formatarTelefone(telefone) {
  const limpo = telefone.replace(/\D/g, '');
  if (limpo.length === 11) {
    return `(${limpo.substring(0, 2)}) ${limpo.substring(2, 7)}-${limpo.substring(7)}`;
  } else if (limpo.length === 10) {
    return `(${limpo.substring(0, 2)}) ${limpo.substring(2, 6)}-${limpo.substring(6)}`;
  }
  return telefone;
}

// Formatar data/hora
function formatarDataHora(data) {
  const d = new Date(data);
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Formatar status do pedido
function formatarStatus(status) {
  const statusMap = {
    'pendente': '🆕 Pendente',
    'confirmado': '✅ Confirmado',
    'preparando': '👨‍🍳 Em Preparo',
    'pronto': '📦 Pronto',
    'saiu_entrega': '🛵 Saiu para Entrega',
    'entregue': '✔️ Entregue',
    'cancelado': '❌ Cancelado'
  };
  return statusMap[status] || status;
}

// Formatar forma de pagamento
function formatarFormaPagamento(forma) {
  const formaMap = {
    'dinheiro': '💵 Dinheiro',
    'cartao_credito': '💳 Cartão de Crédito',
    'cartao_debito': '💳 Cartão de Débito',
    'pix': '📱 PIX'
  };
  return formaMap[forma] || forma;
}

// Formatar tipo de entrega
function formatarTipoEntrega(tipo) {
  return tipo === 'entrega' ? '🛵 Entrega' : '🏪 Retirada no balcão';
}

// Gerar número do pedido formatado
function formatarNumeroPedido(numero) {
  return `#${String(numero).padStart(4, '0')}`;
}

// Limpar texto de caracteres especiais
function limparTexto(texto) {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

// Extrair números de uma string
function extrairNumeros(texto) {
  const match = texto.match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}

module.exports = {
  formatarDinheiro,
  formatarTelefone,
  formatarDataHora,
  formatarStatus,
  formatarFormaPagamento,
  formatarTipoEntrega,
  formatarNumeroPedido,
  limparTexto,
  extrairNumeros
};
