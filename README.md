# Naency - Sistema de Gestão Financeira

## Funcionalidades

### Sistema de Categorias Hierárquicas

O sistema agora suporta categorias hierárquicas, permitindo organizar suas despesas de forma mais estruturada:

#### Exemplos de Uso:

**Categoria Pai: Alimentação**
- Subcategorias:
  - Comida (supermercado)
  - Almoço fora
  - Jantar
  - Delivery

**Categoria Pai: Habitação**
- Subcategorias:
  - Aluguel
  - Conta de luz
  - Conta de água
  - Internet

**Categoria Pai: Transporte**
- Subcategorias:
  - Combustível
  - Uber/Táxi
  - Transporte público
  - Manutenção

#### Como Funciona:

1. **Criar Categoria Pai**: Deixe o campo "Parent category" vazio
2. **Criar Subcategoria**: Selecione uma categoria pai existente
3. **Visualização Hierárquica**: As categorias são exibidas em estrutura de árvore
4. **Seleção Inteligente**: Ao escolher categorias em formulários, você vê a hierarquia

#### APIs Disponíveis:

- `categories.getParentCategories` - Busca apenas categorias pai
- `categories.getSubcategories` - Busca subcategorias de uma categoria específica
- `categories.getHierarchical` - Busca toda a estrutura hierárquica
- `categories.create` - Cria categoria com ou sem pai
- `categories.update` - Atualiza categoria incluindo mudança de hierarquia

## Tecnologias

- Next.js 14
- TypeScript
- Drizzle ORM
- tRPC
- Tailwind CSS
- Shadcn/ui

## Instalação

```bash
pnpm install
pnpm dev
```

## Estrutura do Banco

O sistema usa PostgreSQL com as seguintes tabelas principais:

- `user` - Usuários do sistema
- `categories` - Categorias com suporte a hierarquia (parentId)
- `expenses` - Despesas
- `paid_by` - Quem pagou
- `transaction_accounts` - Contas de transação
