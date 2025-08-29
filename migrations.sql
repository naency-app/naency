-- ========================================
-- MIGRAÇÕES PARA IMPLEMENTAR MUDANÇAS 2.4
-- ========================================

-- 1. Adicionar campos de arquivamento nas tabelas existentes
-- (Se as tabelas já existirem, execute apenas os ALTER TABLE)

-- Adicionar campos de arquivamento em categories (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'is_archived') THEN
        ALTER TABLE categories ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'archived_at') THEN
        ALTER TABLE categories ADD COLUMN archived_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Adicionar campos de arquivamento em accounts (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'accounts' AND column_name = 'is_archived') THEN
        ALTER TABLE accounts ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'accounts' AND column_name = 'archived_at') THEN
        ALTER TABLE accounts ADD COLUMN archived_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 2. Criar tabela account_movements (se não existir)
CREATE TABLE IF NOT EXISTS account_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    amount BIGINT NOT NULL, -- em centavos, positivo para crédito, negativo para débito
    occurred_at TIMESTAMP WITH TIME ZONE NOT NULL,
    source_type TEXT NOT NULL CHECK (source_type IN ('expense', 'income', 'transfer')),
    source_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Índices
    CONSTRAINT account_movements_source_unique UNIQUE (source_type, source_id, account_id),
    CONSTRAINT account_movements_amount_nonzero CHECK (amount != 0)
);

-- Criar índices para account_movements
CREATE INDEX IF NOT EXISTS idx_account_movements_user ON account_movements(user_id);
CREATE INDEX IF NOT EXISTS idx_account_movements_account ON account_movements(account_id);
CREATE INDEX IF NOT EXISTS idx_account_movements_occurred_at ON account_movements(occurred_at);

-- 3. Criar tabela transfers (se não existir)
CREATE TABLE IF NOT EXISTS transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    from_account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    to_account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    amount BIGINT NOT NULL, -- sempre positivo, em centavos
    occurred_at TIMESTAMP WITH TIME ZONE NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT transfers_amount_positive CHECK (amount > 0),
    CONSTRAINT transfers_from_to_different CHECK (from_account_id != to_account_id)
);

-- Criar índices para transfers
CREATE INDEX IF NOT EXISTS idx_transfers_user ON transfers(user_id);
CREATE INDEX IF NOT EXISTS idx_transfers_from ON transfers(from_account_id);
CREATE INDEX IF NOT EXISTS idx_transfers_to ON transfers(to_account_id);
CREATE INDEX IF NOT EXISTS idx_transfers_occurred_at ON transfers(occurred_at);

-- 4. Criar view account_balances para consultar saldos
CREATE OR REPLACE VIEW account_balances AS
SELECT 
    account_id,
    COALESCE(SUM(amount), 0) as balance
FROM account_movements
GROUP BY account_id;

-- 5. Criar triggers para manter movimentos sincronizados

-- Função para inserir movimento ao criar despesa
CREATE OR REPLACE FUNCTION insert_expense_movement()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO account_movements (
        user_id, 
        account_id, 
        amount, 
        occurred_at, 
        source_type, 
        source_id
    ) VALUES (
        NEW.user_id,
        NEW.account_id,
        -NEW.amount, -- negativo para despesa
        COALESCE(NEW.paid_at, NEW.created_at),
        'expense',
        NEW.id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para despesas
DROP TRIGGER IF EXISTS trigger_insert_expense_movement ON expenses;
CREATE TRIGGER trigger_insert_expense_movement
    AFTER INSERT ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION insert_expense_movement();

-- Função para inserir movimento ao criar receita
CREATE OR REPLACE FUNCTION insert_income_movement()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO account_movements (
        user_id, 
        account_id, 
        amount, 
        occurred_at, 
        source_type, 
        source_id
    ) VALUES (
        NEW.user_id,
        NEW.account_id,
        NEW.amount, -- positivo para receita
        NEW.received_at,
        'income',
        NEW.id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para receitas
DROP TRIGGER IF EXISTS trigger_insert_income_movement ON incomes;
CREATE TRIGGER trigger_insert_income_movement
    AFTER INSERT ON incomes
    FOR EACH ROW
    EXECUTE FUNCTION insert_income_movement();

-- Função para atualizar movimento ao atualizar despesa
CREATE OR REPLACE FUNCTION update_expense_movement()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualizar movimento existente
    UPDATE account_movements 
    SET 
        account_id = NEW.account_id,
        amount = -NEW.amount,
        occurred_at = COALESCE(NEW.paid_at, NEW.created_at)
    WHERE source_type = 'expense' AND source_id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualização de despesas
DROP TRIGGER IF EXISTS trigger_update_expense_movement ON expenses;
CREATE TRIGGER trigger_update_expense_movement
    AFTER UPDATE ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_expense_movement();

-- Função para atualizar movimento ao atualizar receita
CREATE OR REPLACE FUNCTION update_income_movement()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualizar movimento existente
    UPDATE account_movements 
    SET 
        account_id = NEW.account_id,
        amount = NEW.amount,
        occurred_at = NEW.received_at
    WHERE source_type = 'income' AND source_id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualização de receitas
DROP TRIGGER IF EXISTS trigger_update_income_movement ON incomes;
FOR EACH ROW
    EXECUTE FUNCTION update_income_movement();

-- Função para remover movimento ao excluir despesa
CREATE OR REPLACE FUNCTION delete_expense_movement()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM account_movements 
    WHERE source_type = 'expense' AND source_id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger para exclusão de despesas
DROP TRIGGER IF EXISTS trigger_delete_expense_movement ON expenses;
CREATE TRIGGER trigger_delete_expense_movement
    BEFORE DELETE ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION delete_expense_movement();

-- Função para remover movimento ao excluir receita
CREATE OR REPLACE FUNCTION delete_income_movement()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM account_movements 
    WHERE source_type = 'income' AND source_id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger para exclusão de receitas
DROP TRIGGER IF EXISTS trigger_delete_income_movement ON incomes;
CREATE TRIGGER trigger_delete_income_movement
    BEFORE DELETE ON incomes
    FOR EACH ROW
    EXECUTE FUNCTION delete_income_movement();

-- 6. Migrar dados existentes (se necessário)

-- Se existirem despesas com paidById ou transactionAccountId, migrar para accountId
-- (Execute apenas se necessário e se os dados existirem)
/*
UPDATE expenses 
SET account_id = COALESCE(transaction_account_id, paid_by_id)
WHERE account_id IS NULL AND (transaction_account_id IS NOT NULL OR paid_by_id IS NOT NULL);
*/

-- Se existirem receitas com receivingAccountId, migrar para accountId
-- (Execute apenas se necessário e se os dados existirem)
/*
UPDATE incomes 
SET account_id = receiving_account_id
WHERE account_id IS NULL AND receiving_account_id IS NOT NULL;
*/

-- 7. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_categories_user_flow_active ON categories(user_id, flow) WHERE is_archived = false;
CREATE INDEX IF NOT EXISTS idx_accounts_user_active ON accounts(user_id) WHERE is_archived = false;
CREATE INDEX IF NOT EXISTS idx_expenses_account ON expenses(account_id);
CREATE INDEX IF NOT EXISTS idx_incomes_account ON incomes(account_id);

-- ========================================
-- ROLLBACK (DOWN) - Execute para reverter
-- ========================================

/*
-- Remover triggers
DROP TRIGGER IF EXISTS trigger_insert_expense_movement ON expenses;
DROP TRIGGER IF EXISTS trigger_insert_income_movement ON incomes;
DROP TRIGGER IF EXISTS trigger_update_expense_movement ON expenses;
DROP TRIGGER IF EXISTS trigger_update_income_movement ON incomes;
DROP TRIGGER IF EXISTS trigger_delete_expense_movement ON expenses;
DROP TRIGGER IF EXISTS trigger_delete_income_movement ON incomes;

-- Remover funções
DROP FUNCTION IF EXISTS insert_expense_movement();
DROP FUNCTION IF EXISTS insert_income_movement();
DROP FUNCTION IF EXISTS update_expense_movement();
DROP FUNCTION IF EXISTS update_income_movement();
DROP FUNCTION IF EXISTS delete_expense_movement();
DROP FUNCTION IF EXISTS delete_income_movement();

-- Remover view
DROP VIEW IF EXISTS account_balances;

-- Remover tabelas
DROP TABLE IF EXISTS transfers;
DROP TABLE IF EXISTS account_movements;

-- Remover campos de arquivamento
ALTER TABLE categories DROP COLUMN IF EXISTS is_archived;
ALTER TABLE categories DROP COLUMN IF EXISTS archived_at;
ALTER TABLE accounts DROP COLUMN IF EXISTS is_archived;
ALTER TABLE accounts DROP COLUMN IF EXISTS archived_at;

-- Remover índices
DROP INDEX IF EXISTS idx_categories_user_flow_active;
DROP INDEX IF EXISTS idx_accounts_user_active;
DROP INDEX IF EXISTS idx_expenses_account;
DROP INDEX IF EXISTS idx_incomes_account;
*/
