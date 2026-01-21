const { Pedido, ItemPedido, Cliente, Produto, sequelize } = require('../models');
const { Op } = require('sequelize');

const dashboardController = {
  // GET /api/dashboard/stats
  async stats(req, res) {
    try {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      const fimHoje = new Date();
      fimHoje.setHours(23, 59, 59, 999);

      // Pedidos hoje
      const pedidosHoje = await Pedido.count({
        where: {
          hora_pedido: { [Op.between]: [hoje, fimHoje] },
          status: { [Op.ne]: 'cancelado' }
        }
      });

      // Faturamento hoje
      const faturamentoHoje = await Pedido.sum('total', {
        where: {
          hora_pedido: { [Op.between]: [hoje, fimHoje] },
          status: 'entregue'
        }
      }) || 0;

      // Ticket médio hoje
      const ticketMedio = pedidosHoje > 0 ? faturamentoHoje / pedidosHoje : 0;

      // Pedidos por status
      const pedidosPorStatus = await Pedido.findAll({
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'total']
        ],
        where: {
          hora_pedido: { [Op.between]: [hoje, fimHoje] }
        },
        group: ['status'],
        raw: true
      });

      // Total de clientes
      const totalClientes = await Cliente.count();

      // Novos clientes hoje
      const novosClientesHoje = await Cliente.count({
        where: {
          created_at: { [Op.between]: [hoje, fimHoje] }
        }
      });

      // Pedidos em andamento
      const pedidosEmAndamento = await Pedido.count({
        where: {
          status: { [Op.in]: ['pendente', 'confirmado', 'preparando', 'pronto', 'saiu_entrega'] }
        }
      });

      return res.json({
        pedidosHoje,
        faturamentoHoje: parseFloat(faturamentoHoje).toFixed(2),
        ticketMedio: parseFloat(ticketMedio).toFixed(2),
        pedidosPorStatus,
        totalClientes,
        novosClientesHoje,
        pedidosEmAndamento
      });
    } catch (error) {
      console.error('Erro ao buscar stats:', error);
      return res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
  },

  // GET /api/dashboard/pedidos-hoje
  async pedidosHoje(req, res) {
    try {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      const fimHoje = new Date();
      fimHoje.setHours(23, 59, 59, 999);

      const pedidos = await Pedido.findAll({
        where: {
          hora_pedido: { [Op.between]: [hoje, fimHoje] }
        },
        include: [
          { model: Cliente, as: 'cliente', attributes: ['id', 'nome', 'telefone'] }
        ],
        order: [['hora_pedido', 'DESC']],
        limit: 50
      });

      return res.json(pedidos);
    } catch (error) {
      console.error('Erro ao buscar pedidos de hoje:', error);
      return res.status(500).json({ error: 'Erro ao buscar pedidos' });
    }
  },

  // GET /api/dashboard/faturamento
  async faturamento(req, res) {
    try {
      const { periodo = 'semana' } = req.query;

      let dataInicio = new Date();
      let agrupamento;

      switch (periodo) {
        case 'dia':
          dataInicio.setHours(0, 0, 0, 0);
          agrupamento = sequelize.fn('date_trunc', 'hour', sequelize.col('hora_pedido'));
          break;
        case 'semana':
          dataInicio.setDate(dataInicio.getDate() - 7);
          agrupamento = sequelize.fn('date_trunc', 'day', sequelize.col('hora_pedido'));
          break;
        case 'mes':
          dataInicio.setMonth(dataInicio.getMonth() - 1);
          agrupamento = sequelize.fn('date_trunc', 'day', sequelize.col('hora_pedido'));
          break;
        default:
          dataInicio.setDate(dataInicio.getDate() - 7);
          agrupamento = sequelize.fn('date_trunc', 'day', sequelize.col('hora_pedido'));
      }

      const faturamento = await Pedido.findAll({
        attributes: [
          [agrupamento, 'periodo'],
          [sequelize.fn('SUM', sequelize.col('total')), 'total'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'pedidos']
        ],
        where: {
          hora_pedido: { [Op.gte]: dataInicio },
          status: 'entregue'
        },
        group: [agrupamento],
        order: [[agrupamento, 'ASC']],
        raw: true
      });

      // Total geral do período
      const totalPeriodo = faturamento.reduce((acc, item) => acc + parseFloat(item.total || 0), 0);
      const totalPedidos = faturamento.reduce((acc, item) => acc + parseInt(item.pedidos || 0), 0);

      return res.json({
        periodo,
        dados: faturamento,
        resumo: {
          totalFaturamento: totalPeriodo.toFixed(2),
          totalPedidos,
          ticketMedio: totalPedidos > 0 ? (totalPeriodo / totalPedidos).toFixed(2) : '0.00'
        }
      });
    } catch (error) {
      console.error('Erro ao buscar faturamento:', error);
      return res.status(500).json({ error: 'Erro ao buscar faturamento' });
    }
  },

  // GET /api/dashboard/produtos-mais-vendidos
  async produtosMaisVendidos(req, res) {
    try {
      const { limite = 10 } = req.query;

      const dataInicio = new Date();
      dataInicio.setDate(dataInicio.getDate() - 30);

      const produtos = await ItemPedido.findAll({
        attributes: [
          'produto_id',
          [sequelize.fn('SUM', sequelize.col('quantidade')), 'total_vendido']
        ],
        include: [
          { model: Produto, as: 'produto', attributes: ['nome'] },
          {
            model: Pedido,
            as: 'pedido',
            attributes: [],
            where: {
              status: 'entregue',
              hora_pedido: { [Op.gte]: dataInicio }
            }
          }
        ],
        group: ['produto_id', 'produto.id'],
        order: [[sequelize.fn('SUM', sequelize.col('quantidade')), 'DESC']],
        limit: parseInt(limite),
        raw: true,
        nest: true
      });

      return res.json(produtos);
    } catch (error) {
      console.error('Erro ao buscar produtos mais vendidos:', error);
      return res.status(500).json({ error: 'Erro ao buscar produtos mais vendidos' });
    }
  }
};

module.exports = dashboardController;
