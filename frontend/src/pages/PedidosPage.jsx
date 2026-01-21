import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { pedidosService } from '../services/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { HiPlus, HiSearch, HiFilter, HiEye, HiX } from 'react-icons/hi';

const statusOptions = [
  { value: '', label: 'Todos' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'preparando', label: 'Preparando' },
  { value: 'pronto', label: 'Pronto' },
  { value: 'saiu_entrega', label: 'Saiu p/ Entrega' },
  { value: 'entregue', label: 'Entregue' },
  { value: 'cancelado', label: 'Cancelado' }
];

const tipoOptions = [
  { value: '', label: 'Todos' },
  { value: 'balcao', label: 'Balcão' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'whatsapp', label: 'WhatsApp' }
];

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    status: '',
    tipo_pedido: '',
    data_inicio: '',
    data_fim: ''
  });
  const [paginacao, setPaginacao] = useState({ page: 1, totalPages: 1, total: 0 });

  const carregarPedidos = async (page = 1) => {
    setLoading(true);
    try {
      const params = { ...filtros, page, limit: 20 };
      Object.keys(params).forEach(key => !params[key] && delete params[key]);

      const response = await pedidosService.listar(params);
      setPedidos(response.data.data);
      setPaginacao({
        page: response.data.page,
        totalPages: response.data.totalPages,
        total: response.data.total
      });
    } catch (error) {
      toast.error('Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarPedidos();
  }, []);

  const aplicarFiltros = () => {
    carregarPedidos(1);
  };

  const limparFiltros = () => {
    setFiltros({ status: '', tipo_pedido: '', data_inicio: '', data_fim: '' });
    carregarPedidos(1);
  };

  const getStatusBadge = (status) => {
    const config = {
      pendente: 'bg-yellow-100 text-yellow-800',
      confirmado: 'bg-blue-100 text-blue-800',
      preparando: 'bg-orange-100 text-orange-800',
      pronto: 'bg-green-100 text-green-800',
      saiu_entrega: 'bg-purple-100 text-purple-800',
      entregue: 'bg-gray-100 text-gray-800',
      cancelado: 'bg-red-100 text-red-800'
    };
    return config[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
        <Link
          to="/pedidos/novo"
          className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <HiPlus className="w-5 h-5 mr-2" />
          Novo Pedido
        </Link>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center gap-2 mb-4">
          <HiFilter className="w-5 h-5 text-gray-500" />
          <span className="font-medium text-gray-700">Filtros</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <select
            value={filtros.status}
            onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <select
            value={filtros.tipo_pedido}
            onChange={(e) => setFiltros({ ...filtros, tipo_pedido: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            {tipoOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <input
            type="date"
            value={filtros.data_inicio}
            onChange={(e) => setFiltros({ ...filtros, data_inicio: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            placeholder="Data início"
          />

          <input
            type="date"
            value={filtros.data_fim}
            onChange={(e) => setFiltros({ ...filtros, data_fim: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            placeholder="Data fim"
          />

          <div className="flex gap-2">
            <button
              onClick={aplicarFiltros}
              className="flex-1 flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <HiSearch className="w-4 h-4 mr-2" />
              Buscar
            </button>
            <button
              onClick={limparFiltros}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <HiX className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pedido</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pedidos.map(pedido => (
                    <tr key={pedido.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 font-medium text-gray-900">
                        #{pedido.numero_pedido}
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-gray-900">{pedido.cliente?.nome || 'Balcão'}</p>
                        {pedido.cliente?.telefone && (
                          <p className="text-sm text-gray-500">{pedido.cliente.telefone}</p>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className="capitalize">{pedido.tipo_pedido}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(pedido.status)}`}>
                          {pedido.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-medium">
                        R$ {parseFloat(pedido.total).toFixed(2)}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {format(new Date(pedido.hora_pedido), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </td>
                      <td className="px-4 py-4">
                        <button className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <HiEye className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-gray-500">
                Mostrando {pedidos.length} de {paginacao.total} pedidos
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => carregarPedidos(paginacao.page - 1)}
                  disabled={paginacao.page === 1}
                  className="px-3 py-1 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Anterior
                </button>
                <span className="px-3 py-1">
                  {paginacao.page} / {paginacao.totalPages}
                </span>
                <button
                  onClick={() => carregarPedidos(paginacao.page + 1)}
                  disabled={paginacao.page === paginacao.totalPages}
                  className="px-3 py-1 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Próximo
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
