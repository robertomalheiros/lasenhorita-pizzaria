const { Cliente, Pedido } = require('../models');
const { logAction } = require('../middlewares/logger.middleware');
const { Op } = require('sequelize');

const clientesController = {
  // GET /api/clientes
  async listar(req, res) {
    try {
      const { busca, page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      const where = {};
      if (busca) {
        where[Op.or] = [
          { nome: { [Op.iLike]: `%${busca}%` } },
          { telefone: { [Op.iLike]: `%${busca}%` } }
        ];
      }

      const { count, rows } = await Cliente.findAndCountAll({
        where,
        order: [['nome', 'ASC']],
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
      console.error('Erro ao listar clientes:', error);
      return res.status(500).json({ error: 'Erro ao listar clientes' });
    }
  },

  // GET /api/clientes/:id
  async buscarPorId(req, res) {
    try {
      const { id } = req.params;
      const cliente = await Cliente.findByPk(id, {
        include: [{
          model: Pedido,
          as: 'pedidos',
          limit: 10,
          order: [['created_at', 'DESC']]
        }]
      });

      if (!cliente) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }

      return res.json(cliente);
    } catch (error) {
      console.error('Erro ao buscar cliente:', error);
      return res.status(500).json({ error: 'Erro ao buscar cliente' });
    }
  },

  // GET /api/clientes/telefone/:telefone
  async buscarPorTelefone(req, res) {
    try {
      let { telefone } = req.params;

      // Limpar telefone (remover caracteres não numéricos)
      telefone = telefone.replace(/\D/g, '');

      const cliente = await Cliente.findOne({
        where: {
          telefone: { [Op.like]: `%${telefone}%` }
        }
      });

      if (!cliente) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }

      return res.json(cliente);
    } catch (error) {
      console.error('Erro ao buscar cliente por telefone:', error);
      return res.status(500).json({ error: 'Erro ao buscar cliente' });
    }
  },

  // POST /api/clientes
  async criar(req, res) {
    try {
      const { nome, telefone, endereco, bairro, referencia } = req.body;

      if (!nome || !telefone) {
        return res.status(400).json({ error: 'Nome e telefone são obrigatórios' });
      }

      // Limpar telefone
      const telefoneLimpo = telefone.replace(/\D/g, '');

      const telefoneExiste = await Cliente.findOne({
        where: { telefone: telefoneLimpo }
      });

      if (telefoneExiste) {
        return res.status(400).json({ error: 'Telefone já cadastrado' });
      }

      const cliente = await Cliente.create({
        nome,
        telefone: telefoneLimpo,
        endereco,
        bairro,
        referencia
      });

      await logAction(req, 'CRIAR', 'clientes', cliente.id, null, { nome, telefone: telefoneLimpo });

      return res.status(201).json(cliente);
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      return res.status(500).json({ error: 'Erro ao criar cliente' });
    }
  },

  // PUT /api/clientes/:id
  async atualizar(req, res) {
    try {
      const { id } = req.params;
      const { nome, telefone, endereco, bairro, referencia } = req.body;

      const cliente = await Cliente.findByPk(id);
      if (!cliente) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }

      const dadosAnteriores = cliente.toJSON();

      let telefoneLimpo = telefone ? telefone.replace(/\D/g, '') : cliente.telefone;

      if (telefoneLimpo !== cliente.telefone) {
        const telefoneExiste = await Cliente.findOne({
          where: { telefone: telefoneLimpo }
        });
        if (telefoneExiste) {
          return res.status(400).json({ error: 'Telefone já cadastrado' });
        }
      }

      await cliente.update({
        nome: nome || cliente.nome,
        telefone: telefoneLimpo,
        endereco: endereco !== undefined ? endereco : cliente.endereco,
        bairro: bairro !== undefined ? bairro : cliente.bairro,
        referencia: referencia !== undefined ? referencia : cliente.referencia
      });

      await logAction(req, 'ATUALIZAR', 'clientes', id, dadosAnteriores, cliente.toJSON());

      return res.json(cliente);
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      return res.status(500).json({ error: 'Erro ao atualizar cliente' });
    }
  },

  // DELETE /api/clientes/:id
  async deletar(req, res) {
    try {
      const { id } = req.params;

      const cliente = await Cliente.findByPk(id);
      if (!cliente) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }

      // Verificar se tem pedidos
      const pedidos = await Pedido.count({ where: { cliente_id: id } });
      if (pedidos > 0) {
        return res.status(400).json({
          error: 'Não é possível excluir cliente com pedidos. Existem ' + pedidos + ' pedidos vinculados.'
        });
      }

      await logAction(req, 'DELETAR', 'clientes', id, cliente.toJSON(), null);
      await cliente.destroy();

      return res.json({ message: 'Cliente excluído com sucesso' });
    } catch (error) {
      console.error('Erro ao deletar cliente:', error);
      return res.status(500).json({ error: 'Erro ao deletar cliente' });
    }
  }
};

module.exports = clientesController;
