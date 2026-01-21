const { Motoboy, Pedido } = require('../models');
const { logAction } = require('../middlewares/logger.middleware');
const { Op } = require('sequelize');

const motoboysController = {
  // GET /api/motoboys
  async listar(req, res) {
    try {
      const { ativo } = req.query;

      const where = {};
      if (ativo !== undefined) {
        where.ativo = ativo === 'true';
      }

      const motoboys = await Motoboy.findAll({
        where,
        order: [['nome', 'ASC']]
      });

      return res.json(motoboys);
    } catch (error) {
      console.error('Erro ao listar motoboys:', error);
      return res.status(500).json({ error: 'Erro ao listar motoboys' });
    }
  },

  // GET /api/motoboys/disponiveis
  async listarDisponiveis(req, res) {
    try {
      const motoboys = await Motoboy.findAll({
        where: { ativo: true, disponivel: true },
        order: [['nome', 'ASC']]
      });

      return res.json(motoboys);
    } catch (error) {
      console.error('Erro ao listar motoboys disponíveis:', error);
      return res.status(500).json({ error: 'Erro ao listar motoboys' });
    }
  },

  // GET /api/motoboys/:id
  async buscarPorId(req, res) {
    try {
      const { id } = req.params;

      const motoboy = await Motoboy.findByPk(id, {
        include: [{
          model: Pedido,
          as: 'pedidos',
          where: { status: { [Op.in]: ['saiu_entrega'] } },
          required: false,
          limit: 5
        }]
      });

      if (!motoboy) {
        return res.status(404).json({ error: 'Motoboy não encontrado' });
      }

      return res.json(motoboy);
    } catch (error) {
      console.error('Erro ao buscar motoboy:', error);
      return res.status(500).json({ error: 'Erro ao buscar motoboy' });
    }
  },

  // POST /api/motoboys
  async criar(req, res) {
    try {
      const { nome, telefone, placa_moto } = req.body;

      if (!nome) {
        return res.status(400).json({ error: 'Nome é obrigatório' });
      }

      const motoboy = await Motoboy.create({
        nome,
        telefone,
        placa_moto
      });

      await logAction(req, 'CRIAR', 'motoboys', motoboy.id, null, { nome, telefone, placa_moto });

      return res.status(201).json(motoboy);
    } catch (error) {
      console.error('Erro ao criar motoboy:', error);
      return res.status(500).json({ error: 'Erro ao criar motoboy' });
    }
  },

  // PUT /api/motoboys/:id
  async atualizar(req, res) {
    try {
      const { id } = req.params;
      const { nome, telefone, placa_moto, ativo, disponivel } = req.body;

      const motoboy = await Motoboy.findByPk(id);
      if (!motoboy) {
        return res.status(404).json({ error: 'Motoboy não encontrado' });
      }

      const dadosAnteriores = motoboy.toJSON();

      await motoboy.update({
        nome: nome || motoboy.nome,
        telefone: telefone !== undefined ? telefone : motoboy.telefone,
        placa_moto: placa_moto !== undefined ? placa_moto : motoboy.placa_moto,
        ativo: ativo !== undefined ? ativo : motoboy.ativo,
        disponivel: disponivel !== undefined ? disponivel : motoboy.disponivel
      });

      await logAction(req, 'ATUALIZAR', 'motoboys', id, dadosAnteriores, motoboy.toJSON());

      return res.json(motoboy);
    } catch (error) {
      console.error('Erro ao atualizar motoboy:', error);
      return res.status(500).json({ error: 'Erro ao atualizar motoboy' });
    }
  },

  // PATCH /api/motoboys/:id/disponibilidade
  async toggleDisponibilidade(req, res) {
    try {
      const { id } = req.params;

      const motoboy = await Motoboy.findByPk(id);
      if (!motoboy) {
        return res.status(404).json({ error: 'Motoboy não encontrado' });
      }

      const novaDisponibilidade = !motoboy.disponivel;
      await motoboy.update({ disponivel: novaDisponibilidade });

      await logAction(req, 'TOGGLE_DISPONIBILIDADE', 'motoboys', id, { disponivel: !novaDisponibilidade }, { disponivel: novaDisponibilidade });

      return res.json(motoboy);
    } catch (error) {
      console.error('Erro ao alterar disponibilidade:', error);
      return res.status(500).json({ error: 'Erro ao alterar disponibilidade' });
    }
  },

  // DELETE /api/motoboys/:id (soft delete)
  async deletar(req, res) {
    try {
      const { id } = req.params;

      const motoboy = await Motoboy.findByPk(id);
      if (!motoboy) {
        return res.status(404).json({ error: 'Motoboy não encontrado' });
      }

      await motoboy.update({ ativo: false, disponivel: false });

      await logAction(req, 'DELETAR', 'motoboys', id, { ativo: true }, { ativo: false });

      return res.json({ message: 'Motoboy desativado com sucesso' });
    } catch (error) {
      console.error('Erro ao deletar motoboy:', error);
      return res.status(500).json({ error: 'Erro ao deletar motoboy' });
    }
  }
};

module.exports = motoboysController;
