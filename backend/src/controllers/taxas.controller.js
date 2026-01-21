const { TaxaEntrega } = require('../models');
const { logAction } = require('../middlewares/logger.middleware');
const { Op } = require('sequelize');

const taxasController = {
  // GET /api/taxas
  async listar(req, res) {
    try {
      const taxas = await TaxaEntrega.findAll({
        where: { ativo: true },
        order: [['taxa', 'ASC']]
      });
      return res.json(taxas);
    } catch (error) {
      console.error('Erro ao listar taxas:', error);
      return res.status(500).json({ error: 'Erro ao listar taxas' });
    }
  },

  // GET /api/taxas/bairro/:bairro
  async buscarPorBairro(req, res) {
    try {
      const { bairro } = req.params;

      const taxa = await TaxaEntrega.findOne({
        where: {
          bairro: { [Op.iLike]: `%${bairro}%` },
          ativo: true
        }
      });

      if (!taxa) {
        // Retornar taxa "Outros" como fallback
        const taxaOutros = await TaxaEntrega.findOne({
          where: { bairro: { [Op.iLike]: 'outros' }, ativo: true }
        });

        if (taxaOutros) {
          return res.json(taxaOutros);
        }

        return res.status(404).json({ error: 'Taxa não encontrada para este bairro' });
      }

      return res.json(taxa);
    } catch (error) {
      console.error('Erro ao buscar taxa por bairro:', error);
      return res.status(500).json({ error: 'Erro ao buscar taxa' });
    }
  },

  // POST /api/taxas
  async criar(req, res) {
    try {
      const { bairro, taxa, tempo_estimado } = req.body;

      if (!bairro || taxa === undefined) {
        return res.status(400).json({ error: 'Bairro e taxa são obrigatórios' });
      }

      const taxaExistente = await TaxaEntrega.findOne({
        where: { bairro: { [Op.iLike]: bairro } }
      });

      if (taxaExistente) {
        return res.status(400).json({ error: 'Já existe taxa para este bairro' });
      }

      const novaTaxa = await TaxaEntrega.create({
        bairro,
        taxa,
        tempo_estimado
      });

      await logAction(req, 'CRIAR', 'taxas_entrega', novaTaxa.id, null, { bairro, taxa, tempo_estimado });

      return res.status(201).json(novaTaxa);
    } catch (error) {
      console.error('Erro ao criar taxa:', error);
      return res.status(500).json({ error: 'Erro ao criar taxa' });
    }
  },

  // PUT /api/taxas/:id
  async atualizar(req, res) {
    try {
      const { id } = req.params;
      const { bairro, taxa, tempo_estimado, ativo } = req.body;

      const taxaEntrega = await TaxaEntrega.findByPk(id);
      if (!taxaEntrega) {
        return res.status(404).json({ error: 'Taxa não encontrada' });
      }

      const dadosAnteriores = taxaEntrega.toJSON();

      await taxaEntrega.update({
        bairro: bairro || taxaEntrega.bairro,
        taxa: taxa !== undefined ? taxa : taxaEntrega.taxa,
        tempo_estimado: tempo_estimado !== undefined ? tempo_estimado : taxaEntrega.tempo_estimado,
        ativo: ativo !== undefined ? ativo : taxaEntrega.ativo
      });

      await logAction(req, 'ATUALIZAR', 'taxas_entrega', id, dadosAnteriores, taxaEntrega.toJSON());

      return res.json(taxaEntrega);
    } catch (error) {
      console.error('Erro ao atualizar taxa:', error);
      return res.status(500).json({ error: 'Erro ao atualizar taxa' });
    }
  },

  // DELETE /api/taxas/:id
  async deletar(req, res) {
    try {
      const { id } = req.params;

      const taxaEntrega = await TaxaEntrega.findByPk(id);
      if (!taxaEntrega) {
        return res.status(404).json({ error: 'Taxa não encontrada' });
      }

      await taxaEntrega.update({ ativo: false });

      await logAction(req, 'DELETAR', 'taxas_entrega', id, { ativo: true }, { ativo: false });

      return res.json({ message: 'Taxa desativada com sucesso' });
    } catch (error) {
      console.error('Erro ao deletar taxa:', error);
      return res.status(500).json({ error: 'Erro ao deletar taxa' });
    }
  }
};

module.exports = taxasController;
