export interface ContratoData {
  id: string
  numeroContrato: string
  dataContrato: string
  proprietario: {
    nome: string
    cpf: string
    rg: string
    telefone: string
    email: string
    endereco: string
    cidade: string
    estado: string
  }
  loja: {
    razaoSocial: string
    cnpj: string
    endereco: string
    telefone: string
    responsavel: string
  }
  veiculo: {
    placa: string
    chassi: string
    marca: string
    modelo: string
    anoFab: string
    anoModelo: string
    combustivel: string
    cor: string
    quilometragem: number
    renavam: string
  }
  condicoesComerciais: {
    precoVendaSugerido: number
    precoMinimoAceito: number
    comissaoPercentual: number
    comissaoValor: number
    periodoConsignacaoDias: number
    dataInicio: string
    dataVencimento: string
  }
  observacoes?: string
}
