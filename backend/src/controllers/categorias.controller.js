const { Categoria, Produto } = require('../models');
const { logAction } = require('../middlewares/logger.middleware');

const categoriasController = {
  // GET /api/categorias
  async listar(req, res) {
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
  },

  // GET /api/categorias/:id
  async buscarPorId(req, res) {
    try {
      const { id } = req.params;
      const categoria = await Categoria.findByPk(id, {
        include: [{
          model: Produto,
          as: 'produtos',
          where: { ativo: true },
          required: false
        }]
      });

      if (!categoria) {
        return res.status(404).json({ error: 'Categoria não encontrada' });
      }

      return res.json(categoria);
    } catch (error) {
      console.error('Erro ao buscar categoria:', error);
      return res.status(500).json({ error: 'Erro ao buscar categoria' });
    }
  },

  // POST /api/categorias
  async criar(req, res) {
    try {
      const { nome, descricao, ordem } = req.body;

      if (!nome) {
        return res.status(400).json({ error: 'Nome é obrigatório' });
      }

      const categoria = await Categoria.create({
        nome,
        descricao,
        ordem: ordem || 0
      });

      await logAction(req, 'CRIAR', 'categorias', categoria.id, null, { nome, descricao, ordem });

      return res.status(201).json(categoria);
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      return res.status(500).json({ error: 'Erro ao criar categoria' });
    }
  },

  // PUT /api/categorias/:id
  async atualizar(req, res) {
    try {
      const { id } = req.params;
      const { nome, descricao, ordem, ativo } = req.body;

      const categoria = await Categoria.findByPk(id);
      if (!categoria) {
        return res.status(404).json({ error: 'Categoria não encontrada' });
      }

      const dadosAnteriores = categoria.toJSON();

      await categoria.update({
        nome: nome || categoria.nome,
        descricao: descricao !== undefined ? descricao : categoria.descricao,
        ordem: ordem !== undefined ? ordem : categoria.ordem,
        ativo: ativo !== undefined ? ativo : categoria.ativo
      });

      await logAction(req, 'ATUALIZAR', 'categorias', id, dadosAnteriores, categoria.toJSON());

      return res.json(categoria);
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);
      return res.status(500).json({ error: 'Erro ao atualizar categoria' });
    }
  },

  // DELETE /api/categorias/:id
  async deletar(req, res) {
    try {
      const { id } = req.params;

      const categoria = await Categoria.findByPk(id);
      if (!categoria) {
        return res.status(404).json({ error: 'Categoria não encontrada' });
      }

      // Verificar se tem produtos
      const produtos = await Produto.count({ where: { categoria_id: id, ativo: true } });
      if (produtos > 0) {
        return res.status(400).json({
          error: 'Não é possível excluir categoria com produtos ativos'
        });
      }

      await categoria.update({ ativo: false });

      await logAction(req, 'DELETAR', 'categorias', id, { ativo: true }, { ativo: false });

      return res.json({ message: 'Categoria desativada com sucesso' });
    } catch (error) {
      console.error('Erro ao deletar categoria:', error);
      return res.status(500).json({ error: 'Erro ao deletar categoria' });
    }
  }
};

module.exports = categoriasController;
