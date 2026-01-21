const { Pedido, ItemPedido, Cliente, Usuario, Motoboy, Produto, TamanhoPizza, Borda, TaxaEntrega, sequelize } = require('../models');
const { logAction } = require('../middlewares/logger.middleware');
const { Op } = require('sequelize');

// Gerar número do pedido
const gerarNumeroPedido = async () => {
  const hoje = new Date();
  const ano = hoje.getFullYear().toString().slice(-2);
  const mes = (hoje.getMonth() + 1).toString().padStart(2, '0');
  const dia = hoje.getDate().toString().padStart(2, '0');

  const prefixo = `${ano}${mes}${dia}`;

  const ultimoPedido = await Pedido.findOne({
    where: {
      numero_pedido: { [Op.like]: `${prefixo}%` }
    },
    order: [['numero_pedido', 'DESC']]
  });

  let sequencial = 1;
  if (ultimoPedido) {
    const ultimoSeq = parseInt(ultimoPedido.numero_pedido.slice(-4));
    sequencial = ultimoSeq + 1;
  }

  return `${prefixo}${sequencial.toString().padStart(4, '0')}`;
};

const pedidosController = {
  // GET /api/pedidos
  async listar(req, res) {
    try {
      const { status, tipo_pedido, data_inicio, data_fim, page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      const where = {};

      if (status) {
        where.status = status;
      }

      if (tipo_pedido) {
        where.tipo_pedido = tipo_pedido;
      }

      if (data_inicio || data_fim) {
        where.hora_pedido = {};
        if (data_inicio) where.hora_pedido[Op.gte] = new Date(data_inicio);
        if (data_fim) where.hora_pedido[Op.lte] = new Date(data_fim + 'T23:59:59');
      }

      const { count, rows } = await Pedido.findAndCountAll({
        where,
        include: [
          { model: Cliente, as: 'cliente', attributes: ['id', 'nome', 'telefone'] },
          { model: Usuario, as: 'usuario', attributes: ['id', 'nome'] },
          { model: Motoboy, as: 'motoboy', attributes: ['id', 'nome'] },
          {
            model: ItemPedido,
            as: 'itens',
            include: [
              { model: Produto, as: 'produto', attributes: ['id', 'nome'] },
              { model: TamanhoPizza, as: 'tamanho', attributes: ['id', 'nome'] },
              { model: Borda, as: 'borda', attributes: ['id', 'nome'] }
            ]
          }
        ],
        order: [['hora_pedido', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      return res.json({
        data: rows,
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / limit)
      });
    } catch (error) {
      console.error('Erro ao listar pedidos:', error);
      return res.status(500).json({ error: 'Erro ao listar pedidos' });
    }
  },

  // GET /api/pedidos/fila
  async listarFila(req, res) {
    try {
      const pedidos = await Pedido.findAll({
        where: {
          status: { [Op.in]: ['pendente', 'confirmado', 'preparando', 'pronto'] }
        },
        include: [
          { model: Cliente, as: 'cliente', attributes: ['id', 'nome', 'telefone'] },
          { model: Motoboy, as: 'motoboy', attributes: ['id', 'nome'] },
          {
            model: ItemPedido,
            as: 'itens',
            include: [
              { model: Produto, as: 'produto', attributes: ['id', 'nome'] },
              { model: TamanhoPizza, as: 'tamanho', attributes: ['id', 'nome'] },
              { model: Borda, as: 'borda', attributes: ['id', 'nome'] }
            ]
          }
        ],
        order: [['hora_pedido', 'ASC']]
      });

      // Agrupar por status
      const fila = {
        pendente: pedidos.filter(p => p.status === 'pendente'),
        confirmado: pedidos.filter(p => p.status === 'confirmado'),
        preparando: pedidos.filter(p => p.status === 'preparando'),
        pronto: pedidos.filter(p => p.status === 'pronto')
      };

      return res.json(fila);
    } catch (error) {
      console.error('Erro ao listar fila:', error);
      return res.status(500).json({ error: 'Erro ao listar fila de pedidos' });
    }
  },

  // GET /api/pedidos/:id
  async buscarPorId(req, res) {
    try {
      const { id } = req.params;

      const pedido = await Pedido.findByPk(id, {
        include: [
          { model: Cliente, as: 'cliente' },
          { model: Usuario, as: 'usuario', attributes: ['id', 'nome'] },
          { model: Motoboy, as: 'motoboy' },
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
  },

  // GET /api/pedidos/numero/:numero
  async buscarPorNumero(req, res) {
    try {
      const { numero } = req.params;

      const pedido = await Pedido.findOne({
        where: { numero_pedido: numero },
        include: [
          { model: Cliente, as: 'cliente' },
          { model: Motoboy, as: 'motoboy' },
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
      console.error('Erro ao buscar pedido por número:', error);
      return res.status(500).json({ error: 'Erro ao buscar pedido' });
    }
  },

  // POST /api/pedidos
  async criar(req, res) {
    const transaction = await sequelize.transaction();

    try {
      const {
        cliente_id,
        tipo_pedido,
        endereco_entrega,
        bairro_entrega,
        forma_pagamento,
        troco_para,
        observacoes,
        itens
      } = req.body;

      if (!itens || itens.length === 0) {
        await transaction.rollback();
        return res.status(400).json({ error: 'Pedido deve ter pelo menos um item' });
      }

      // Calcular taxa de entrega
      let taxa_entrega = 0;
      if (tipo_pedido === 'delivery' && bairro_entrega) {
        const taxa = await TaxaEntrega.findOne({
          where: { bairro: { [Op.iLike]: bairro_entrega }, ativo: true }
        });
        taxa_entrega = taxa ? parseFloat(taxa.taxa) : 0;
      }

      // Gerar número do pedido
      const numero_pedido = await gerarNumeroPedido();

      // Criar pedido
      const pedido = await Pedido.create({
        numero_pedido,
        cliente_id,
        usuario_id: req.userId,
        tipo_pedido: tipo_pedido || 'balcao',
        endereco_entrega,
        bairro_entrega,
        forma_pagamento,
        troco_para,
        observacoes,
        taxa_entrega,
        status: 'pendente'
      }, { transaction });

      // Criar itens do pedido
      let subtotal = 0;

      for (const item of itens) {
        const itemSubtotal = (parseFloat(item.preco_unitario) + parseFloat(item.preco_borda || 0)) * item.quantidade;
        subtotal += itemSubtotal;

        await ItemPedido.create({
          pedido_id: pedido.id,
          produto_id: item.produto_id,
          tamanho_id: item.tamanho_id || null,
          borda_id: item.borda_id || null,
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario,
          preco_borda: item.preco_borda || 0,
          subtotal: itemSubtotal,
          observacao: item.observacao,
          sabores: item.sabores || null
        }, { transaction });
      }

      // Atualizar totais do pedido
      const total = subtotal + taxa_entrega;
      await pedido.update({
        subtotal,
        total
      }, { transaction });

      await transaction.commit();

      await logAction(req, 'CRIAR', 'pedidos', pedido.id, null, { numero_pedido, tipo_pedido, total });

      // Buscar pedido completo
      const pedidoCompleto = await Pedido.findByPk(pedido.id, {
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

      return res.status(201).json(pedidoCompleto);
    } catch (error) {
      await transaction.rollback();
      console.error('Erro ao criar pedido:', error);
      return res.status(500).json({ error: 'Erro ao criar pedido' });
    }
  },

  // PUT /api/pedidos/:id
  async atualizar(req, res) {
    try {
      const { id } = req.params;
      const {
        endereco_entrega,
        bairro_entrega,
        forma_pagamento,
        troco_para,
        observacoes,
        desconto
      } = req.body;

      const pedido = await Pedido.findByPk(id);
      if (!pedido) {
        return res.status(404).json({ error: 'Pedido não encontrado' });
      }

      const dadosAnteriores = pedido.toJSON();

      // Recalcular taxa se bairro mudou
      let taxa_entrega = pedido.taxa_entrega;
      if (bairro_entrega && bairro_entrega !== pedido.bairro_entrega) {
        const taxa = await TaxaEntrega.findOne({
          where: { bairro: { [Op.iLike]: bairro_entrega }, ativo: true }
        });
        taxa_entrega = taxa ? parseFloat(taxa.taxa) : 0;
      }

      const novoDesconto = desconto !== undefined ? parseFloat(desconto) : parseFloat(pedido.desconto);
      const total = parseFloat(pedido.subtotal) + parseFloat(taxa_entrega) - novoDesconto;

      await pedido.update({
        endereco_entrega: endereco_entrega !== undefined ? endereco_entrega : pedido.endereco_entrega,
        bairro_entrega: bairro_entrega !== undefined ? bairro_entrega : pedido.bairro_entrega,
        forma_pagamento: forma_pagamento || pedido.forma_pagamento,
        troco_para: troco_para !== undefined ? troco_para : pedido.troco_para,
        observacoes: observacoes !== undefined ? observacoes : pedido.observacoes,
        taxa_entrega,
        desconto: novoDesconto,
        total
      });

      await logAction(req, 'ATUALIZAR', 'pedidos', id, dadosAnteriores, pedido.toJSON());

      return res.json(pedido);
    } catch (error) {
      console.error('Erro ao atualizar pedido:', error);
      return res.status(500).json({ error: 'Erro ao atualizar pedido' });
    }
  },

  // PATCH /api/pedidos/:id/status
  async atualizarStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const statusValidos = ['pendente', 'confirmado', 'preparando', 'pronto', 'saiu_entrega', 'entregue', 'cancelado'];

      if (!statusValidos.includes(status)) {
        return res.status(400).json({ error: 'Status inválido' });
      }

      const pedido = await Pedido.findByPk(id);
      if (!pedido) {
        return res.status(404).json({ error: 'Pedido não encontrado' });
      }

      const statusAnterior = pedido.status;
      const atualizacao = { status };

      // Registrar timestamps de acordo com o status
      const agora = new Date();
      if (status === 'confirmado' && !pedido.hora_confirmacao) {
        atualizacao.hora_confirmacao = agora;
      } else if (status === 'pronto' && !pedido.hora_pronto) {
        atualizacao.hora_pronto = agora;
      } else if (status === 'saiu_entrega' && !pedido.hora_saiu_entrega) {
        atualizacao.hora_saiu_entrega = agora;
      } else if (status === 'entregue' && !pedido.hora_entregue) {
        atualizacao.hora_entregue = agora;
      }

      await pedido.update(atualizacao);

      await logAction(req, 'ATUALIZAR_STATUS', 'pedidos', id, { status: statusAnterior }, { status });

      return res.json(pedido);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      return res.status(500).json({ error: 'Erro ao atualizar status do pedido' });
    }
  },

  // PATCH /api/pedidos/:id/motoboy
  async atribuirMotoboy(req, res) {
    try {
      const { id } = req.params;
      const { motoboy_id } = req.body;

      const pedido = await Pedido.findByPk(id);
      if (!pedido) {
        return res.status(404).json({ error: 'Pedido não encontrado' });
      }

      if (motoboy_id) {
        const motoboy = await Motoboy.findByPk(motoboy_id);
        if (!motoboy) {
          return res.status(404).json({ error: 'Motoboy não encontrado' });
        }
      }

      await pedido.update({ motoboy_id });

      await logAction(req, 'ATRIBUIR_MOTOBOY', 'pedidos', id, null, { motoboy_id });

      const pedidoAtualizado = await Pedido.findByPk(id, {
        include: [{ model: Motoboy, as: 'motoboy' }]
      });

      return res.json(pedidoAtualizado);
    } catch (error) {
      console.error('Erro ao atribuir motoboy:', error);
      return res.status(500).json({ error: 'Erro ao atribuir motoboy' });
    }
  },

  // DELETE /api/pedidos/:id (cancelar)
  async cancelar(req, res) {
    try {
      const { id } = req.params;
      const { motivo } = req.body;

      const pedido = await Pedido.findByPk(id);
      if (!pedido) {
        return res.status(404).json({ error: 'Pedido não encontrado' });
      }

      if (['entregue', 'cancelado'].includes(pedido.status)) {
        return res.status(400).json({ error: 'Não é possível cancelar este pedido' });
      }

      const statusAnterior = pedido.status;
      await pedido.update({
        status: 'cancelado',
        observacoes: motivo ? `${pedido.observacoes || ''}\n[CANCELADO] ${motivo}` : pedido.observacoes
      });

      await logAction(req, 'CANCELAR', 'pedidos', id, { status: statusAnterior }, { status: 'cancelado', motivo });

      return res.json({ message: 'Pedido cancelado com sucesso' });
    } catch (error) {
      console.error('Erro ao cancelar pedido:', error);
      return res.status(500).json({ error: 'Erro ao cancelar pedido' });
    }
  }
};

module.exports = pedidosController;
