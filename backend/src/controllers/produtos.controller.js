const { Produto, Categoria, PrecoPizza, PrecoProduto, TamanhoPizza } = require('../models');
const { logAction } = require('../middlewares/logger.middleware');
const { Op } = require('sequelize');

const produtosController = {
  // GET /api/produtos
  async listar(req, res) {
    try {
      const { categoria_id, is_pizza, ativo } = req.query;

      const where = {};
      if (categoria_id) where.categoria_id = categoria_id;
      if (is_pizza !== undefined) where.is_pizza = is_pizza === 'true';
      if (ativo !== undefined) where.ativo = ativo === 'true';

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
  },

  // GET /api/produtos/categoria/:categoriaId
  async listarPorCategoria(req, res) {
    try {
      const { categoriaId } = req.params;

      const produtos = await Produto.findAll({
        where: { categoria_id: categoriaId, ativo: true },
        include: [
          { model: PrecoPizza, as: 'precos', include: [{ model: TamanhoPizza, as: 'tamanho' }] },
          { model: PrecoProduto, as: 'preco' }
        ],
        order: [['nome', 'ASC']]
      });

      return res.json(produtos);
    } catch (error) {
      console.error('Erro ao listar produtos por categoria:', error);
      return res.status(500).json({ error: 'Erro ao listar produtos' });
    }
  },

  // GET /api/produtos/pizzas
  async listarPizzas(req, res) {
    try {
      const produtos = await Produto.findAll({
        where: { is_pizza: true, ativo: true },
        include: [
          { model: Categoria, as: 'categoria' },
          { model: PrecoPizza, as: 'precos', include: [{ model: TamanhoPizza, as: 'tamanho' }] }
        ],
        order: [[{ model: Categoria, as: 'categoria' }, 'ordem', 'ASC'], ['nome', 'ASC']]
      });

      return res.json(produtos);
    } catch (error) {
      console.error('Erro ao listar pizzas:', error);
      return res.status(500).json({ error: 'Erro ao listar pizzas' });
    }
  },

  // GET /api/produtos/:id
  async buscarPorId(req, res) {
    try {
      const { id } = req.params;

      const produto = await Produto.findByPk(id, {
        include: [
          { model: Categoria, as: 'categoria' },
          { model: PrecoPizza, as: 'precos', include: [{ model: TamanhoPizza, as: 'tamanho' }] },
          { model: PrecoProduto, as: 'preco' }
        ]
      });

      if (!produto) {
        return res.status(404).json({ error: 'Produto não encontrado' });
      }

      return res.json(produto);
    } catch (error) {
      console.error('Erro ao buscar produto:', error);
      return res.status(500).json({ error: 'Erro ao buscar produto' });
    }
  },

  // POST /api/produtos
  async criar(req, res) {
    try {
      const { nome, descricao, categoria_id, is_pizza, imagem_url, precos, preco } = req.body;

      if (!nome || !categoria_id) {
        return res.status(400).json({ error: 'Nome e categoria são obrigatórios' });
      }

      const produto = await Produto.create({
        nome,
        descricao,
        categoria_id,
        is_pizza: is_pizza || false,
        imagem_url
      });

      // Se for pizza, criar preços por tamanho
      if (is_pizza && precos && Array.isArray(precos)) {
        for (const p of precos) {
          await PrecoPizza.create({
            produto_id: produto.id,
            tamanho_id: p.tamanho_id,
            preco: p.preco
          });
        }
      }

      // Se não for pizza, criar preço único
      if (!is_pizza && preco) {
        await PrecoProduto.create({
          produto_id: produto.id,
          preco: preco
        });
      }

      await logAction(req, 'CRIAR', 'produtos', produto.id, null, { nome, categoria_id, is_pizza });

      // Buscar produto com preços
      const produtoCompleto = await Produto.findByPk(produto.id, {
        include: [
          { model: Categoria, as: 'categoria' },
          { model: PrecoPizza, as: 'precos', include: [{ model: TamanhoPizza, as: 'tamanho' }] },
          { model: PrecoProduto, as: 'preco' }
        ]
      });

      return res.status(201).json(produtoCompleto);
    } catch (error) {
      console.error('Erro ao criar produto:', error);
      return res.status(500).json({ error: 'Erro ao criar produto' });
    }
  },

  // PUT /api/produtos/:id
  async atualizar(req, res) {
    try {
      const { id } = req.params;
      const { nome, descricao, categoria_id, imagem_url, ativo, precos, preco } = req.body;

      const produto = await Produto.findByPk(id);
      if (!produto) {
        return res.status(404).json({ error: 'Produto não encontrado' });
      }

      const dadosAnteriores = produto.toJSON();

      await produto.update({
        nome: nome || produto.nome,
        descricao: descricao !== undefined ? descricao : produto.descricao,
        categoria_id: categoria_id || produto.categoria_id,
        imagem_url: imagem_url !== undefined ? imagem_url : produto.imagem_url,
        ativo: ativo !== undefined ? ativo : produto.ativo
      });

      // Atualizar preços de pizza
      if (produto.is_pizza && precos && Array.isArray(precos)) {
        for (const p of precos) {
          await PrecoPizza.upsert({
            produto_id: produto.id,
            tamanho_id: p.tamanho_id,
            preco: p.preco
          });
        }
      }

      // Atualizar preço de não-pizza
      if (!produto.is_pizza && preco !== undefined) {
        const precoProduto = await PrecoProduto.findOne({ where: { produto_id: produto.id } });
        if (precoProduto) {
          await precoProduto.update({ preco });
        } else {
          await PrecoProduto.create({ produto_id: produto.id, preco });
        }
      }

      await logAction(req, 'ATUALIZAR', 'produtos', id, dadosAnteriores, produto.toJSON());

      const produtoAtualizado = await Produto.findByPk(id, {
        include: [
          { model: Categoria, as: 'categoria' },
          { model: PrecoPizza, as: 'precos', include: [{ model: TamanhoPizza, as: 'tamanho' }] },
          { model: PrecoProduto, as: 'preco' }
        ]
      });

      return res.json(produtoAtualizado);
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      return res.status(500).json({ error: 'Erro ao atualizar produto' });
    }
  },

  // DELETE /api/produtos/:id (soft delete)
  async deletar(req, res) {
    try {
      const { id } = req.params;

      const produto = await Produto.findByPk(id);
      if (!produto) {
        return res.status(404).json({ error: 'Produto não encontrado' });
      }

      await produto.update({ ativo: false });

      await logAction(req, 'DELETAR', 'produtos', id, { ativo: true }, { ativo: false });

      return res.json({ message: 'Produto desativado com sucesso' });
    } catch (error) {
      console.error('Erro ao deletar produto:', error);
      return res.status(500).json({ error: 'Erro ao deletar produto' });
    }
  }
};

module.exports = produtosController;
