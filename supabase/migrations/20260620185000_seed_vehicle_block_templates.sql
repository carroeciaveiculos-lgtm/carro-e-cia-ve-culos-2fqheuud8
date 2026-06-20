DO $$
BEGIN
  -- Insert Vehicle Templates
  INSERT INTO block_templates (id, nome, categoria, conteudo)
  VALUES
    (
      '00000000-0000-0000-0000-000000000010'::uuid, 
      'Card de Veículo Individual', 
      'Veículos', 
      '{"type": "vehicle-card", "data": {"veiculo_id": ""}}'::jsonb
    ),
    (
      '00000000-0000-0000-0000-000000000011'::uuid, 
      'Carrossel de Destaques', 
      'Veículos', 
      '{"type": "stock-slider", "data": {"limit": 5}}'::jsonb
    ),
    (
      '00000000-0000-0000-0000-000000000012'::uuid, 
      'Grid de Estoque', 
      'Veículos', 
      '{"type": "inventory-grid", "data": {"categoria": "", "limit": 6}}'::jsonb
    )
  ON CONFLICT (id) DO NOTHING;
END $$;
