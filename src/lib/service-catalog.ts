/**
 * F1-T005 — Contrato de campos mínimos (F1-FIELDS-BASELINE)
 * Catálogo próprio de serviços e pagadores, por clínica/unidade.
 *
 * RN-1-005: célula sem valor vinculado (serviço × pagador) = serviço não atendido
 *           → indisponível para marcação/agendamento.
 * RN-1-006: catálogo é por clínica/unidade — cada unidade tem seu pacote de valores.
 * RN-1-007: alterar valor não muda o histórico lançado; todo valor tem data de
 *           vigência (imediata, futura programada ou retroativa).
 *
 * Fonte: Valores_Qualivida.xlsx (Clínica Qualivida Resende/RJ) — valores
 * DESATUALIZADOS e informativos; o que importa é a existência da vinculação.
 */

export type CatalogService = {
  serviceId: string
  tuss: string | null
  label: string
}

export type CatalogPayer = {
  payerId: string
  label: string
}

/** Uma entrada na linha do tempo de valores de um serviço para um pagador numa clínica. */
export type PriceEntry = {
  value: number
  /** Data (ISO) a partir da qual o valor entra em vigência. */
  effectiveFrom: string
  registeredAt: string
  registeredBy: string
  reason?: string
  kind: 'imediata' | 'futura' | 'retroativa'
}

export type CatalogClinic = {
  unitId: string
  label: string
  /** serviço (label) × pagador (payerId) → linha do tempo de valores. */
  prices: Record<string, Record<string, PriceEntry[]>>
}

export const catalogServices: CatalogService[] = [
  { serviceId: 'SRV-001', tuss: '10101012', label: 'Consulta' },
  { serviceId: 'SRV-002', tuss: '40101010', label: 'ECG' },
  { serviceId: 'SRV-003', tuss: '40901106', label: 'ECO' },
  { serviceId: 'SRV-004', tuss: '40901076', label: 'ECO-Stress' },
  { serviceId: 'SRV-005', tuss: '40901360', label: 'Carótidas' },
  { serviceId: 'SRV-006', tuss: '40101037', label: 'TE' },
  { serviceId: 'SRV-007', tuss: '20102038', label: 'MAPA' },
  { serviceId: 'SRV-008', tuss: '20102020', label: 'Holter' },
  { serviceId: 'SRV-009', tuss: '40103170', label: 'EEG rotina' },
  { serviceId: 'SRV-010', tuss: '40103196', label: 'EEG Quantitativo' },
  { serviceId: 'SRV-011', tuss: '40103234', label: 'EEG Sono/Vigilia' },
  { serviceId: 'SRV-012', tuss: '40103200', label: 'EEG Prolongado' },
  { serviceId: 'SRV-013', tuss: '40103218', label: 'EEG Fotoestímulo' },
  { serviceId: 'SRV-014', tuss: null, label: 'Holter-EEG 12hs' },
  { serviceId: 'SRV-015', tuss: null, label: 'Holter-EEG 24hs' },
  { serviceId: 'SRV-016', tuss: '40103757', label: 'VEEG' },
  { serviceId: 'SRV-017', tuss: null, label: 'VEEG prol 1 hora' },
  { serviceId: 'SRV-018', tuss: null, label: 'VEEG prol 2 hora' },
  { serviceId: 'SRV-019', tuss: '40103528', label: 'PSG noite inteira' },
  { serviceId: 'SRV-020', tuss: '40103536', label: 'PSG com EEG' },
  { serviceId: 'SRV-021', tuss: '40103544', label: 'PSG com CPAP' },
  { serviceId: 'SRV-022', tuss: '40901602', label: 'Doppler Transcraniano' },
  { serviceId: 'SRV-023', tuss: '40901025', label: 'US Globo Ocular' },
  { serviceId: 'SRV-024', tuss: '20103301', label: 'Infiltração de ponto gatinho' },
  { serviceId: 'SRV-025', tuss: '31602118', label: 'Bloqueio Anestesico de nervo' },
  { serviceId: 'SRV-026', tuss: '40901823', label: 'US vascular com contraste de microbolhas' },
  { serviceId: 'SRV-027', tuss: '20103140', label: 'Bloqueio Fenolico Alcoolico' },
]

export const catalogPayers: CatalogPayer[] = [
  { payerId: 'P-BRADESCO-EMP', label: 'Bradesco Emp' },
  { payerId: 'P-BRADESCO-IND', label: 'Bradesco Ind' },
  { payerId: 'P-MEDISERVICE', label: 'Mediservice' },
  { payerId: 'P-SULAMERICA', label: 'Sulamérica' },
  { payerId: 'P-GEAP', label: 'GEAP' },
  { payerId: 'P-INB', label: 'INB' },
  { payerId: 'P-PARTICULAR', label: 'Particular' },
  { payerId: 'P-PARTICULAR-VRBM', label: 'Particular VR/BM' },
  { payerId: 'P-SALVUS', label: 'Salvus' },
  { payerId: 'P-SALUTEM', label: 'Salutem' },
  { payerId: 'P-SAUDE-CAIXA', label: 'Saúde CAIXA' },
  { payerId: 'P-UNIMED', label: 'UNIMED' },
  { payerId: 'P-GOLDEN-CROSS', label: 'Golden Cross' },
  { payerId: 'P-FUSEX', label: 'Fusex' },
  { payerId: 'P-CASSI', label: 'CASSI' },
  { payerId: 'P-POSTAL', label: 'Postal Saúde' },
  { payerId: 'P-REAL-GRANDEZA', label: 'Real Grandeza' },
  { payerId: 'P-PLAMER', label: 'Plamer' },
  { payerId: 'P-AMIL', label: 'Amil' },
  { payerId: 'P-ABERTTA', label: 'Abertta' },
  { payerId: 'P-LIV', label: 'Liv' },
]

const v = (
  value: number,
  effectiveFrom: string,
  registeredAt: string,
  registeredBy: string,
  kind: PriceEntry['kind'],
  reason?: string,
): PriceEntry => ({ value, effectiveFrom, registeredAt, registeredBy, kind, reason })

/**
 * Pacote da Clínica Qualivida Resende/RJ (RN-1-006).
 * Amostra representativa da planilha (valores desatualizados/informativos).
 * Ausência de chave = sem vinculação = não atendido (RN-1-005).
 */
export const catalogClinics: CatalogClinic[] = [
  {
    unitId: 'UNIT-TEST-001',
    label: 'Clínica Qualivida Resende/RJ (pacote de exemplo)',
    prices: {
      Consulta: {
        'P-BRADESCO-EMP': [
          v(104, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata'),
        ],
        'P-BRADESCO-IND': [
          v(104, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata'),
        ],
        'P-MEDISERVICE': [
          v(104, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata'),
        ],
        'P-SULAMERICA': [
          v(107.12, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata'),
        ],
        'P-GEAP': [v(87.2, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata')],
        'P-INB': [v(85, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata')],
        'P-PARTICULAR': [
          v(150, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata'),
          v(
            200,
            '2027-01-01',
            '2026-09-01T10:00:00Z',
            'ADMIN-USER-001',
            'futura',
            'Reajuste decidido em 2026; entra em 2027-01-01',
          ),
        ],
        'P-SALVUS': [v(70, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata')],
        'P-SALUTEM': [v(70, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata')],
        'P-SAUDE-CAIXA': [
          v(116, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata'),
        ],
      },
      ECG: {
        'P-BRADESCO-EMP': [
          v(21.91, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata'),
        ],
        'P-BRADESCO-IND': [
          v(17.25, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata'),
        ],
        'P-MEDISERVICE': [
          v(21.91, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata'),
        ],
        'P-SULAMERICA': [
          v(21.99, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata'),
        ],
        'P-GEAP': [v(23, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata')],
        'P-INB': [
          v(21.3, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata'),
          v(
            24.5,
            '2026-06-01',
            '2026-07-20T10:00:00Z',
            'ADMIN-USER-001',
            'retroativa',
            'Valor corrigido após demonstrativo de junho recebido em julho',
          ),
        ],
        'P-PARTICULAR': [v(30, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata')],
        'P-SALVUS': [v(24.63, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata')],
        'P-SALUTEM': [v(24.63, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata')],
        'P-SAUDE-CAIXA': [
          v(33.93, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata'),
        ],
      },
      ECO: {
        'P-BRADESCO-EMP': [
          v(268.94, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata'),
        ],
        'P-BRADESCO-IND': [
          v(208.44, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata'),
        ],
        'P-MEDISERVICE': [
          v(268.94, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata'),
        ],
        'P-SULAMERICA': [
          v(148.45, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata'),
        ],
        'P-GEAP': [v(129.6, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata')],
        'P-INB': [v(291.19, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata')],
        'P-PARTICULAR': [
          v(200, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata'),
        ],
        'P-SALVUS': [v(269.38, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata')],
        'P-SALUTEM': [
          v(269.38, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata'),
        ],
        'P-SAUDE-CAIXA': [
          v(306.74, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata'),
        ],
      },
      'ECO-Stress': {
        'P-BRADESCO-EMP': [
          v(376.98, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata'),
        ],
        'P-BRADESCO-IND': [
          v(205.96, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata'),
        ],
        'P-GEAP': [v(250, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata')],
        'P-INB': [v(428.59, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata')],
        'P-PARTICULAR': [
          v(600, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata'),
        ],
        'P-SAUDE-CAIXA': [
          v(750.02, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata'),
        ],
        // Mediservice e Sulamérica: sem vínculo na planilha ("NÃO"/vazio) → RN-1-005.
      },
      Carótidas: {
        'P-BRADESCO-EMP': [
          v(91.41, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata'),
        ],
        'P-BRADESCO-IND': [
          v(82.63, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata'),
        ],
        'P-MEDISERVICE': [
          v(123.73, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata'),
        ],
        'P-SULAMERICA': [
          v(141.94, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata'),
        ],
        'P-GEAP': [v(117.63, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata')],
        'P-INB': [v(276.66, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata')],
        'P-PARTICULAR': [
          v(200, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata'),
        ],
        'P-SALVUS': [v(229.75, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata')],
        'P-SALUTEM': [
          v(229.75, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata'),
        ],
        'P-SAUDE-CAIXA': [
          v(304.95, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata'),
        ],
      },
      MAPA: {
        'P-BRADESCO-EMP': [
          v(103.27, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata'),
        ],
        'P-BRADESCO-IND': [
          v(103.27, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata'),
        ],
        'P-MEDISERVICE': [
          v(103.27, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata'),
        ],
        'P-SULAMERICA': [
          v(77.1, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata'),
        ],
        'P-GEAP': [v(95, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata')],
        'P-INB': [v(186, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata')],
        'P-PARTICULAR': [
          v(120, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata'),
        ],
        'P-SALVUS': [v(170, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata')],
        'P-SALUTEM': [v(170, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata')],
        'P-SAUDE-CAIXA': [
          v(199.52, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata'),
        ],
      },
      Holter: {
        'P-BRADESCO-EMP': [
          v(165.82, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata'),
        ],
        'P-BRADESCO-IND': [
          v(165.82, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata'),
        ],
        'P-MEDISERVICE': [
          v(165.82, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata'),
        ],
        'P-SULAMERICA': [
          v(80.33, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata'),
        ],
        'P-GEAP': [v(95, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata')],
        'P-INB': [v(186, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata')],
        'P-PARTICULAR': [
          v(120, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata'),
        ],
        'P-SALVUS': [v(170, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata')],
        'P-SALUTEM': [v(170, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata')],
        'P-SAUDE-CAIXA': [
          v(199.52, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata'),
        ],
      },
      'EEG rotina': {
        'P-BRADESCO-EMP': [
          v(47.93, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata'),
        ],
        'P-BRADESCO-IND': [
          v(47.92, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata'),
        ],
        'P-MEDISERVICE': [
          v(47.93, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata'),
        ],
        'P-SULAMERICA': [
          v(109.48, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata'),
        ],
        'P-GEAP': [v(66.48, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata')],
        'P-INB': [v(85.2, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata')],
        'P-PARTICULAR': [
          v(270, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata'),
        ],
        'P-PARTICULAR-VRBM': [
          v(300, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata'),
        ],
        'P-SALVUS': [v(78, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata')],
        'P-SALUTEM': [v(78, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata')],
        'P-SAUDE-CAIXA': [
          v(98.82, '2026-01-01', '2026-01-01T09:00:00Z', 'ADMIN-USER-001', 'imediata'),
        ],
      },
    },
  },
]

/** Busca a clínica pelo unitId (RN-1-006: catálogo por clínica). */
export function getClinic(unitId: string): CatalogClinic | undefined {
  return catalogClinics.find((clinic) => clinic.unitId === unitId)
}

/**
 * RN-1-005: serviço só está disponível para marcação/agendamento quando existe
 * vinculação na tabela de preços daquela clínica para aquele pagador.
 */
export function isServiceOffered(serviceLabel: string, payerId: string, unitId: string): boolean {
  const clinic = getClinic(unitId)
  if (!clinic) return false
  const timeline = clinic.prices[serviceLabel]?.[payerId]
  return Array.isArray(timeline) && timeline.length > 0
}

/**
 * RN-1-007: valor vigente numa data = última entrada com effectiveFrom <= data.
 * Retorna null quando não há vínculo (RN-1-005) ou nenhuma vigência começou.
 */
export function getPriceAt(
  serviceLabel: string,
  payerId: string,
  unitId: string,
  atDate: string,
): PriceEntry | null {
  const clinic = getClinic(unitId)
  if (!clinic) return null
  const timeline = clinic.prices[serviceLabel]?.[payerId]
  if (!timeline) return null
  const effective = timeline
    .filter((entry) => entry.effectiveFrom <= atDate)
    .sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom))
  return effective.length > 0 ? effective[effective.length - 1] : null
}

/** Serviços disponíveis para um pagador numa clínica (RN-1-005). */
export function availableServices(payerId: string, unitId: string): CatalogService[] {
  return catalogServices.filter((service) => isServiceOffered(service.label, payerId, unitId))
}

/** Serviços sem código TUSS ficam BLOQUEADOS até receber código (contrato F1-T005). */
export function isServiceBlockedByMissingCode(service: CatalogService): boolean {
  return service.tuss === null
}
