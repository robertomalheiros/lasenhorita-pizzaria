import React, { createContext, useState, useContext, useCallback } from 'react';

const CartContext = createContext({});

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [cliente, setCliente] = useState(null);
  const [tipoPedido, setTipoPedido] = useState('balcao');
  const [enderecoEntrega, setEnderecoEntrega] = useState('');
  const [bairroEntrega, setBairroEntrega] = useState('');
  const [taxaEntrega, setTaxaEntrega] = useState(0);
  const [formaPagamento, setFormaPagamento] = useState('');
  const [trocoPara, setTrocoPara] = useState(null);
  const [observacoes, setObservacoes] = useState('');
  const [desconto, setDesconto] = useState(0);

  // Calcular subtotal
  const subtotal = items.reduce((acc, item) => acc + parseFloat(item.subtotal), 0);

  // Calcular total
  const total = subtotal + taxaEntrega - desconto;

  // Adicionar item ao carrinho
  const addItem = useCallback((item) => {
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const novoItem = {
      ...item,
      tempId,
      subtotal: (parseFloat(item.precoUnitario) + parseFloat(item.precoBorda || 0)) * item.quantidade
    };

    setItems(prev => [...prev, novoItem]);
    return tempId;
  }, []);

  // Remover item do carrinho
  const removeItem = useCallback((tempId) => {
    setItems(prev => prev.filter(item => item.tempId !== tempId));
  }, []);

  // Atualizar quantidade de um item
  const updateQuantidade = useCallback((tempId, quantidade) => {
    if (quantidade < 1) return;

    setItems(prev => prev.map(item => {
      if (item.tempId === tempId) {
        return {
          ...item,
          quantidade,
          subtotal: (parseFloat(item.precoUnitario) + parseFloat(item.precoBorda || 0)) * quantidade
        };
      }
      return item;
    }));
  }, []);

  // Atualizar observação de um item
  const updateObservacao = useCallback((tempId, observacao) => {
    setItems(prev => prev.map(item => {
      if (item.tempId === tempId) {
        return { ...item, observacao };
      }
      return item;
    }));
  }, []);

  // Limpar carrinho
  const clearCart = useCallback(() => {
    setItems([]);
    setCliente(null);
    setTipoPedido('balcao');
    setEnderecoEntrega('');
    setBairroEntrega('');
    setTaxaEntrega(0);
    setFormaPagamento('');
    setTrocoPara(null);
    setObservacoes('');
    setDesconto(0);
  }, []);

  // Preparar dados do pedido para envio
  const prepararPedido = useCallback(() => {
    return {
      cliente_id: cliente?.id,
      tipo_pedido: tipoPedido,
      endereco_entrega: tipoPedido === 'delivery' ? enderecoEntrega : null,
      bairro_entrega: tipoPedido === 'delivery' ? bairroEntrega : null,
      forma_pagamento: formaPagamento,
      troco_para: formaPagamento === 'dinheiro' ? trocoPara : null,
      observacoes,
      desconto,
      itens: items.map(item => ({
        produto_id: item.produto.id,
        tamanho_id: item.tamanho?.id || null,
        borda_id: item.borda?.id || null,
        quantidade: item.quantidade,
        preco_unitario: item.precoUnitario,
        preco_borda: item.precoBorda || 0,
        observacao: item.observacao,
        sabores: item.sabores?.map(s => ({ id: s.id, nome: s.nome })) || null
      }))
    };
  }, [items, cliente, tipoPedido, enderecoEntrega, bairroEntrega, formaPagamento, trocoPara, observacoes, desconto]);

  return (
    <CartContext.Provider
      value={{
        items,
        cliente,
        setCliente,
        tipoPedido,
        setTipoPedido,
        enderecoEntrega,
        setEnderecoEntrega,
        bairroEntrega,
        setBairroEntrega,
        taxaEntrega,
        setTaxaEntrega,
        formaPagamento,
        setFormaPagamento,
        trocoPara,
        setTrocoPara,
        observacoes,
        setObservacoes,
        desconto,
        setDesconto,
        subtotal,
        total,
        addItem,
        removeItem,
        updateQuantidade,
        updateObservacao,
        clearCart,
        prepararPedido,
        itemCount: items.length
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart deve ser usado dentro de um CartProvider');
  }
  return context;
}

export default CartContext;
