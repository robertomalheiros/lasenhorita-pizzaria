const { Log, Usuario } = require('../models');
const { Op } = require('sequelize');

const logsController = {
  // GET /api/logs
  async listar(req, res) {
    try {
      const {
        usuario_id,
        acao,
        entidade,
        data_inicio,
        data_fim,
        page = 1,
        limit = 50
      } = req.query;

      const offset = (page - 1) * limit;
      const where = {};

      if (usuario_id) {
        where.usuario_id = usuario_id;
      }

      if (acao) {
        where.acao = acao;
      }

      if (entidade) {
        where.entidade = entidade;
      }

      if (data_inicio || data_fim) {
        where.created_at = {};
        if (data_inicio) {
          where.created_at[Op.gte] = new Date(data_inicio);
        }
        if (data_fim) {
          where.created_at[Op.lte] = new Date(data_fim + 'T23:59:59');
        }
      }

      const { count, rows } = await Log.findAndCountAll({
        where,
        include: [{
          model: Usuario,
          as: 'usuario',
          attributes: ['id', 'nome', 'email']
        }],
        order: [['created_at', 'DESC']],
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
      console.error('Erro ao listar logs:', error);
      return res.status(500).json({ error: 'Erro ao listar logs' });
    }
  },

  // GET /api/logs/acoes
  async listarAcoes(req, res) {
    try {
      const acoes = await Log.findAll({
        attributes: [[Log.sequelize.fn('DISTINCT', Log.sequelize.col('acao')), 'acao']],
        raw: true
      });

      return res.json(acoes.map(a => a.acao));
    } catch (error) {
      console.error('Erro ao listar ações:', error);
      return res.status(500).json({ error: 'Erro ao listar ações' });
    }
  },

  // GET /api/logs/entidades
  async listarEntidades(req, res) {
    try {
      const entidades = await Log.findAll({
        attributes: [[Log.sequelize.fn('DISTINCT', Log.sequelize.col('entidade')), 'entidade']],
        where: { entidade: { [Op.ne]: null } },
        raw: true
      });

      return res.json(entidades.map(e => e.entidade));
    } catch (error) {
      console.error('Erro ao listar entidades:', error);
      return res.status(500).json({ error: 'Erro ao listar entidades' });
    }
  }
};

module.exports = logsController;
