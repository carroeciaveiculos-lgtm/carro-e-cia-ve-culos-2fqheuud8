-- Volta publicado_webmotors=true pro HR-V -- o anuncio real (73668233)
-- continua existindo (fotos reais), so travado. Deixar a flag em false
-- arrisca o mesmo trigger gerar outro pending_close contra esse anuncio
-- real numa proxima alteracao do veiculo.
UPDATE public.veiculos SET publicado_webmotors = true WHERE placa = 'PZQ2F46';
