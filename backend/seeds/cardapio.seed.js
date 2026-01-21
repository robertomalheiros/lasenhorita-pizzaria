/**
 * LaSenhorita Pizzaria - Seed do Cardápio
 * Execute: node seeds/cardapio.seed.js
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const {
  sequelize,
  Usuario,
  Categoria,
  TamanhoPizza,
  Borda,
  Produto,
  PrecoPizza,
  PrecoProduto,
  TaxaEntrega,
  Motoboy
} = require('../src/models');

// Preços das pizzas por categoria e tamanho
const PRECOS = {
  tradicionais: { broto: 28.00, media: 42.00, grande: 52.00, familia: 68.00 },
  especiais: { broto: 35.00, media: 52.00, grande: 65.00, familia: 85.00 },
  doces: { broto: 25.00, media: 38.00, grande: 48.00, familia: 62.00 }
};

// Preços dos produtos não-pizza
const PRECOS_PRODUTOS = {
  // Bebidas
  'Coca-Cola 350ml': 6.00,
  'Coca-Cola 600ml': 8.00,
  'Coca-Cola 2L': 14.00,
  'Guaraná Antarctica 350ml': 5.00,
  'Guaraná Antarctica 2L': 12.00,
  'Fanta Laranja 350ml': 5.00,
  'Fanta Laranja 2L': 12.00,
  'Sprite 350ml': 5.00,
  'Sprite 2L': 12.00,
  'Água Mineral 500ml': 4.00,
  'Suco Del Valle 1L': 10.00,
  'Cerveja Heineken 600ml': 15.00,
  'Cerveja Brahma 600ml': 10.00,
  'Cerveja Antarctica 600ml': 10.00,
  // Porções
  'Batata Frita': 25.00,
  'Batata com Cheddar e Bacon': 35.00,
  'Isca de Frango': 30.00,
  'Calabresa Acebolada': 28.00,
  'Frango à Passarinho': 35.00,
  'Polenta Frita': 20.00,
  'Mandioca Frita': 22.00,
  'Bolinho de Bacalhau (6un)': 35.00,
  'Coxinha (6un)': 25.00,
  'Kibe (6un)': 25.00,
  // Sobremesas
  'Petit Gateau': 22.00,
  'Brownie com Sorvete': 18.00,
  'Pudim': 12.00,
  'Mousse de Maracujá': 14.00,
  'Mousse de Chocolate': 14.00,
  'Açaí 300ml': 18.00,
  'Açaí 500ml': 25.00
};

async function seed() {
  try {
    console.log('🌱 Iniciando seed do cardápio...\n');

    // Conectar ao banco
    await sequelize.authenticate();
    console.log('✅ Conectado ao banco de dados\n');

    // Sincronizar models
    await sequelize.sync({ force: false });
    console.log('✅ Models sincronizados\n');

    // ========================================
    // 1. USUÁRIO ADMIN
    // ========================================
    console.log('👤 Criando usuário admin...');
    const senhaHash = await bcrypt.hash('Admin@123', 10);
    await Usuario.findOrCreate({
      where: { email: 'admin@lasenhorita.com' },
      defaults: {
        nome: 'Administrador',
        email: 'admin@lasenhorita.com',
        senha: senhaHash,
        role: 'admin',
        ativo: true
      }
    });
    console.log('   ✅ Usuário admin criado (admin@lasenhorita.com / Admin@123)\n');

    // ========================================
    // 2. CATEGORIAS
    // ========================================
    console.log('📂 Criando categorias...');
    const categoriasData = [
      { nome: 'Pizzas Tradicionais', descricao: 'Pizzas clássicas da casa', ordem: 1 },
      { nome: 'Pizzas Especiais', descricao: 'Pizzas premium com ingredientes selecionados', ordem: 2 },
      { nome: 'Pizzas Doces', descricao: 'Pizzas doces para sobremesa', ordem: 3 },
      { nome: 'Bebidas', descricao: 'Refrigerantes, sucos e cervejas', ordem: 4 },
      { nome: 'Porções', descricao: 'Porções para compartilhar', ordem: 5 },
      { nome: 'Sobremesas', descricao: 'Sobremesas deliciosas', ordem: 6 }
    ];

    const categorias = {};
    for (const cat of categoriasData) {
      const [categoria] = await Categoria.findOrCreate({
        where: { nome: cat.nome },
        defaults: cat
      });
      categorias[cat.nome] = categoria;
    }
    console.log('   ✅ 6 categorias criadas\n');

    // ========================================
    // 3. TAMANHOS DE PIZZA
    // ========================================
    console.log('📏 Criando tamanhos de pizza...');
    const tamanhosData = [
      { nome: 'Broto', fatias: 4, max_sabores: 1 },
      { nome: 'Média', fatias: 6, max_sabores: 2 },
      { nome: 'Grande', fatias: 8, max_sabores: 2 },
      { nome: 'Família', fatias: 12, max_sabores: 3 }
    ];

    const tamanhos = {};
    // Mapeamento para remover acentos
    const removeAccents = (str) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

    for (const tam of tamanhosData) {
      const [tamanho] = await TamanhoPizza.findOrCreate({
        where: { nome: tam.nome },
        defaults: tam
      });
      // Usar chave sem acentos para corresponder com PRECOS
      tamanhos[removeAccents(tam.nome)] = tamanho;
    }
    console.log('   ✅ 4 tamanhos criados\n');

    // ========================================
    // 4. BORDAS
    // ========================================
    console.log('🧀 Criando bordas...');
    const bordasData = [
      { nome: 'Sem Borda', preco: 0 },
      { nome: 'Catupiry', preco: 8.00 },
      { nome: 'Cheddar', preco: 8.00 },
      { nome: 'Cream Cheese', preco: 10.00 },
      { nome: 'Chocolate', preco: 10.00 }
    ];

    for (const borda of bordasData) {
      await Borda.findOrCreate({
        where: { nome: borda.nome },
        defaults: borda
      });
    }
    console.log('   ✅ 5 bordas criadas\n');

    // ========================================
    // 5. TAXAS DE ENTREGA
    // ========================================
    console.log('🛵 Criando taxas de entrega...');
    const taxasData = [
      { bairro: 'Centro', taxa: 5.00, tempo_estimado: 20 },
      { bairro: 'Candeias', taxa: 6.00, tempo_estimado: 25 },
      { bairro: 'Brasil', taxa: 6.00, tempo_estimado: 25 },
      { bairro: 'Recreio', taxa: 7.00, tempo_estimado: 30 },
      { bairro: 'Ibirapuera', taxa: 7.00, tempo_estimado: 30 },
      { bairro: 'Jurema', taxa: 8.00, tempo_estimado: 35 },
      { bairro: 'Alto Maron', taxa: 8.00, tempo_estimado: 35 },
      { bairro: 'Felícia', taxa: 9.00, tempo_estimado: 40 },
      { bairro: 'Kadija', taxa: 10.00, tempo_estimado: 45 },
      { bairro: 'Outros', taxa: 12.00, tempo_estimado: 50 }
    ];

    for (const taxa of taxasData) {
      await TaxaEntrega.findOrCreate({
        where: { bairro: taxa.bairro },
        defaults: taxa
      });
    }
    console.log('   ✅ 10 taxas de entrega criadas\n');

    // ========================================
    // 6. MOTOBOYS
    // ========================================
    console.log('🏍️ Criando motoboys...');
    const motoboysData = [
      { nome: 'João Silva', telefone: '77999001122', placa_moto: 'ABC-1234' },
      { nome: 'Pedro Santos', telefone: '77999003344', placa_moto: 'DEF-5678' },
      { nome: 'Carlos Oliveira', telefone: '77999005566', placa_moto: 'GHI-9012' }
    ];

    for (const motoboy of motoboysData) {
      await Motoboy.findOrCreate({
        where: { nome: motoboy.nome },
        defaults: motoboy
      });
    }
    console.log('   ✅ 3 motoboys criados\n');

    // ========================================
    // 7. PIZZAS TRADICIONAIS
    // ========================================
    console.log('🍕 Criando pizzas tradicionais...');
    const tradicionais = [
      { nome: 'Mussarela', descricao: 'Molho de tomate, mussarela e orégano' },
      { nome: 'Calabresa', descricao: 'Molho de tomate, mussarela, calabresa fatiada e cebola' },
      { nome: 'Portuguesa', descricao: 'Molho de tomate, mussarela, presunto, ovos, cebola, ervilha e azeitona' },
      { nome: 'Frango com Catupiry', descricao: 'Molho de tomate, mussarela, frango desfiado e catupiry' },
      { nome: 'Bacon', descricao: 'Molho de tomate, mussarela e bacon crocante' },
      { nome: 'Marguerita', descricao: 'Molho de tomate, mussarela, tomate fatiado e manjericão' },
      { nome: 'Quatro Queijos', descricao: 'Molho de tomate, mussarela, provolone, parmesão e catupiry' },
      { nome: 'Pepperoni', descricao: 'Molho de tomate, mussarela e pepperoni' },
      { nome: 'Napolitana', descricao: 'Molho de tomate, mussarela, tomate, parmesão e manjericão' },
      { nome: 'Americana', descricao: 'Molho de tomate, mussarela, presunto e ovos' },
      { nome: 'Atum', descricao: 'Molho de tomate, mussarela, atum e cebola' },
      { nome: 'Palmito', descricao: 'Molho de tomate, mussarela e palmito' },
      { nome: 'Milho', descricao: 'Molho de tomate, mussarela e milho verde' },
      { nome: 'Baiana', descricao: 'Molho de tomate, mussarela, calabresa moída e pimenta' },
      { nome: 'Nordestina', descricao: 'Molho de tomate, mussarela, carne seca, cebola e pimenta' },
      { nome: 'Lombo', descricao: 'Molho de tomate, mussarela e lombo canadense' },
      { nome: 'Alho', descricao: 'Molho de tomate, mussarela e alho frito' },
      { nome: 'Vegetariana', descricao: 'Molho de tomate, mussarela, brócolis, palmito, milho, ervilha e champignon' },
      { nome: 'Escarola', descricao: 'Molho de tomate, mussarela e escarola refogada' },
      { nome: 'Rúcula', descricao: 'Molho de tomate, mussarela, rúcula e tomate seco' }
    ];

    for (const pizza of tradicionais) {
      const [produto] = await Produto.findOrCreate({
        where: { nome: pizza.nome, categoria_id: categorias['Pizzas Tradicionais'].id },
        defaults: {
          ...pizza,
          categoria_id: categorias['Pizzas Tradicionais'].id,
          is_pizza: true
        }
      });

      // Criar preços para cada tamanho
      for (const [tamanhoKey, tamanho] of Object.entries(tamanhos)) {
        await PrecoPizza.findOrCreate({
          where: { produto_id: produto.id, tamanho_id: tamanho.id },
          defaults: {
            produto_id: produto.id,
            tamanho_id: tamanho.id,
            preco: PRECOS.tradicionais[tamanhoKey]
          }
        });
      }
    }
    console.log(`   ✅ ${tradicionais.length} pizzas tradicionais criadas\n`);

    // ========================================
    // 8. PIZZAS ESPECIAIS
    // ========================================
    console.log('⭐ Criando pizzas especiais...');
    const especiais = [
      { nome: 'Filé Mignon', descricao: 'Molho de tomate, mussarela, filé mignon em cubos e bacon' },
      { nome: 'Camarão', descricao: 'Molho de tomate, mussarela e camarão' },
      { nome: 'Salmão', descricao: 'Molho branco, mussarela, salmão defumado e cream cheese' },
      { nome: 'Parma', descricao: 'Molho de tomate, mussarela, presunto de parma e rúcula' },
      { nome: 'Costela', descricao: 'Molho de tomate, mussarela, costela desfiada e barbecue' },
      { nome: 'Alcatra', descricao: 'Molho de tomate, mussarela, alcatra em tiras e cebola caramelizada' },
      { nome: 'Supreme', descricao: 'Molho de tomate, mussarela, pepperoni, bacon, champignon e pimentão' },
      { nome: 'Brócolis com Bacon', descricao: 'Molho branco, mussarela, brócolis e bacon' },
      { nome: 'Strogonoff', descricao: 'Molho de tomate, mussarela, strogonoff de frango e batata palha' },
      { nome: 'Cinco Queijos', descricao: 'Molho de tomate, mussarela, provolone, gorgonzola, parmesão e catupiry' },
      { nome: 'À Moda da Casa', descricao: 'Molho de tomate, mussarela, frango, bacon, milho, catupiry e batata palha' },
      { nome: 'Tex-Mex', descricao: 'Molho de tomate, mussarela, carne moída, pimentão, nachos e sour cream' }
    ];

    for (const pizza of especiais) {
      const [produto] = await Produto.findOrCreate({
        where: { nome: pizza.nome, categoria_id: categorias['Pizzas Especiais'].id },
        defaults: {
          ...pizza,
          categoria_id: categorias['Pizzas Especiais'].id,
          is_pizza: true
        }
      });

      for (const [tamanhoKey, tamanho] of Object.entries(tamanhos)) {
        await PrecoPizza.findOrCreate({
          where: { produto_id: produto.id, tamanho_id: tamanho.id },
          defaults: {
            produto_id: produto.id,
            tamanho_id: tamanho.id,
            preco: PRECOS.especiais[tamanhoKey]
          }
        });
      }
    }
    console.log(`   ✅ ${especiais.length} pizzas especiais criadas\n`);

    // ========================================
    // 9. PIZZAS DOCES
    // ========================================
    console.log('🍫 Criando pizzas doces...');
    const doces = [
      { nome: 'Chocolate', descricao: 'Chocolate ao leite' },
      { nome: 'Chocolate Branco', descricao: 'Chocolate branco' },
      { nome: 'Prestígio', descricao: 'Chocolate ao leite com coco ralado' },
      { nome: 'Romeu e Julieta', descricao: 'Goiabada com queijo mussarela' },
      { nome: 'Banana com Canela', descricao: 'Banana, canela, açúcar e leite condensado' },
      { nome: 'Brigadeiro', descricao: 'Brigadeiro e granulado' },
      { nome: 'Morango com Chocolate', descricao: 'Morango fatiado com chocolate' },
      { nome: 'Sensação', descricao: 'Chocolate ao leite com morango' },
      { nome: 'Abacaxi', descricao: 'Abacaxi caramelizado com canela' },
      { nome: 'Nutella', descricao: 'Creme de avelã Nutella' },
      { nome: 'Churros', descricao: 'Doce de leite, chocolate e canela' },
      { nome: 'Dois Amores', descricao: 'Chocolate ao leite e chocolate branco' }
    ];

    for (const pizza of doces) {
      const [produto] = await Produto.findOrCreate({
        where: { nome: pizza.nome, categoria_id: categorias['Pizzas Doces'].id },
        defaults: {
          ...pizza,
          categoria_id: categorias['Pizzas Doces'].id,
          is_pizza: true
        }
      });

      for (const [tamanhoKey, tamanho] of Object.entries(tamanhos)) {
        await PrecoPizza.findOrCreate({
          where: { produto_id: produto.id, tamanho_id: tamanho.id },
          defaults: {
            produto_id: produto.id,
            tamanho_id: tamanho.id,
            preco: PRECOS.doces[tamanhoKey]
          }
        });
      }
    }
    console.log(`   ✅ ${doces.length} pizzas doces criadas\n`);

    // ========================================
    // 10. BEBIDAS, PORÇÕES E SOBREMESAS
    // ========================================
    console.log('🥤 Criando bebidas, porções e sobremesas...');

    // Função auxiliar para criar produtos não-pizza
    const criarProduto = async (nome, descricao, categoriaId) => {
      const [produto] = await Produto.findOrCreate({
        where: { nome, categoria_id: categoriaId },
        defaults: {
          nome,
          descricao,
          categoria_id: categoriaId,
          is_pizza: false
        }
      });

      if (PRECOS_PRODUTOS[nome]) {
        await PrecoProduto.findOrCreate({
          where: { produto_id: produto.id },
          defaults: {
            produto_id: produto.id,
            preco: PRECOS_PRODUTOS[nome]
          }
        });
      }
    };

    // Bebidas
    const bebidas = [
      ['Coca-Cola 350ml', 'Lata'],
      ['Coca-Cola 600ml', 'Garrafa'],
      ['Coca-Cola 2L', 'Garrafa'],
      ['Guaraná Antarctica 350ml', 'Lata'],
      ['Guaraná Antarctica 2L', 'Garrafa'],
      ['Fanta Laranja 350ml', 'Lata'],
      ['Fanta Laranja 2L', 'Garrafa'],
      ['Sprite 350ml', 'Lata'],
      ['Sprite 2L', 'Garrafa'],
      ['Água Mineral 500ml', 'Com ou sem gás'],
      ['Suco Del Valle 1L', 'Diversos sabores'],
      ['Cerveja Heineken 600ml', 'Garrafa'],
      ['Cerveja Brahma 600ml', 'Garrafa'],
      ['Cerveja Antarctica 600ml', 'Garrafa']
    ];
    for (const [nome, desc] of bebidas) {
      await criarProduto(nome, desc, categorias['Bebidas'].id);
    }

    // Porções
    const porcoes = [
      ['Batata Frita', 'Porção de batata frita crocante'],
      ['Batata com Cheddar e Bacon', 'Batata frita com cheddar e bacon'],
      ['Isca de Frango', 'Iscas de frango empanadas'],
      ['Calabresa Acebolada', 'Calabresa fatiada com cebola'],
      ['Frango à Passarinho', 'Frango crocante temperado'],
      ['Polenta Frita', 'Palitos de polenta fritos'],
      ['Mandioca Frita', 'Mandioca frita crocante'],
      ['Bolinho de Bacalhau (6un)', 'Bolinhos de bacalhau fritos'],
      ['Coxinha (6un)', 'Coxinhas de frango'],
      ['Kibe (6un)', 'Kibes fritos']
    ];
    for (const [nome, desc] of porcoes) {
      await criarProduto(nome, desc, categorias['Porções'].id);
    }

    // Sobremesas
    const sobremesas = [
      ['Petit Gateau', 'Bolo de chocolate com sorvete'],
      ['Brownie com Sorvete', 'Brownie de chocolate com sorvete'],
      ['Pudim', 'Pudim de leite condensado'],
      ['Mousse de Maracujá', 'Mousse cremoso de maracujá'],
      ['Mousse de Chocolate', 'Mousse cremoso de chocolate'],
      ['Açaí 300ml', 'Com granola, banana e leite condensado'],
      ['Açaí 500ml', 'Com granola, banana e leite condensado']
    ];
    for (const [nome, desc] of sobremesas) {
      await criarProduto(nome, desc, categorias['Sobremesas'].id);
    }

    console.log('   ✅ Bebidas, porções e sobremesas criadas\n');

    // ========================================
    // RESUMO
    // ========================================
    const totalProdutos = await Produto.count();
    const totalPizzas = await Produto.count({ where: { is_pizza: true } });

    console.log('═══════════════════════════════════════════════════════');
    console.log('🎉 SEED CONCLUÍDO COM SUCESSO!');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`📦 Total de produtos: ${totalProdutos}`);
    console.log(`🍕 Total de pizzas: ${totalPizzas}`);
    console.log(`🥤 Total de outros: ${totalProdutos - totalPizzas}`);
    console.log('');
    console.log('👤 Credenciais de acesso:');
    console.log('   Email: admin@lasenhorita.com');
    console.log('   Senha: Admin@123');
    console.log('═══════════════════════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro no seed:', error);
    process.exit(1);
  }
}

seed();
