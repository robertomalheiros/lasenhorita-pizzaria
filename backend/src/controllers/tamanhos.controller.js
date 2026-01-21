const { TamanhoPizza } = require('../models');
const { logAction } = require('../middlewares/logger.middleware');

const tamanhosController = {
  // GET /api/tamanhos
  async listar(req, res) {
    try {
      const tamanhos = await TamanhoPizza.findAll({
        where: { ativo: true },
        order: [['id', 'ASC']]
      });
      return res.json(tamanhos);
    } catch (error) {
      console.error('Erro ao listar tamanhos:', error);
      return res.status(500).json({ error: 'Erro ao listar tamanhos' });
    }
  },

  // GET /api/tamanhos/:id
  async buscarPorId(req, res) {
    try {
      const { id } = req.params;
      const tamanho = await TamanhoPizza.findByPk(id);

      if (!tamanho) {
        return res.status(404).json({ error: 'Tamanho não encontrado' });
      }

      return res.json(tamanho);
    } catch (error) {
      console.error('Erro ao buscar tamanho:', error);
      return res.status(500).json({ error: 'Erro ao buscar tamanho' });
    }
  },

  // POST /api/tamanhos
  async criar(req, res) {
    try {
      const { nome, fatias, max_sabores } = req.body;

      if (!nome) {
        return res.status(400).json({ error: 'Nome é obrigatório' });
      }

      const tamanho = await TamanhoPizza.create({
        nome,
        fatias: fatias || null,
        max_sabores: max_sabores || 1
      });

      await logAction(req, 'CRIAR', 'tamanhos_pizza', tamanho.id, null, { nome, fatias, max_sabores });

      return res.status(201).json(tamanho);
    } catch (error) {
      console.error('Erro ao criar tamanho:', error);
      return res.status(500).json({ error: 'Erro ao criar tamanho' });
    }
  },

  // PUT /api/tamanhos/:id
  async atualizar(req, res) {
    try {
      const { id } = req.params;
      const { nome, fatias, max_sabores, ativo } = req.body;

      const tamanho = await TamanhoPizza.findByPk(id);
      if (!tamanho) {
        return res.status(404).json({ error: 'Tamanho não encontrado' });
      }

      const dadosAnteriores = tamanho.toJSON();

      await tamanho.update({
        nome: nome || tamanho.nome,
        fatias: fatias !== undefined ? fatias : tamanho.fatias,
        max_sabores: max_sabores !== undefined ? max_sabores : tamanho.max_sabores,
        ativo: ativo !== undefined ? ativo : tamanho.ativo
      });

      await logAction(req, 'ATUALIZAR', 'tamanhos_pizza', id, dadosAnteriores, tamanho.toJSON());

      return res.json(tamanho);
    } catch (error) {
      console.error('Erro ao atualizar tamanho:', error);
      return res.status(500).json({ error: 'Erro ao atualizar tamanho' });
    }
  },

  // DELETE /api/tamanhos/:id
  async deletar(req, res) {
    try {
      const { id } = req.params;

      const tamanho = await TamanhoPizza.findByPk(id);
      if (!tamanho) {
        return res.status(404).json({ error: 'Tamanho não encontrado' });
      }

      await tamanho.update({ ativo: false });

      await logAction(req, 'DELETAR', 'tamanhos_pizza', id, { ativo: true }, { ativo: false });

      return res.json({ message: 'Tamanho desativado com sucesso' });
    } catch (error) {
      console.error('Erro ao deletar tamanho:', error);
      return res.status(500).json({ error: 'Erro ao deletar tamanho' });
    }
  }
};

module.exports = tamanhosController;
