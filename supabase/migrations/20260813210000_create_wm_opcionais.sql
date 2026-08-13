-- Achado via WSDL público (?WSDL, 13/08/2026): Opcional no IncluirCarro é um
-- array de {CodigoOpcional, Descricao}, não texto livre — por isso nenhum
-- opcional aparecia nos anúncios até aqui (a tag sempre ia vazia). Mesmo
-- padrão de/para de wm_cores/wm_cambios/wm_combustiveis.
CREATE TABLE IF NOT EXISTS wm_opcionais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_crm text,
  codigo_wm text UNIQUE,
  nome_wm text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE wm_opcionais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_access_wm_opcionais" ON wm_opcionais FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access_wm_opcionais" ON wm_opcionais FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Catálogo real, consultado ao vivo via ObterOpcionais (13/08/2026).
INSERT INTO wm_opcionais (codigo_wm, nome_wm) VALUES
  ('5','Alarme'),('6','Ar condicionado'),('7','Ar quente'),
  ('8','Bancos dianteiros com aquecimento'),('9','Banco do motorista com ajuste de altura'),
  ('10','Bancos em couro'),('11','CD Player'),('12','Computador de bordo'),
  ('13','Controle de tração'),('14','Desembaçador traseiro'),
  ('15','Encosto de cabeça traseiro'),('16','Freio ABS'),('17','Limpador  traseiro'),
  ('18','Tração 4x4'),('19','Retrovisor fotocrômico'),('20','Farol xenônio'),
  ('21','Controle automático de velocidade'),('22','Protetor de caçamba'),
  ('23','Rádio'),('24','Retrovisores elétricos'),('25','Rodas de liga leve'),
  ('26','Sensor de chuva'),('27','Sensor de estacionamento'),('28','Teto solar'),
  ('29','Rádio e Toca fitas'),('30','Travas elétricas'),('31','Vidros elétricos'),
  ('32','Volante com regulagem de altura'),('33','Capota marítima'),('34','Disqueteira'),
  ('36','Direção hidráulica'),('37','GPS'),('38','CD e MP3 Player'),('39','DVD Player'),
  ('40','Air Bag')
ON CONFLICT (codigo_wm) DO NOTHING;

-- De/para com os termos usados em veiculos.diferenciais hoje. Termos sem
-- equivalente no catálogo da Webmotors (Câmera de ré, Direção Elétrica,
-- Multimídia) ficam sem mapeamento — só não aparecem como opcional lá,
-- não bloqueia nada.
UPDATE wm_opcionais SET nome_crm = 'Airbag' WHERE codigo_wm = '40';
UPDATE wm_opcionais SET nome_crm = 'Alarme' WHERE codigo_wm = '5';
UPDATE wm_opcionais SET nome_crm = 'Ar condicionado' WHERE codigo_wm = '6';
UPDATE wm_opcionais SET nome_crm = 'Bancos de Couro' WHERE codigo_wm = '10';
UPDATE wm_opcionais SET nome_crm = 'Computador de bordo' WHERE codigo_wm = '12';
UPDATE wm_opcionais SET nome_crm = 'Direção Hidraulica' WHERE codigo_wm = '36';
UPDATE wm_opcionais SET nome_crm = 'Freios ABS' WHERE codigo_wm = '16';
UPDATE wm_opcionais SET nome_crm = 'GPS' WHERE codigo_wm = '37';
UPDATE wm_opcionais SET nome_crm = 'Sensor de estacionamento' WHERE codigo_wm = '27';
UPDATE wm_opcionais SET nome_crm = 'Teto solar' WHERE codigo_wm = '28';
UPDATE wm_opcionais SET nome_crm = 'Tração 4x4' WHERE codigo_wm = '18';
UPDATE wm_opcionais SET nome_crm = 'Travas elétricas' WHERE codigo_wm = '30';
UPDATE wm_opcionais SET nome_crm = 'Vidros elétricos' WHERE codigo_wm = '31';
