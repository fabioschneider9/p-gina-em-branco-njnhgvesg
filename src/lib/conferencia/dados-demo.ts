/* Dados FICTÍCIOS da demonstração "Central de conferência — Qualivida".
   Não são registros reais, não vêm de banco nem de planilha e não são tabela de preços da clínica.
   Os valores esperados são apenas exemplos para ilustrar a comparação. */

export interface AtendimentoDemo {
  /** Identificação de demonstração do atendimento (ex.: DEMO-001). */
  id: string
  /** Data do atendimento, formato AAAA-MM-DD. */
  data: string | null
  unidade: string | null
  profissional: string | null
  servico: string | null
  pagador: string | null
  /** Valor esperado no exemplo (não é tabela de preços). */
  valorEsperado: number | null
}

export interface LancamentoDemo {
  /** Identificação do lançamento no faturamento de demonstração. */
  id: string
  /** ID de demonstração do atendimento ao qual o lançamento corresponde. */
  atendimentoId: string | null
  /** Mês de referência, formato AAAA-MM. */
  competencia: string | null
  profissional: string | null
  servico: string | null
  pagador: string | null
  valorLancado: number | null
}

export const UNIDADES = ['Unidade de demonstração A', 'Unidade de demonstração B']
export const PROFISSIONAIS = ['Dra. Ana Souza', 'Dr. Bruno Lima', 'Dra. Carla Mendes']
export const PAGADORES = ['Particular', 'Convênio Demonstração Saúde', 'Plano Demonstração Plus']
export const SERVICOS = ['Consulta', 'ECG', 'EEG']
export const COMPETENCIAS = ['2025-09', '2025-10']

export const ATENDIMENTOS_DEMO: AtendimentoDemo[] = [
  {
    id: 'DEMO-001',
    data: '2025-09-02',
    unidade: UNIDADES[0],
    profissional: PROFISSIONAIS[0],
    servico: 'Consulta',
    pagador: 'Particular',
    valorEsperado: 250,
  },
  {
    id: 'DEMO-002',
    data: '2025-09-03',
    unidade: UNIDADES[0],
    profissional: PROFISSIONAIS[1],
    servico: 'ECG',
    pagador: 'Convênio Demonstração Saúde',
    valorEsperado: 180,
  },
  {
    id: 'DEMO-003',
    data: '2025-09-05',
    unidade: UNIDADES[1],
    profissional: PROFISSIONAIS[2],
    servico: 'EEG',
    pagador: 'Plano Demonstração Plus',
    valorEsperado: 420,
  },
  {
    id: 'DEMO-004',
    data: '2025-09-09',
    unidade: UNIDADES[0],
    profissional: PROFISSIONAIS[0],
    servico: 'Consulta',
    pagador: 'Convênio Demonstração Saúde',
    valorEsperado: 200,
  },
  {
    id: 'DEMO-005',
    data: '2025-09-12',
    unidade: UNIDADES[1],
    profissional: PROFISSIONAIS[1],
    servico: 'Consulta',
    pagador: 'Particular',
    valorEsperado: null,
  },
  {
    id: 'DEMO-006',
    data: '2025-09-16',
    unidade: UNIDADES[0],
    profissional: PROFISSIONAIS[2],
    servico: 'ECG',
    pagador: 'Plano Demonstração Plus',
    valorEsperado: 190,
  },
  {
    id: 'DEMO-007',
    data: '2025-09-18',
    unidade: UNIDADES[1],
    profissional: PROFISSIONAIS[0],
    servico: 'EEG',
    pagador: 'Particular',
    valorEsperado: 400,
  },
  {
    id: 'DEMO-008',
    data: '2025-10-02',
    unidade: UNIDADES[0],
    profissional: PROFISSIONAIS[1],
    servico: 'Consulta',
    pagador: 'Convênio Demonstração Saúde',
    valorEsperado: 210,
  },
  {
    id: 'DEMO-009',
    data: '2025-10-06',
    unidade: UNIDADES[1],
    profissional: PROFISSIONAIS[2],
    servico: 'Consulta',
    pagador: 'Plano Demonstração Plus',
    valorEsperado: 220,
  },
  {
    id: 'DEMO-010',
    data: '2025-10-08',
    unidade: UNIDADES[0],
    profissional: PROFISSIONAIS[0],
    servico: 'ECG',
    pagador: 'Particular',
    valorEsperado: 180,
  },
  {
    id: 'DEMO-011',
    data: '2025-10-14',
    unidade: UNIDADES[1],
    profissional: PROFISSIONAIS[1],
    servico: 'EEG',
    pagador: 'Convênio Demonstração Saúde',
    valorEsperado: 380,
  },
  {
    id: 'DEMO-012',
    data: '2025-10-20',
    unidade: UNIDADES[0],
    profissional: PROFISSIONAIS[2],
    servico: 'Consulta',
    pagador: 'Particular',
    valorEsperado: 250,
  },
  {
    id: 'DEMO-013',
    data: '2025-10-22',
    unidade: UNIDADES[1],
    profissional: PROFISSIONAIS[0],
    servico: 'ECG',
    pagador: 'Plano Demonstração Plus',
    valorEsperado: 190,
  },
]

export const LANCAMENTOS_DEMO: LancamentoDemo[] = [
  {
    id: 'LAN-001',
    atendimentoId: 'DEMO-001',
    competencia: '2025-09',
    profissional: PROFISSIONAIS[0],
    servico: 'Consulta',
    pagador: 'Particular',
    valorLancado: 250,
  },
  {
    id: 'LAN-003',
    atendimentoId: 'DEMO-003',
    competencia: '2025-09',
    profissional: PROFISSIONAIS[2],
    servico: 'EEG',
    pagador: 'Plano Demonstração Plus',
    valorLancado: 380,
  },
  {
    id: 'LAN-004A',
    atendimentoId: 'DEMO-004',
    competencia: '2025-09',
    profissional: PROFISSIONAIS[0],
    servico: 'Consulta',
    pagador: 'Convênio Demonstração Saúde',
    valorLancado: 200,
  },
  {
    id: 'LAN-004B',
    atendimentoId: 'DEMO-004',
    competencia: '2025-09',
    profissional: PROFISSIONAIS[0],
    servico: 'Consulta',
    pagador: 'Convênio Demonstração Saúde',
    valorLancado: 200,
  },
  {
    id: 'LAN-005',
    atendimentoId: 'DEMO-005',
    competencia: '2025-09',
    profissional: PROFISSIONAIS[1],
    servico: 'Consulta',
    pagador: 'Particular',
    valorLancado: 200,
  },
  {
    id: 'LAN-006',
    atendimentoId: 'DEMO-006',
    competencia: '2025-09',
    profissional: PROFISSIONAIS[2],
    servico: 'ECG',
    pagador: 'Plano Demonstração Plus',
    valorLancado: 190,
  },
  {
    id: 'LAN-008',
    atendimentoId: 'DEMO-008',
    competencia: '2025-10',
    profissional: PROFISSIONAIS[1],
    servico: 'Consulta',
    pagador: 'Convênio Demonstração Saúde',
    valorLancado: 210,
  },
  {
    id: 'LAN-009',
    atendimentoId: 'DEMO-009',
    competencia: '2025-10',
    profissional: PROFISSIONAIS[2],
    servico: 'Consulta',
    pagador: 'Plano Demonstração Plus',
    valorLancado: 220,
  },
  {
    id: 'LAN-010',
    atendimentoId: 'DEMO-010',
    competencia: '2025-10',
    profissional: PROFISSIONAIS[0],
    servico: 'ECG',
    pagador: 'Particular',
    valorLancado: null,
  },
  {
    id: 'LAN-011',
    atendimentoId: 'DEMO-011',
    competencia: '2025-10',
    profissional: PROFISSIONAIS[1],
    servico: 'EEG',
    pagador: 'Convênio Demonstração Saúde',
    valorLancado: 350,
  },
  {
    id: 'LAN-012A',
    atendimentoId: 'DEMO-012',
    competencia: '2025-10',
    profissional: PROFISSIONAIS[2],
    servico: 'Consulta',
    pagador: 'Particular',
    valorLancado: 250,
  },
  {
    id: 'LAN-012B',
    atendimentoId: 'DEMO-012',
    competencia: '2025-10',
    profissional: PROFISSIONAIS[2],
    servico: 'Consulta',
    pagador: 'Particular',
    valorLancado: 250,
  },
]
