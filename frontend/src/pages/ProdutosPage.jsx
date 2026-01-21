import React, { useState, useEffect } from 'react';
import { produtosService, categoriasService } from '../services/api';
import toast from 'react-hot-toast';
import { HiPlus, HiPencil, HiTrash } from 'react-icons/hi';

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [categoriaAtiva, setCategoriaAtiva] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const [produtosRes, categoriasRes] = await Promise.all([
        produtosService.listar(),
        categoriasService.listar()
      ]);
      setProdutos(produtosRes.data);
      setCategorias(categoriasRes.data);
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
        <button className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
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
                <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                  <HiPencil className="w-4 h-4" />
                </button>
                <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                  <HiTrash className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
