-- Migrar depoimentos reais para a tabela landing_testimonials
-- Substituir dados seed genéricos pelos depoimentos reais salvos anteriormente

DELETE FROM landing_testimonials;

INSERT INTO landing_testimonials (name, company, location, rating, text, revenue, photo_url, display_order, is_active) VALUES
('Gabriel Celestino', 'JMG Sucatas', 'São Bernardo do Campo - SP', 5, 
 'Cara, triplicou minha produtividade! O que levava 10 minutos agora levo 3. A fila acabou!', 
 '+R$ 8.000,00', 
 'https://oxawvjcckmbevjztyfgp.supabase.co/storage/v1/object/public/landing-images/testimonial_0_399d294b-64bb-46f0-8aff-13f79dc4c95f_1750031367395.png', 
 1, true),

('Hélio Machado', 'Frost Reciclagem', 'Três Corações - MG', 5, 
 'Acabaram os erros de conta e as brigas com cliente. Sistema XLata é perfeito, recomendo!', 
 '+R$ 11.700,00', 
 'https://oxawvjcckmbevjztyfgp.supabase.co/storage/v1/object/public/landing-images/testimonial_1_399d294b-64bb-46f0-8aff-13f79dc4c95f_1750031439175.png', 
 2, true),

('Denis Cardoso', 'Den Sucata', 'Guarulhos - SP', 5, 
 'Vou te falar, eu era do tempo da caneta e calculadora. Toda semana sumia dinheiro, e eu achava que era azar. Depois que botei o XLata aqui, o sistema virou meu gerente!', 
 '+R$ 14.700,00', 
 'https://oxawvjcckmbevjztyfgp.supabase.co/storage/v1/object/public/landing-images/testimonial_2_399d294b-64bb-46f0-8aff-13f79dc4c95f_1750031765724.png', 
 3, true);