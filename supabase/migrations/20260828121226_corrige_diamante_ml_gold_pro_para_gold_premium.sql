-- Achado 28/08/2026 (Adriana confirmou): o tier real "Diamante" do Mercado
-- Livre e' gold_premium, nao gold_pro (que e' um tier real mas mais baixo --
-- ver ordem real em ml-cache.ts/validate-payload.ts: gold_premium > gold_pro
-- > gold_special > silver > bronze). O codigo tratava gold_pro como
-- "Diamante" desde sempre (platform-tiers.ts, VehicleFormModal, ml-client,
-- listing-preferences, ml-sync-advanced, ml-selective-sync, PortalTierSelector
-- corrigidos juntos nesta sessao). O Ford Ranger RCC9H74 foi promovido a
-- "Diamante" pelo seletor da tela (unico caminho que grava gold_pro hoje) e
-- precisa ser migrado pro valor real correto, senao passa a aparecer como
-- modalidade nao reconhecida no filtro/seletor apos a correcao do codigo.
UPDATE public.veiculos
SET ml_listing_type = 'gold_premium'
WHERE id = '2af6bf4d-b406-4ee9-beb9-caf773beedee'
  AND ml_listing_type = 'gold_pro';
