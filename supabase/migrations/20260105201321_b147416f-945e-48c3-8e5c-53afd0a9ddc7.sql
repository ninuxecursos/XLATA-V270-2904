-- Remove o trigger que está causando erro (tenta atualizar campo updated_at que não existe)
DROP TRIGGER IF EXISTS update_user_direct_messages_updated_at ON user_direct_messages;