// object-cover preenche o quadro cortando o excesso — necessário pra manter
// os cards do mesmo tamanho. Em fotos verticais/quadradas (não paisagem), o
// ponto de corte padrão (object-[center_65%], mais pra baixo) acaba cortando
// o teto do carro. Pra essas fotos, ancora o corte no topo assim que a foto
// carrega, mostrando o carro inteiro de cima pra baixo o quanto for
// possível. Fotos paisagem (a maioria) continuam com o ponto de corte
// padrão, sem mudança nenhuma.
function applyCoverPosition(img: HTMLImageElement) {
  if (img.naturalWidth && img.naturalHeight && img.naturalWidth / img.naturalHeight < 1.15) {
    img.style.objectPosition = 'center top'
  }
}

export function coverPositionRef(img: HTMLImageElement | null) {
  if (img && img.complete) applyCoverPosition(img)
}

export function onCoverPositionLoad(e: React.SyntheticEvent<HTMLImageElement>) {
  applyCoverPosition(e.currentTarget)
}
