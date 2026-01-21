const { Router } = require('express');
const { Cliente, Categoria, Produto, TamanhoPizza, Borda, TaxaEntrega, Pedido, ItemPedido, PrecoPizza, PrecoProduto } = require('../models');
const { Op } = require('sequelize');

const router = Router();

// Rotas públicas para o ChatBot (sem autenticação)

// GET /api/chatbot/clientes/telefone/:telefone
router.get('/clientes/telefone/:telefone', async (req, res) => {
  try {
    let { telefone } = req.params;
    telefone = telefone.replace(/\D/g, '');

    const cliente = await Cliente.findOne({
      where: { telefone: { [Op.like]: `%${telefone}%` } }
    });

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    return res.json(cliente);
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    return res.status(500).json({ error: 'Erro ao buscar cliente' });
  }
});

// POST /api/chatbot/clientes
router.post('/clientes', async (req, res) => {
  try {
    const { nome, telefone, endereco, bairro, referencia } = req.body;

    if (!nome || !telefone) {
      return res.status(400).json({ error: 'Nome e telefone são obrigatórios' });
    }

    const telefoneLimpo = telefone.replace(/\D/g, '');

    const telefoneExiste = await Cliente.findOne({
      where: { telefone: telefoneLimpo }
    });

    if (telefoneExiste) {
      return res.json(telefoneExiste); // Retornar cliente existente
    }

    const cliente = await Cliente.create({
      nome,
      telefone: telefoneLimpo,
      endereco,
      bairro,
      referencia
    });

    return res.status(201).json(cliente);
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    return res.status(500).json({ error: 'Erro ao criar cliente' });
  }
});

// GET /api/chatbot/categorias
router.get('/categorias', async (req, res) => {
  try {
    const categorias = await Categoria.findAll({
      where: { ativo: true },
      order: [['ordem', 'ASC'], ['nome', 'ASC']]
    });
    return res.json(categorias);
  } catch (error) {
    console.error('Erro ao listar categorias:', error);
    return res.status(500).json({ error: 'Erro ao listar categorias' });
  }
});

// GET /api/chatbot/produtos?categoria_id=X
router.get('/produtos', async (req, res) => {
  try {
    const { categoria_id } = req.query;
    const where = { ativo: true };

    if (categoria_id) {
      where.categoria_id = categoria_id;
    }

    const produtos = await Produto.findAll({
      where,
      include: [
        { model: Categoria, as: 'categoria' },
        { model: PrecoPizza, as: 'precos', include: [{ model: TamanhoPizza, as: 'tamanho' }] },
        { model: PrecoProduto, as: 'preco' }
      ],
      order: [['nome', 'ASC']]
    });

    return res.json(produtos);
  } catch (error) {
    console.error('Erro ao listar produtos:', error);
    return res.status(500).json({ error: 'Erro ao listar produtos' });
  }
});

// GET /api/chatbot/tamanhos
router.get('/tamanhos', async (req, res) => {
  try {
    const tamanhos = await TamanhoPizza.findAll({
      where: { ativo: true },
      order: [['ordem', 'ASC']]
    });
    return res.json(tamanhos);
  } catch (error) {
    console.error('Erro ao listar tamanhos:', error);
    return res.status(500).json({ error: 'Erro ao listar tamanhos' });
  }
});

// GET /api/chatbot/bordas
router.get('/bordas', async (req, res) => {
  try {
    const bordas = await Borda.findAll({
      where: { ativo: true },
      order: [['nome', 'ASC']]
    });
    return res.json(bordas);
  } catch (error) {
    console.error('Erro ao listar bordas:', error);
    return res.status(500).json({ error: 'Erro ao listar bordas' });
  }
});

// GET /api/chatbot/taxas
router.get('/taxas', async (req, res) => {
  try {
    const taxas = await TaxaEntrega.findAll({
      where: { ativo: true },
      order: [['bairro', 'ASC']]
    });
    return res.json(taxas);
  } catch (error) {
    console.error('Erro ao listar taxas:', error);
    return res.status(500).json({ error: 'Erro ao listar taxas' });
  }
});

// GET /api/chatbot/taxas/bairro/:bairro
router.get('/taxas/bairro/:bairro', async (req, res) => {
  try {
    const { bairro } = req.params;

    const taxa = await TaxaEntrega.findOne({
      where: {
        bairro: { [Op.iLike]: `%${bairro}%` },
        ativo: true
      }
    });

    if (!taxa) {
      return res.status(404).json({ error: 'Bairro não encontrado' });
    }

    return res.json(taxa);
  } catch (error) {
    console.error('Erro ao buscar taxa:', error);
    return res.status(500).json({ error: 'Erro ao buscar taxa' });
  }
});

// Função para gerar número do pedido
async function gerarNumeroPedido() {
  const hoje = new Date();
  const ano = hoje.getFullYear().toString().slice(-2);
  const mes = (hoje.getMonth() + 1).toString().padStart(2, '0');
  const dia = hoje.getDate().toString().padStart(2, '0');
  const prefixo = `${ano}${mes}${dia}`;

  // Buscar último pedido do dia
  const ultimoPedido = await Pedido.findOne({
    where: {
      numero_pedido: { [Op.like]: `${prefixo}%` }
    },
    order: [['numero_pedido', 'DESC']]
  });

  let sequencia = 1;
  if (ultimoPedido) {
    const ultimaSequencia = parseInt(ultimoPedido.numero_pedido.slice(-4));
    sequencia = ultimaSequencia + 1;
  }

  return `${prefixo}${sequencia.toString().padStart(4, '0')}`;
}

// POST /api/chatbot/pedidos
router.post('/pedidos', async (req, res) => {
  try {
    const {
      cliente_id,
      tipo_entrega,
      forma_pagamento,
      troco_para,
      endereco_entrega,
      subtotal,
      taxa_entrega,
      total,
      itens
    } = req.body;

    // Validações
    if (!cliente_id || !tipo_entrega || !forma_pagamento || !itens || itens.length === 0) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }

    // Gerar número do pedido
    const numero_pedido = await gerarNumeroPedido();

    // Mapear tipo_entrega para tipo_pedido do modelo
    const tipo_pedido = tipo_entrega === 'entrega' ? 'delivery' : 'balcao';

    // Criar pedido
    const pedido = await Pedido.create({
      numero_pedido,
      cliente_id,
      tipo_pedido,
      forma_pagamento,
      troco_para,
      endereco_entrega,
      subtotal,
      taxa_entrega: taxa_entrega || 0,
      total,
      status: 'pendente'
    });

    // Criar itens do pedido
    for (const item of itens) {
      const itemSubtotal = parseFloat(item.preco_unitario) * (item.quantidade || 1);
      await ItemPedido.create({
        pedido_id: pedido.id,
        produto_id: item.produto_id,
        tamanho_id: item.tamanho_id || null,
        borda_id: item.borda_id || null,
        quantidade: item.quantidade || 1,
        preco_unitario: item.preco_unitario,
        subtotal: itemSubtotal,
        observacao: item.observacao || null
      });
    }

    return res.status(201).json(pedido);
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    return res.status(500).json({ error: 'Erro ao criar pedido' });
  }
});

// GET /api/chatbot/pedidos/cliente/:cliente_id
router.get('/pedidos/cliente/:cliente_id', async (req, res) => {
  try {
    const { cliente_id } = req.params;

    const pedidos = await Pedido.findAll({
      where: { cliente_id },
      order: [['created_at', 'DESC']],
      limit: 10
    });

    return res.json(pedidos);
  } catch (error) {
    console.error('Erro ao listar pedidos:', error);
    return res.status(500).json({ error: 'Erro ao listar pedidos' });
  }
});

// GET /api/chatbot/pedidos/:id
router.get('/pedidos/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const pedido = await Pedido.findByPk(id, {
      include: [
        { model: Cliente, as: 'cliente' },
        {
          model: ItemPedido,
          as: 'itens',
          include: [
            { model: Produto, as: 'produto' },
            { model: TamanhoPizza, as: 'tamanho' },
            { model: Borda, as: 'borda' }
          ]
        }
      ]
    });

    if (!pedido) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    return res.json(pedido);
  } catch (error) {
    console.error('Erro ao buscar pedido:', error);
    return res.status(500).json({ error: 'Erro ao buscar pedido' });
  }
});

module.exports = router;
