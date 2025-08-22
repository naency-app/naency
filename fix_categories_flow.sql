-- Script para corrigir o flow das categorias existentes
-- Execute este script no seu banco de dados PostgreSQL

-- Primeiro, vamos ver quais categorias existem e seus flows atuais
SELECT id, name, flow, parent_id FROM categories ORDER BY name;

-- Atualizar a categoria "Receitas" para flow = 'income'
UPDATE categories 
SET flow = 'income' 
WHERE name = 'Receitas' AND flow = 'expense';

-- Atualizar a categoria "Salario" para flow = 'income'
UPDATE categories 
SET flow = 'income' 
WHERE name = 'Salario' AND flow = 'expense';

-- Verificar o resultado após a atualização
SELECT id, name, flow, parent_id FROM categories ORDER BY name;

-- Se você tiver outras categorias de receita que precisam ser corrigidas,
-- adicione mais comandos UPDATE aqui seguindo o mesmo padrão:

-- Exemplo:
-- UPDATE categories 
-- SET flow = 'income' 
-- WHERE name IN ('Freelance', 'Investimentos', 'Outros') AND flow = 'expense';
