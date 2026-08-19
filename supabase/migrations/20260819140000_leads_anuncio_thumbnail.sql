-- Achado 19/08/2026: o webhook do WhatsApp já manda a imagem/vídeo do
-- criativo do anúncio (referral.thumbnail_url / referral.video_url) quando
-- o lead vem de clique-para-WhatsApp — a gente só nunca guardava isso.
-- thumbnail_url da Meta expira (link assinado da CDN do Facebook), por
-- isso a imagem é baixada e re-hospedada no R2 pelo receive-leads antes de
-- gravar aqui. video_url é um link pro post/vídeo, não expira.
alter table leads
  add column if not exists anuncio_thumbnail_url text,
  add column if not exists anuncio_video_url text;

comment on column leads.anuncio_thumbnail_url is 'Imagem do criativo do anúncio (Meta CTWA), re-hospedada no R2 — o link original da Meta expira. Preenchido só quando o lead chega via clique-para-WhatsApp de anúncio real.';
comment on column leads.anuncio_video_url is 'Link pro post/vídeo do anúncio no Facebook (não expira, não precisa re-hospedar).';
