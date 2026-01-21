import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { produtosService, tamanhosService, bordasService, clientesService, taxasService, pedidosService } from '../services/api';
import toast from 'react-hot-toast';
import { HiPlus, HiMinus, HiTrash, HiSearch, HiUserAdd } from 'react-icons/hi';

export default function NovoPedidoPage() {
  const navigate = useNavigate();
  const {
    items, addItem, removeItem, updateQuantidade,
    cliente, setCliente,
    tipoPedido, setTipoPedido,
    enderecoEntrega, setEnderecoEntrega,
    bairroEntrega, setBairroEntrega,
    taxaEntrega, setTaxaEntrega,
    formaPagamento, setFormaPagamento,
    trocoPara, setTrocoPara,
    observacoes, setObservacoes,
    subtotal, total,
    clearCart, prepararPedido
  } = useCart();

  const [produtos, setProdutos] = useState([]);
  const [tamanhos, setTamanhos] = useState([]);
  const [bordas, setBordas] = useState([]);
  const [taxas, setTaxas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  // Modal de adicionar item
  const [modalAberto, setModalAberto] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [tamanhoSelecionado, setTamanhoSelecionado] = useState(null);
  const [bordaSelecionada, setBordaSelecionada] = useState(null);
  const [quantidade, setQuantidade] = useState(1);

  // Busca de cliente
  const [buscaTelefone, setBuscaTelefone] = useState('');
  const [buscandoCliente, setBuscandoCliente] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
    if (tipoPedido === 'delivery' && bairroEntrega) {
      const taxa = taxas.find(t => t.bairro.toLowerCase() === bairroEntrega.toLowerCase());
      setTaxaEntrega(taxa ? parseFloat(taxa.taxa) : 0);
    } else {
      setTaxaEntrega(0);
    }
  }, [tipoPedido, bairroEntrega, taxas]);

  const carregarDados = async () => {
    try {
      const [produtosRes, tamanhosRes, bordasRes, taxasRes] = await Promise.all([
        produtosService.listar({ ativo: true }),
        tamanhosService.listar(),
        bordasService.listar(),
        taxasService.listar()
      ]);
      setProdutos(produtosRes.data);
      setTamanhos(tamanhosRes.data);
      setBordas(bordasRes.data);
      setTaxas(taxasRes.data);
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const buscarCliente = async () => {
    if (!buscaTelefone) return;
    setBuscandoCliente(true);
    try {
      const response = await clientesService.buscarPorTelefone(buscaTelefone);
      setCliente(response.data);
      setEnderecoEntrega(response.data.endereco || '');
      setBairroEntrega(response.data.bairro || '');
      toast.success('Cliente encontrado!');
    } catch (error) {
      if (error.response?.status === 404) {
        toast.error('Cliente não encontrado');
      }
    } finally {
      setBuscandoCliente(false);
    }
  };

  const abrirModalProduto = (produto) => {
    setProdutoSelecionado(produto);
    setTamanhoSelecionado(null); // Não pré-selecionar tamanho
    setBordaSelecionada(produto.is_pizza && bordas.length > 0 ? bordas[0] : null); // Borda tradicional como padrão
    setQuantidade(1);
    setModalAberto(true);
  };

  const getPreco = () => {
    if (!produtoSelecionado) return 0;

    if (produtoSelecionado.is_pizza && tamanhoSelecionado) {
      const preco = produtoSelecionado.precos?.find(p => p.tamanho_id === tamanhoSelecionado.id);
      return preco ? parseFloat(preco.preco) : 0;
    }

    return produtoSelecionado.preco?.preco ? parseFloat(produtoSelecionado.preco.preco) : 0;
  };

  const adicionarItem = () => {
    if (!produtoSelecionado) return;

    const precoUnitario = getPreco();
    const precoBorda = produtoSelecionado.is_pizza && bordaSelecionada ? parseFloat(bordaSelecionada.preco) : 0;

    addItem({
      produto: produtoSelecionado,
      tamanho: tamanhoSelecionado,
      borda: bordaSelecionada,
      quantidade,
      precoUnitario,
      precoBorda
    });

    setModalAberto(false);
    toast.success('Item adicionado!');
  };

  const finalizarPedido = async () => {
    if (items.length === 0) {
      toast.error('Adicione pelo menos um item');
      return;
    }

    if (!formaPagamento) {
      toast.error('Selecione a forma de pagamento');
      return;
    }

    if (tipoPedido === 'delivery' && !enderecoEntrega) {
      toast.error('Informe o endereço de entrega');
      return;
    }

    setSalvando(true);
    try {
      const pedidoData = prepararPedido();
      const response = await pedidosService.criar(pedidoData);
      toast.success(`Pedido #${response.data.numero_pedido} criado!`);
      clearCart();
      navigate('/');
    } catch (error) {
      toast.error('Erro ao criar pedido');
    } finally {
      setSalvando(false);
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
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Novo Pedido</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cliente */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Cliente</h2>
            <div className="flex gap-4 mb-4">
              <input
                type="text"
                value={buscaTelefone}
                onChange={(e) => setBuscaTelefone(e.target.value)}
                placeholder="Buscar por telefone..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              <button
                onClick={buscarCliente}
                disabled={buscandoCliente}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {buscandoCliente ? '...' : <HiSearch className="w-5 h-5" />}
              </button>
            </div>

            {cliente ? (
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="font-medium">{cliente.nome}</p>
                <p className="text-sm text-gray-600">{cliente.telefone}</p>
                {cliente.endereco && <p className="text-sm text-gray-600">{cliente.endereco}</p>}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Cliente não selecionado (Balcão)</p>
            )}
          </div>

          {/* Tipo de Pedido */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Tipo de Pedido</h2>
            <div className="flex gap-4">
              {['balcao', 'delivery', 'whatsapp'].map(tipo => (
                <button
                  key={tipo}
                  onClick={() => setTipoPedido(tipo)}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                    tipoPedido === tipo
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                </button>
              ))}
            </div>

            {tipoPedido === 'delivery' && (
              <div className="mt-4 space-y-4">
                <input
                  type="text"
                  value={enderecoEntrega}
                  onChange={(e) => setEnderecoEntrega(e.target.value)}
                  placeholder="Endereço de entrega"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
                <select
                  value={bairroEntrega}
                  onChange={(e) => setBairroEntrega(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Selecione o bairro</option>
                  {taxas.map(t => (
                    <option key={t.id} value={t.bairro}>{t.bairro} - R$ {parseFloat(t.taxa).toFixed(2)}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Produtos */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Adicionar Itens</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-80 overflow-y-auto">
              {produtos.filter(p => p.ativo).map(produto => (
                <button
                  key={produto.id}
                  onClick={() => abrirModalProduto(produto)}
                  className="p-3 border border-gray-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-colors text-left"
                >
                  <p className="font-medium text-sm truncate">{produto.nome}</p>
                  <p className="text-xs text-gray-500">{produto.categoria?.nome}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Carrinho */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-6 sticky top-20">
            <h2 className="text-lg font-semibold mb-4">Carrinho</h2>

            {items.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Carrinho vazio</p>
            ) : (
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {items.map(item => (
                  <div key={item.tempId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.produto.nome}</p>
                      {item.tamanho && <p className="text-xs text-gray-500">{item.tamanho.nome}</p>}
                      <p className="text-sm font-semibold text-red-600">R$ {item.subtotal.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantidade(item.tempId, item.quantidade - 1)}
                        className="p-1 bg-gray-200 rounded"
                      >
                        <HiMinus className="w-4 h-4" />
                      </button>
                      <span className="w-6 text-center">{item.quantidade}</span>
                      <button
                        onClick={() => updateQuantidade(item.tempId, item.quantidade + 1)}
                        className="p-1 bg-gray-200 rounded"
                      >
                        <HiPlus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeItem(item.tempId)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                      >
                        <HiTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Totais */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>R$ {subtotal.toFixed(2)}</span>
              </div>
              {tipoPedido === 'delivery' && (
                <div className="flex justify-between text-sm">
                  <span>Taxa de entrega</span>
                  <span>R$ {taxaEntrega.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-red-600">R$ {total.toFixed(2)}</span>
              </div>
            </div>

            {/* Pagamento */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Forma de Pagamento</label>
              <select
                value={formaPagamento}
                onChange={(e) => setFormaPagamento(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              >
                <option value="">Selecione...</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="pix">PIX</option>
                <option value="cartao_credito">Cartão Crédito</option>
                <option value="cartao_debito">Cartão Débito</option>
              </select>
            </div>

            {formaPagamento === 'dinheiro' && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Troco para</label>
                <input
                  type="number"
                  value={trocoPara || ''}
                  onChange={(e) => setTrocoPara(e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="R$ 0,00"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>
            )}

            {/* Botão Finalizar */}
            <button
              onClick={finalizarPedido}
              disabled={salvando || items.length === 0}
              className="w-full mt-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {salvando ? 'Salvando...' : 'Finalizar Pedido'}
            </button>
          </div>
        </div>
      </div>

      {/* Modal Adicionar Item */}
      {modalAberto && produtoSelecionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">{produtoSelecionado.nome}</h3>

            {produtoSelecionado.is_pizza && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tamanho</label>
                  <div className="grid grid-cols-2 gap-2">
                    {tamanhos.map(t => (
                      <button
                        key={t.id}
                        onClick={() => setTamanhoSelecionado(t)}
                        className={`p-3 border-2 rounded-lg text-sm ${
                          tamanhoSelecionado?.id === t.id ? 'border-red-500 bg-red-50' : 'border-gray-200'
                        }`}
                      >
                        {t.nome} ({t.fatias} fatias)
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Borda</label>
                  <select
                    value={bordaSelecionada?.id || ''}
                    onChange={(e) => setBordaSelecionada(bordas.find(b => b.id === parseInt(e.target.value)))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    {bordas.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.nome} {b.preco > 0 && `(+R$ ${parseFloat(b.preco).toFixed(2)})`}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Quantidade</label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantidade(Math.max(1, quantidade - 1))}
                  className="p-2 bg-gray-200 rounded-lg"
                >
                  <HiMinus className="w-5 h-5" />
                </button>
                <span className="text-xl font-bold">{quantidade}</span>
                <button
                  onClick={() => setQuantidade(quantidade + 1)}
                  className="p-2 bg-gray-200 rounded-lg"
                >
                  <HiPlus className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center mb-6">
              <span className="text-gray-600">Preço unitário:</span>
              <span className="text-xl font-bold text-red-600">
                R$ {(getPreco() + (bordaSelecionada ? parseFloat(bordaSelecionada.preco) : 0)).toFixed(2)}
              </span>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setModalAberto(false)}
                className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={adicionarItem}
                disabled={produtoSelecionado?.is_pizza && !tamanhoSelecionado}
                className="flex-1 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {produtoSelecionado?.is_pizza && !tamanhoSelecionado ? 'Selecione o tamanho' : 'Adicionar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
