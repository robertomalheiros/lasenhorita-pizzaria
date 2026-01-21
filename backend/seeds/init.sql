-- =====================================================
-- LaSenhorita Pizzaria - Script de Inicialização
-- =====================================================

-- Criar extensão para UUID se necessário
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- DADOS INICIAIS - CATEGORIAS
-- =====================================================
INSERT INTO categorias (nome, descricao, ordem, ativo, created_at, updated_at) VALUES
('Pizzas Tradicionais', 'Pizzas clássicas da casa', 1, true, NOW(), NOW()),
('Pizzas Especiais', 'Pizzas premium com ingredientes selecionados', 2, true, NOW(), NOW()),
('Pizzas Doces', 'Pizzas doces para sobremesa', 3, true, NOW(), NOW()),
('Bebidas', 'Refrigerantes, sucos e cervejas', 4, true, NOW(), NOW()),
('Porções', 'Porções para compartilhar', 5, true, NOW(), NOW()),
('Sobremesas', 'Sobremesas deliciosas', 6, true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- DADOS INICIAIS - TAMANHOS DE PIZZA
-- =====================================================
INSERT INTO tamanhos_pizza (nome, fatias, max_sabores, ativo, created_at, updated_at) VALUES
('Broto', 4, 1, true, NOW(), NOW()),
('Média', 6, 2, true, NOW(), NOW()),
('Grande', 8, 2, true, NOW(), NOW()),
('Família', 12, 3, true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- DADOS INICIAIS - BORDAS
-- =====================================================
INSERT INTO bordas (nome, preco, ativo, created_at, updated_at) VALUES
('Sem Borda', 0.00, true, NOW(), NOW()),
('Catupiry', 8.00, true, NOW(), NOW()),
('Cheddar', 8.00, true, NOW(), NOW()),
('Cream Cheese', 10.00, true, NOW(), NOW()),
('Chocolate', 10.00, true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- DADOS INICIAIS - TAXAS DE ENTREGA
-- =====================================================
INSERT INTO taxas_entrega (bairro, taxa, tempo_estimado, ativo, created_at, updated_at) VALUES
('Centro', 5.00, 20, true, NOW(), NOW()),
('Candeias', 6.00, 25, true, NOW(), NOW()),
('Brasil', 6.00, 25, true, NOW(), NOW()),
('Recreio', 7.00, 30, true, NOW(), NOW()),
('Ibirapuera', 7.00, 30, true, NOW(), NOW()),
('Jurema', 8.00, 35, true, NOW(), NOW()),
('Alto Maron', 8.00, 35, true, NOW(), NOW()),
('Felícia', 9.00, 40, true, NOW(), NOW()),
('Kadija', 10.00, 45, true, NOW(), NOW()),
('Outros', 12.00, 50, true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- DADOS INICIAIS - USUÁRIO ADMIN
-- =====================================================
-- Senha: Admin@123 (hash bcrypt)
INSERT INTO usuarios (nome, email, senha, role, ativo, created_at, updated_at) VALUES
('Administrador', 'admin@lasenhorita.com', '$2a$10$rQnM1Yz9GXr6VqY9qGqZXOqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZq', 'admin', true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- DADOS INICIAIS - MOTOBOYS
-- =====================================================
INSERT INTO motoboys (nome, telefone, placa_moto, ativo, disponivel, created_at, updated_at) VALUES
('João Silva', '77999001122', 'ABC-1234', true, true, NOW(), NOW()),
('Pedro Santos', '77999003344', 'DEF-5678', true, true, NOW(), NOW()),
('Carlos Oliveira', '77999005566', 'GHI-9012', true, false, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- DADOS INICIAIS - PIZZAS TRADICIONAIS (categoria_id = 1)
-- =====================================================
INSERT INTO produtos (categoria_id, nome, descricao, is_pizza, ativo, created_at, updated_at) VALUES
(1, 'Mussarela', 'Molho de tomate, mussarela e orégano', true, true, NOW(), NOW()),
(1, 'Calabresa', 'Molho de tomate, mussarela, calabresa fatiada e cebola', true, true, NOW(), NOW()),
(1, 'Portuguesa', 'Molho de tomate, mussarela, presunto, ovos, cebola, ervilha e azeitona', true, true, NOW(), NOW()),
(1, 'Frango com Catupiry', 'Molho de tomate, mussarela, frango desfiado e catupiry', true, true, NOW(), NOW()),
(1, 'Bacon', 'Molho de tomate, mussarela e bacon crocante', true, true, NOW(), NOW()),
(1, 'Marguerita', 'Molho de tomate, mussarela, tomate fatiado e manjericão', true, true, NOW(), NOW()),
(1, 'Quatro Queijos', 'Molho de tomate, mussarela, provolone, parmesão e catupiry', true, true, NOW(), NOW()),
(1, 'Pepperoni', 'Molho de tomate, mussarela e pepperoni', true, true, NOW(), NOW()),
(1, 'Napolitana', 'Molho de tomate, mussarela, tomate, parmesão e manjericão', true, true, NOW(), NOW()),
(1, 'Americana', 'Molho de tomate, mussarela, presunto e ovos', true, true, NOW(), NOW()),
(1, 'Atum', 'Molho de tomate, mussarela, atum e cebola', true, true, NOW(), NOW()),
(1, 'Palmito', 'Molho de tomate, mussarela e palmito', true, true, NOW(), NOW()),
(1, 'Milho', 'Molho de tomate, mussarela e milho verde', true, true, NOW(), NOW()),
(1, 'Baiana', 'Molho de tomate, mussarela, calabresa moída e pimenta', true, true, NOW(), NOW()),
(1, 'Nordestina', 'Molho de tomate, mussarela, carne seca, cebola e pimenta', true, true, NOW(), NOW()),
(1, 'Lombo', 'Molho de tomate, mussarela e lombo canadense', true, true, NOW(), NOW()),
(1, 'Alho', 'Molho de tomate, mussarela e alho frito', true, true, NOW(), NOW()),
(1, 'Vegetariana', 'Molho de tomate, mussarela, brócolis, palmito, milho, ervilha e champignon', true, true, NOW(), NOW()),
(1, 'Escarola', 'Molho de tomate, mussarela e escarola refogada', true, true, NOW(), NOW()),
(1, 'Rúcula', 'Molho de tomate, mussarela, rúcula e tomate seco', true, true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- DADOS INICIAIS - PIZZAS ESPECIAIS (categoria_id = 2)
-- =====================================================
INSERT INTO produtos (categoria_id, nome, descricao, is_pizza, ativo, created_at, updated_at) VALUES
(2, 'Filé Mignon', 'Molho de tomate, mussarela, filé mignon em cubos e bacon', true, true, NOW(), NOW()),
(2, 'Camarão', 'Molho de tomate, mussarela e camarão', true, true, NOW(), NOW()),
(2, 'Salmão', 'Molho branco, mussarela, salmão defumado e cream cheese', true, true, NOW(), NOW()),
(2, 'Parma', 'Molho de tomate, mussarela, presunto de parma e rúcula', true, true, NOW(), NOW()),
(2, 'Costela', 'Molho de tomate, mussarela, costela desfiada e barbecue', true, true, NOW(), NOW()),
(2, 'Alcatra', 'Molho de tomate, mussarela, alcatra em tiras e cebola caramelizada', true, true, NOW(), NOW()),
(2, 'Supreme', 'Molho de tomate, mussarela, pepperoni, bacon, champignon e pimentão', true, true, NOW(), NOW()),
(2, 'Brócolis com Bacon', 'Molho branco, mussarela, brócolis e bacon', true, true, NOW(), NOW()),
(2, 'Strogonoff', 'Molho de tomate, mussarela, strogonoff de frango e batata palha', true, true, NOW(), NOW()),
(2, 'Cinco Queijos', 'Molho de tomate, mussarela, provolone, gorgonzola, parmesão e catupiry', true, true, NOW(), NOW()),
(2, 'À Moda da Casa', 'Molho de tomate, mussarela, frango, bacon, milho, catupiry e batata palha', true, true, NOW(), NOW()),
(2, 'Tex-Mex', 'Molho de tomate, mussarela, carne moída, pimentão, nachos e sour cream', true, true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- DADOS INICIAIS - PIZZAS DOCES (categoria_id = 3)
-- =====================================================
INSERT INTO produtos (categoria_id, nome, descricao, is_pizza, ativo, created_at, updated_at) VALUES
(3, 'Chocolate', 'Chocolate ao leite', true, true, NOW(), NOW()),
(3, 'Chocolate Branco', 'Chocolate branco', true, true, NOW(), NOW()),
(3, 'Prestígio', 'Chocolate ao leite com coco ralado', true, true, NOW(), NOW()),
(3, 'Romeu e Julieta', 'Goiabada com queijo mussarela', true, true, NOW(), NOW()),
(3, 'Banana com Canela', 'Banana, canela, açúcar e leite condensado', true, true, NOW(), NOW()),
(3, 'Brigadeiro', 'Brigadeiro e granulado', true, true, NOW(), NOW()),
(3, 'Morango com Chocolate', 'Morango fatiado com chocolate', true, true, NOW(), NOW()),
(3, 'Sensação', 'Chocolate ao leite com morango', true, true, NOW(), NOW()),
(3, 'Abacaxi', 'Abacaxi caramelizado com canela', true, true, NOW(), NOW()),
(3, 'Nutella', 'Creme de avelã Nutella', true, true, NOW(), NOW()),
(3, 'Churros', 'Doce de leite, chocolate e canela', true, true, NOW(), NOW()),
(3, 'Dois Amores', 'Chocolate ao leite e chocolate branco', true, true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- DADOS INICIAIS - BEBIDAS (categoria_id = 4)
-- =====================================================
INSERT INTO produtos (categoria_id, nome, descricao, is_pizza, ativo, created_at, updated_at) VALUES
(4, 'Coca-Cola 350ml', 'Lata', false, true, NOW(), NOW()),
(4, 'Coca-Cola 600ml', 'Garrafa', false, true, NOW(), NOW()),
(4, 'Coca-Cola 2L', 'Garrafa', false, true, NOW(), NOW()),
(4, 'Guaraná Antarctica 350ml', 'Lata', false, true, NOW(), NOW()),
(4, 'Guaraná Antarctica 2L', 'Garrafa', false, true, NOW(), NOW()),
(4, 'Fanta Laranja 350ml', 'Lata', false, true, NOW(), NOW()),
(4, 'Fanta Laranja 2L', 'Garrafa', false, true, NOW(), NOW()),
(4, 'Sprite 350ml', 'Lata', false, true, NOW(), NOW()),
(4, 'Sprite 2L', 'Garrafa', false, true, NOW(), NOW()),
(4, 'Água Mineral 500ml', 'Com ou sem gás', false, true, NOW(), NOW()),
(4, 'Suco Del Valle 1L', 'Diversos sabores', false, true, NOW(), NOW()),
(4, 'Cerveja Heineken 600ml', 'Garrafa', false, true, NOW(), NOW()),
(4, 'Cerveja Brahma 600ml', 'Garrafa', false, true, NOW(), NOW()),
(4, 'Cerveja Antarctica 600ml', 'Garrafa', false, true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- DADOS INICIAIS - PORÇÕES (categoria_id = 5)
-- =====================================================
INSERT INTO produtos (categoria_id, nome, descricao, is_pizza, ativo, created_at, updated_at) VALUES
(5, 'Batata Frita', 'Porção de batata frita crocante', false, true, NOW(), NOW()),
(5, 'Batata com Cheddar e Bacon', 'Batata frita com cheddar e bacon', false, true, NOW(), NOW()),
(5, 'Isca de Frango', 'Iscas de frango empanadas', false, true, NOW(), NOW()),
(5, 'Calabresa Acebolada', 'Calabresa fatiada com cebola', false, true, NOW(), NOW()),
(5, 'Frango à Passarinho', 'Frango crocante temperado', false, true, NOW(), NOW()),
(5, 'Polenta Frita', 'Palitos de polenta fritos', false, true, NOW(), NOW()),
(5, 'Mandioca Frita', 'Mandioca frita crocante', false, true, NOW(), NOW()),
(5, 'Bolinho de Bacalhau (6un)', 'Bolinhos de bacalhau fritos', false, true, NOW(), NOW()),
(5, 'Coxinha (6un)', 'Coxinhas de frango', false, true, NOW(), NOW()),
(5, 'Kibe (6un)', 'Kibes fritos', false, true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- DADOS INICIAIS - SOBREMESAS (categoria_id = 6)
-- =====================================================
INSERT INTO produtos (categoria_id, nome, descricao, is_pizza, ativo, created_at, updated_at) VALUES
(6, 'Petit Gateau', 'Bolo de chocolate com sorvete', false, true, NOW(), NOW()),
(6, 'Brownie com Sorvete', 'Brownie de chocolate com sorvete', false, true, NOW(), NOW()),
(6, 'Pudim', 'Pudim de leite condensado', false, true, NOW(), NOW()),
(6, 'Mousse de Maracujá', 'Mousse cremoso de maracujá', false, true, NOW(), NOW()),
(6, 'Mousse de Chocolate', 'Mousse cremoso de chocolate', false, true, NOW(), NOW()),
(6, 'Açaí 300ml', 'Com granola, banana e leite condensado', false, true, NOW(), NOW()),
(6, 'Açaí 500ml', 'Com granola, banana e leite condensado', false, true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Mensagem de conclusão
DO $$
BEGIN
  RAISE NOTICE '✅ Dados iniciais inseridos com sucesso!';
END $$;
