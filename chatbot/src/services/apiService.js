const axios = require('axios');

const API_URL = process.env.API_URL || 'http://backend:3001/api/chatbot';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000
});

// Clientes
async function buscarClientePorTelefone(telefone) {
  try {
    // Limpar telefone (remover caracteres não numéricos)
    const telefoneLimpo = telefone.replace(/\D/g, '');
    const response = await api.get(`/clientes/telefone/${telefoneLimpo}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

async function cadastrarCliente(dados) {
  const response = await api.post('/clientes', dados);
  return response.data;
}

// Categorias
async function listarCategorias() {
  const response = await api.get('/categorias');
  return response.data;
}

// Produtos
async function listarProdutosPorCategoria(categoriaId) {
  const response = await api.get(`/produtos?categoria_id=${categoriaId}`);
  return response.data;
}

async function buscarProduto(produtoId) {
  const response = await api.get(`/produtos/${produtoId}`);
  return response.data;
}

// Tamanhos de Pizza
async function listarTamanhos() {
  const response = await api.get('/tamanhos');
  return response.data;
}

// Bordas
async function listarBordas() {
  const response = await api.get('/bordas');
  return response.data;
}

// Taxas de Entrega
async function buscarTaxaPorBairro(bairro) {
  try {
    const response = await api.get(`/taxas/bairro/${encodeURIComponent(bairro)}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

async function listarTaxas() {
  const response = await api.get('/taxas');
  return response.data;
}

// Pedidos
async function criarPedido(dados) {
  const response = await api.post('/pedidos', dados);
  return response.data;
}

async function buscarPedidosCliente(clienteId) {
  const response = await api.get(`/pedidos/cliente/${clienteId}`);
  return response.data;
}

async function buscarPedido(pedidoId) {
  const response = await api.get(`/pedidos/${pedidoId}`);
  return response.data;
}

module.exports = {
  buscarClientePorTelefone,
  cadastrarCliente,
  listarCategorias,
  listarProdutosPorCategoria,
  buscarProduto,
  listarTamanhos,
  listarBordas,
  buscarTaxaPorBairro,
  listarTaxas,
  criarPedido,
  buscarPedidosCliente,
  buscarPedido
};
