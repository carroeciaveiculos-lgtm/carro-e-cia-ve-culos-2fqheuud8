import { saveAs } from 'file-saver'

/**
 * Inicia o download de um Blob para o computador do usuário.
 * @param blob O Blob do arquivo a ser baixado.
 * @param filename O nome do arquivo (ex: 'contrato.docx').
 */
export function downloadBlob(blob: Blob, filename: string): void {
  saveAs(blob, filename)
}
