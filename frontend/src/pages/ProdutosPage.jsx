import React, { useState, useEffect } from 'react';
import { produtosService, categoriasService, tamanhosService } from '../services/api';
import toast from 'react-hot-toast';
import { HiPlus, HiPencil, HiTrash, HiX } from 'react-icons/hi';

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [tamanhos, setTamanhos] = useState([]);
  const [categoriaAtiva, setCategoriaAtiva] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estados para modal
  const [modalAberto, setModalAberto] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [formProduto, setFormProduto] = useState({
    nome: '',
    descricao: '',
    categoria_id: '',
    is_pizza: false,
    ativo: true,
    preco: '',
    precos: []
  });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const [produtosRes, categoriasRes, tamanhosRes] = await Promise.all([
        produtosService.listar(),
        categoriasService.listar(),
        tamanhosService.listar()
      ]);
      setProdutos(produtosRes.data);
      setCategorias(categoriasRes.data);
      setTamanhos(tamanhosRes.data);
      if (categoriasRes.data.length > 0) setCategoriaAtiva(categoriasRes.data[0].id);
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const produtosFiltrados = categoriaAtiva
    ? produtos.filter(p => p.categoria_id === categoriaAtiva)
    : produtos;

  const toggleAtivo = async (produto) => {
    try {
      await produtosService.atualizar(produto.id, { ativo: !produto.ativo });
      toast.success(`Produto ${produto.ativo ? 'desativado' : 'ativado'}!`);
      carregarDados();
    } catch (error) {
      toast.error('Erro ao atualizar produto');
    }
  };

  const abrirModal = (produto = null) => {
    if (produto) {
      setProdutoEditando(produto);
      setFormProduto({
        nome: produto.nome,
        descricao: produto.descricao || '',
        categoria_id: produto.categoria_id,
        is_pizza: produto.is_pizza,
        ativo: produto.ativo,
        preco: produto.preco?.preco || '',
        precos: produto.precos?.map(p => ({
          tamanho_id: p.tamanho_id,
          preco: p.preco
        })) || tamanhos.map(t => ({ tamanho_id: t.id, preco: '' }))
      });
    } else {
      setProdutoEditando(null);
      setFormProduto({
        nome: '',
        descricao: '',
        categoria_id: categoriaAtiva || (categorias[0]?.id || ''),
        is_pizza: false,
        ativo: true,
        preco: '',
        precos: tamanhos.map(t => ({ tamanho_id: t.id, preco: '' }))
      });
    }
    setModalAberto(true);
  };

  const salvarProduto = async () => {
    if (!formProduto.nome || !formProduto.categoria_id) {
      toast.error('Preencha nome e categoria');
      return;
    }

    if (!formProduto.is_pizza && !formProduto.preco) {
      toast.error('Preencha o preço do produto');
      return;
    }

    if (formProduto.is_pizza && formProduto.precos.every(p => !p.preco)) {
      toast.error('Preencha pelo menos um preço por tamanho');
      return;
    }

    setSalvando(true);
    try {
      const dadosProduto = {
        nome: formProduto.nome,
        descricao: formProduto.descricao,
        categoria_id: formProduto.categoria_id,
        is_pizza: formProduto.is_pizza,
        ativo: formProduto.ativo
      };

      if (formProduto.is_pizza) {
        dadosProduto.precos = formProduto.precos.filter(p => p.preco);
      } else {
        dadosProduto.preco = formProduto.preco;
      }

      if (produtoEditando) {
        await produtosService.atualizar(produtoEditando.id, dadosProduto);
        toast.success('Produto atualizado!');
      } else {
        await produtosService.criar(dadosProduto);
        toast.success('Produto criado!');
      }
      setModalAberto(false);
      carregarDados();
    } catch (error) {
      toast.error('Erro ao salvar produto');
    } finally {
      setSalvando(false);
    }
  };

  const excluirProduto = async (id) => {
    if (!window.confirm('Deseja excluir este produto?')) return;
    try {
      await produtosService.deletar(id);
      toast.success('Produto excluído!');
      carregarDados();
    } catch (error) {
      toast.error('Erro ao excluir produto');
    }
  };

  const atualizarPrecoPorTamanho = (tamanhoId, valor) => {
    setFormProduto(prev => ({
      ...prev,
      precos: prev.precos.map(p =>
        p.tamanho_id === tamanhoId ? { ...p, preco: valor } : p
      )
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
        <button
          onClick={() => abrirModal()}
          className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          <HiPlus className="w-5 h-5 mr-2" />Novo Produto
        </button>
      </div>

      {/* Tabs de Categorias */}
      <div className="bg-white rounded-xl shadow-sm p-2">
        <div className="flex gap-2 overflow-x-auto">
          {categorias.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategoriaAtiva(cat.id)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                categoriaAtiva === cat.id
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat.nome}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Produtos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {produtosFiltrados.map(produto => (
          <div key={produto.id} className={`bg-white rounded-xl shadow-sm p-4 ${!produto.ativo && 'opacity-50'}`}>
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">{produto.nome}</h3>
                <p className="text-sm text-gray-500">{produto.categoria?.nome}</p>
              </div>
              {produto.is_pizza && (
                <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full">Pizza</span>
              )}
            </div>

            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{produto.descricao}</p>

            {produto.is_pizza ? (
              <div className="text-sm space-y-1">
                {produto.precos?.map(p => (
                  <div key={p.id} className="flex justify-between">
                    <span className="text-gray-600">{p.tamanho?.nome}</span>
                    <span className="font-semibold">R$ {parseFloat(p.preco).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-lg font-bold text-red-600">
                R$ {parseFloat(produto.preco?.preco || 0).toFixed(2)}
              </p>
            )}

            <div className="flex justify-between items-center mt-4 pt-3 border-t">
              <button
                onClick={() => toggleAtivo(produto)}
                className={`px-3 py-1 text-sm rounded-full ${
                  produto.ativo
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {produto.ativo ? 'Ativo' : 'Inativo'}
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => abrirModal(produto)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  <HiPencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => excluirProduto(produto.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <HiTrash className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Edição/Criação */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">
                {produtoEditando ? 'Editar Produto' : 'Novo Produto'}
              </h3>
              <button
                onClick={() => setModalAberto(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <HiX className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input
                  type="text"
                  value={formProduto.nome}
                  onChange={(e) => setFormProduto({ ...formProduto, nome: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  placeholder="Nome do produto"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  value={formProduto.descricao}
                  onChange={(e) => setFormProduto({ ...formProduto, descricao: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  placeholder="Descrição do produto"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <select
                  value={formProduto.categoria_id}
                  onChange={(e) => setFormProduto({ ...formProduto, categoria_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Selecione...</option>
                  {categorias.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.nome}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_pizza"
                  checked={formProduto.is_pizza}
                  onChange={(e) => setFormProduto({ ...formProduto, is_pizza: e.target.checked })}
                  className="w-4 h-4 text-red-600 rounded"
                />
                <label htmlFor="is_pizza" className="text-sm font-medium text-gray-700">
                  Este produto é uma pizza
                </label>
              </div>

              {formProduto.is_pizza ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preços por Tamanho</label>
                  <div className="space-y-2">
                    {tamanhos.map(tamanho => {
                      const precoAtual = formProduto.precos.find(p => p.tamanho_id === tamanho.id);
                      return (
                        <div key={tamanho.id} className="flex items-center gap-3">
                          <span className="w-24 text-sm text-gray-600">{tamanho.nome}</span>
                          <input
                            type="number"
                            step="0.01"
                            value={precoAtual?.preco || ''}
                            onChange={(e) => atualizarPrecoPorTamanho(tamanho.id, e.target.value)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                            placeholder="0.00"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formProduto.preco}
                    onChange={(e) => setFormProduto({ ...formProduto, preco: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    placeholder="0.00"
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="ativo"
                  checked={formProduto.ativo}
                  onChange={(e) => setFormProduto({ ...formProduto, ativo: e.target.checked })}
                  className="w-4 h-4 text-red-600 rounded"
                />
                <label htmlFor="ativo" className="text-sm font-medium text-gray-700">
                  Produto ativo
                </label>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setModalAberto(false)}
                className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={salvarProduto}
                disabled={salvando}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
