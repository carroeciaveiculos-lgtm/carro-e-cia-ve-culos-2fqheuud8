import React from 'react'
import ContratoDocxGenerator from '@/components/ContratoDocxGenerator'
import { ContratoPdfGenerator } from '@/components/ContratoPdfGenerator'
import { AssinaturaDialog } from '@/components/consignacao/AssinaturaDialog'
import { ContratoData } from '@/types/contrato'

interface PainelContratoAcoesProps {
  contratoData: ContratoData
  contratoId: string
  pdfUrl?: string
}

export function PainelContratoAcoes({
  contratoData,
  contratoId,
  pdfUrl,
}: PainelContratoAcoesProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg w-full">
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        <ContratoDocxGenerator contratoData={contratoData} />
        <ContratoPdfGenerator contratoData={contratoData} />
      </div>

      <div className="w-full sm:w-auto">
        <AssinaturaDialog
          contratoId={contratoId}
          emailCliente={contratoData.proprietario?.email || ''}
          nomeCliente={contratoData.proprietario?.nome || ''}
          proprietarioTelefone={contratoData.proprietario?.telefone}
          proprietarioCpf={contratoData.proprietario?.cpfCnpj || contratoData.proprietario?.cpf}
          numeroContrato={contratoData.numeroContrato}
          pdfUrl={pdfUrl}
        />
      </div>
    </div>
  )
}
