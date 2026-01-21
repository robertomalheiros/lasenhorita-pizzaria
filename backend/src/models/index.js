const { sequelize } = require('../config/database');
const { DataTypes } = require('sequelize');

// ==================== USUARIO ====================
const Usuario = sequelize.define('usuarios', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nome: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },
  senha: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('admin', 'operador'),
    defaultValue: 'operador'
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
});

// ==================== CLIENTE ====================
const Cliente = sequelize.define('clientes', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nome: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  telefone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  endereco: {
    type: DataTypes.TEXT
  },
  bairro: {
    type: DataTypes.STRING(100)
  },
  referencia: {
    type: DataTypes.TEXT
  }
});

// ==================== CATEGORIA ====================
const Categoria = sequelize.define('categorias', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nome: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  descricao: {
    type: DataTypes.TEXT
  },
  ordem: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
});

// ==================== TAMANHO PIZZA ====================
const TamanhoPizza = sequelize.define('tamanhos_pizza', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nome: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  fatias: {
    type: DataTypes.INTEGER
  },
  max_sabores: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
});

// ==================== BORDA ====================
const Borda = sequelize.define('bordas', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nome: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  preco: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
});

// ==================== PRODUTO ====================
const Produto = sequelize.define('produtos', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  categoria_id: {
    type: DataTypes.INTEGER,
    references: { model: 'categorias', key: 'id' }
  },
  nome: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  descricao: {
    type: DataTypes.TEXT
  },
  imagem_url: {
    type: DataTypes.TEXT
  },
  is_pizza: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
});

// ==================== PRECO PIZZA ====================
const PrecoPizza = sequelize.define('precos_pizza', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  produto_id: {
    type: DataTypes.INTEGER,
    references: { model: 'produtos', key: 'id' }
  },
  tamanho_id: {
    type: DataTypes.INTEGER,
    references: { model: 'tamanhos_pizza', key: 'id' }
  },
  preco: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  }
}, {
  indexes: [
    { unique: true, fields: ['produto_id', 'tamanho_id'] }
  ]
});

// ==================== PRECO PRODUTO ====================
const PrecoProduto = sequelize.define('precos_produto', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  produto_id: {
    type: DataTypes.INTEGER,
    references: { model: 'produtos', key: 'id' }
  },
  preco: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  }
});

// ==================== TAXA ENTREGA ====================
const TaxaEntrega = sequelize.define('taxas_entrega', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  bairro: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  taxa: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  tempo_estimado: {
    type: DataTypes.INTEGER
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
});

// ==================== MOTOBOY ====================
const Motoboy = sequelize.define('motoboys', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nome: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  telefone: {
    type: DataTypes.STRING(20)
  },
  placa_moto: {
    type: DataTypes.STRING(10)
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  disponivel: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
});

// ==================== PEDIDO ====================
const Pedido = sequelize.define('pedidos', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  numero_pedido: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  cliente_id: {
    type: DataTypes.INTEGER,
    references: { model: 'clientes', key: 'id' }
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    references: { model: 'usuarios', key: 'id' }
  },
  motoboy_id: {
    type: DataTypes.INTEGER,
    references: { model: 'motoboys', key: 'id' }
  },
  status: {
    type: DataTypes.ENUM('pendente', 'confirmado', 'preparando', 'pronto', 'saiu_entrega', 'entregue', 'cancelado'),
    defaultValue: 'pendente'
  },
  tipo_pedido: {
    type: DataTypes.ENUM('balcao', 'delivery', 'whatsapp'),
    defaultValue: 'balcao'
  },
  endereco_entrega: {
    type: DataTypes.TEXT
  },
  bairro_entrega: {
    type: DataTypes.STRING(100)
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  taxa_entrega: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  desconto: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  forma_pagamento: {
    type: DataTypes.STRING(50)
  },
  troco_para: {
    type: DataTypes.DECIMAL(10, 2)
  },
  observacoes: {
    type: DataTypes.TEXT
  },
  hora_pedido: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  hora_confirmacao: {
    type: DataTypes.DATE
  },
  hora_pronto: {
    type: DataTypes.DATE
  },
  hora_saiu_entrega: {
    type: DataTypes.DATE
  },
  hora_entregue: {
    type: DataTypes.DATE
  }
});

// ==================== ITEM PEDIDO ====================
const ItemPedido = sequelize.define('itens_pedido', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  pedido_id: {
    type: DataTypes.INTEGER,
    references: { model: 'pedidos', key: 'id' },
    onDelete: 'CASCADE'
  },
  produto_id: {
    type: DataTypes.INTEGER,
    references: { model: 'produtos', key: 'id' }
  },
  tamanho_id: {
    type: DataTypes.INTEGER,
    references: { model: 'tamanhos_pizza', key: 'id' }
  },
  borda_id: {
    type: DataTypes.INTEGER,
    references: { model: 'bordas', key: 'id' }
  },
  quantidade: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  preco_unitario: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  preco_borda: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  observacao: {
    type: DataTypes.TEXT
  },
  sabores: {
    type: DataTypes.JSONB
  }
});

// ==================== LOG ====================
const Log = sequelize.define('logs', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    references: { model: 'usuarios', key: 'id' }
  },
  acao: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  entidade: {
    type: DataTypes.STRING(50)
  },
  entidade_id: {
    type: DataTypes.INTEGER
  },
  dados_anteriores: {
    type: DataTypes.JSONB
  },
  dados_novos: {
    type: DataTypes.JSONB
  },
  ip: {
    type: DataTypes.STRING(50)
  }
});

// ==================== ASSOCIAÇÕES ====================

// Produto -> Categoria
Produto.belongsTo(Categoria, { foreignKey: 'categoria_id', as: 'categoria' });
Categoria.hasMany(Produto, { foreignKey: 'categoria_id', as: 'produtos' });

// PrecoPizza -> Produto, Tamanho
PrecoPizza.belongsTo(Produto, { foreignKey: 'produto_id', as: 'produto' });
PrecoPizza.belongsTo(TamanhoPizza, { foreignKey: 'tamanho_id', as: 'tamanho' });
Produto.hasMany(PrecoPizza, { foreignKey: 'produto_id', as: 'precos' });

// PrecoProduto -> Produto
PrecoProduto.belongsTo(Produto, { foreignKey: 'produto_id', as: 'produto' });
Produto.hasOne(PrecoProduto, { foreignKey: 'produto_id', as: 'preco' });

// Pedido -> Cliente, Usuario, Motoboy
Pedido.belongsTo(Cliente, { foreignKey: 'cliente_id', as: 'cliente' });
Pedido.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
Pedido.belongsTo(Motoboy, { foreignKey: 'motoboy_id', as: 'motoboy' });
Cliente.hasMany(Pedido, { foreignKey: 'cliente_id', as: 'pedidos' });

// ItemPedido -> Pedido, Produto, Tamanho, Borda
ItemPedido.belongsTo(Pedido, { foreignKey: 'pedido_id', as: 'pedido' });
ItemPedido.belongsTo(Produto, { foreignKey: 'produto_id', as: 'produto' });
ItemPedido.belongsTo(TamanhoPizza, { foreignKey: 'tamanho_id', as: 'tamanho' });
ItemPedido.belongsTo(Borda, { foreignKey: 'borda_id', as: 'borda' });
Pedido.hasMany(ItemPedido, { foreignKey: 'pedido_id', as: 'itens' });

// Log -> Usuario
Log.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

module.exports = {
  sequelize,
  Usuario,
  Cliente,
  Categoria,
  TamanhoPizza,
  Borda,
  Produto,
  PrecoPizza,
  PrecoProduto,
  TaxaEntrega,
  Motoboy,
  Pedido,
  ItemPedido,
  Log
};
