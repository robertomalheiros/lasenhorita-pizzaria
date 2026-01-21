const { Borda } = require('../models');
const { logAction } = require('../middlewares/logger.middleware');

const bordasController = {
  // GET /api/bordas
  async listar(req, res) {
    try {
      const bordas = await Borda.findAll({
        where: { ativo: true },
        order: [['preco', 'ASC']]
      });
      return res.json(bordas);
    } catch (error) {
      console.error('Erro ao listar bordas:', error);
      return res.status(500).json({ error: 'Erro ao listar bordas' });
    }
  },

  // GET /api/bordas/:id
  async buscarPorId(req, res) {
    try {
      const { id } = req.params;
      const borda = await Borda.findByPk(id);

      if (!borda) {
        return res.status(404).json({ error: 'Borda não encontrada' });
      }

      return res.json(borda);
    } catch (error) {
      console.error('Erro ao buscar borda:', error);
      return res.status(500).json({ error: 'Erro ao buscar borda' });
    }
  },

  // POST /api/bordas
  async criar(req, res) {
    try {
      const { nome, preco } = req.body;

      if (!nome) {
        return res.status(400).json({ error: 'Nome é obrigatório' });
      }

      const borda = await Borda.create({
        nome,
        preco: preco || 0
      });

      await logAction(req, 'CRIAR', 'bordas', borda.id, null, { nome, preco });

      return res.status(201).json(borda);
    } catch (error) {
      console.error('Erro ao criar borda:', error);
      return res.status(500).json({ error: 'Erro ao criar borda' });
    }
  },

  // PUT /api/bordas/:id
  async atualizar(req, res) {
    try {
      const { id } = req.params;
      const { nome, preco, ativo } = req.body;

      const borda = await Borda.findByPk(id);
      if (!borda) {
        return res.status(404).json({ error: 'Borda não encontrada' });
      }

      const dadosAnteriores = borda.toJSON();

      await borda.update({
        nome: nome || borda.nome,
        preco: preco !== undefined ? preco : borda.preco,
        ativo: ativo !== undefined ? ativo : borda.ativo
      });

      await logAction(req, 'ATUALIZAR', 'bordas', id, dadosAnteriores, borda.toJSON());

      return res.json(borda);
    } catch (error) {
      console.error('Erro ao atualizar borda:', error);
      return res.status(500).json({ error: 'Erro ao atualizar borda' });
    }
  },

  // DELETE /api/bordas/:id
  async deletar(req, res) {
    try {
      const { id } = req.params;

      const borda = await Borda.findByPk(id);
      if (!borda) {
        return res.status(404).json({ error: 'Borda não encontrada' });
      }

      await borda.update({ ativo: false });

      await logAction(req, 'DELETAR', 'bordas', id, { ativo: true }, { ativo: false });

      return res.json({ message: 'Borda desativada com sucesso' });
    } catch (error) {
      console.error('Erro ao deletar borda:', error);
      return res.status(500).json({ error: 'Erro ao deletar borda' });
    }
  }
};

module.exports = bordasController;
