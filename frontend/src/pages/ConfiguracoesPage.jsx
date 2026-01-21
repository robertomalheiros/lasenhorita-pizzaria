import React, { useState, useEffect } from 'react';
import { tamanhosService, bordasService, taxasService } from '../services/api';
import toast from 'react-hot-toast';
import { HiPlus, HiPencil, HiTrash } from 'react-icons/hi';

export default function ConfiguracoesPage() {
  const [tamanhos, setTamanhos] = useState([]);
  const [bordas, setBordas] = useState([]);
  const [taxas, setTaxas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabAtiva, setTabAtiva] = useState('tamanhos');

  useEffect(() => { carregarDados(); }, []);

  const carregarDados = async () => {
    try {
      const [tamanhosRes, bordasRes, taxasRes] = await Promise.all([
        tamanhosService.listar(),
        bordasService.listar(),
        taxasService.listar()
      ]);
      setTamanhos(tamanhosRes.data);
      setBordas(bordasRes.data);
      setTaxas(taxasRes.data);
    } catch (error) {
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm p-2">
        <div className="flex gap-2">
          {[
            { id: 'tamanhos', label: '📏 Tamanhos de Pizza' },
            { id: 'bordas', label: '🧀 Bordas' },
            { id: 'taxas', label: '🛵 Taxas de Entrega' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setTabAtiva(tab.id)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                tabAtiva === tab.id ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tamanhos */}
      {tabAtiva === 'tamanhos' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="font-semibold">Tamanhos de Pizza</h2>
            <button className="flex items-center px-3 py-1 bg-red-600 text-white rounded-lg text-sm">
              <HiPlus className="w-4 h-4 mr-1" /> Adicionar
            </button>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fatias</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Máx. Sabores</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tamanhos.map(t => (
                <tr key={t.id}>
                  <td className="px-4 py-3 font-medium">{t.nome}</td>
                  <td className="px-4 py-3">{t.fatias}</td>
                  <td className="px-4 py-3">{t.max_sabores}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button className="p-1 text-blue-600 hover:bg-blue-50 rounded"><HiPencil className="w-4 h-4" /></button>
                      <button className="p-1 text-red-600 hover:bg-red-50 rounded"><HiTrash className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Bordas */}
      {tabAtiva === 'bordas' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="font-semibold">Bordas</h2>
            <button className="flex items-center px-3 py-1 bg-red-600 text-white rounded-lg text-sm">
              <HiPlus className="w-4 h-4 mr-1" /> Adicionar
            </button>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Preço</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {bordas.map(b => (
                <tr key={b.id}>
                  <td className="px-4 py-3 font-medium">{b.nome}</td>
                  <td className="px-4 py-3">R$ {parseFloat(b.preco).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button className="p-1 text-blue-600 hover:bg-blue-50 rounded"><HiPencil className="w-4 h-4" /></button>
                      <button className="p-1 text-red-600 hover:bg-red-50 rounded"><HiTrash className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Taxas */}
      {tabAtiva === 'taxas' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="font-semibold">Taxas de Entrega</h2>
            <button className="flex items-center px-3 py-1 bg-red-600 text-white rounded-lg text-sm">
              <HiPlus className="w-4 h-4 mr-1" /> Adicionar
            </button>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bairro</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Taxa</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tempo Est.</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {taxas.map(t => (
                <tr key={t.id}>
                  <td className="px-4 py-3 font-medium">{t.bairro}</td>
                  <td className="px-4 py-3">R$ {parseFloat(t.taxa).toFixed(2)}</td>
                  <td className="px-4 py-3">{t.tempo_estimado} min</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button className="p-1 text-blue-600 hover:bg-blue-50 rounded"><HiPencil className="w-4 h-4" /></button>
                      <button className="p-1 text-red-600 hover:bg-red-50 rounded"><HiTrash className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
