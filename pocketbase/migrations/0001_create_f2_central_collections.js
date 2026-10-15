// F2-T002 — SPEC-2-001: collections da central financeira (armazenamento durável)
//
// Decisão F2-CONFIG-001: PocketBase nativo do Skip Cloud como armazenamento durável.
// Campos exclusivamente da SPEC-2-001 (nenhum campo inventado):
//   lot_id, source_kind, source_ref, source_version, source_hash, entity_id,
//   unit_id, professional_id, competency, evidence_ref, contract_version,
//   idempotency_key, estado do lote, auditoria.
//
// RN-2-002/RN-2-003: unicidade no servidor sobre idempotency_key
// (sistema:record_id:versão). RN-2-004: lote só é visível quando confirmado
// (barreira de leitura nas regras). RN-2-005: reversão append-only — nada é
// apagado, apenas marcado.
migrate(
  (app) => {
    // ---- Collection de lotes do ciclo ----
    const lots = new Collection({
      name: 'f2_lots',
      type: 'base',
      // Barreira de leitura: só lote confirmado (ou revertido, histórico) é visível.
      listRule: "@request.auth.id != '' && (state = 'CONFIRMADO' || state = 'REVERTIDO')",
      viewRule: "@request.auth.id != '' && (state = 'CONFIRMADO' || state = 'REVERTIDO')",
      createRule: "@request.auth.id != ''",
      // Lote não é editável nem apagável pela API — trilha append-only (RN-2-005).
      updateRule: '',
      deleteRule: '',
      fields: [
        { name: 'lot_id', type: 'text', required: true, min: 3, max: 100 },
        {
          name: 'state',
          type: 'select',
          required: true,
          values: ['STAGING', 'CONFIRMADO', 'REVERTIDO'],
          maxSelect: 1,
        },
        {
          name: 'source_kind',
          type: 'select',
          required: true,
          values: ['PRODUCTION_API', 'PDF_FALLBACK'],
          maxSelect: 1,
        },
        { name: 'source_ref', type: 'text', required: true, min: 3, max: 200 },
        { name: 'source_version', type: 'number', required: true, onlyInt: true, min: 1 },
        { name: 'source_hash', type: 'text', max: 200 },
        { name: 'entity_id', type: 'text', required: true, min: 3, max: 100 },
        { name: 'unit_id', type: 'text', required: true, min: 3, max: 100 },
        { name: 'professional_id', type: 'text', required: true, min: 3, max: 100 },
        { name: 'competency', type: 'text', required: true, min: 7, max: 7 },
        { name: 'evidence_ref', type: 'text', required: true, min: 3, max: 300 },
        { name: 'contract_version', type: 'text', required: true, min: 3, max: 50 },
        { name: 'item_count', type: 'number', required: true, onlyInt: true, min: 1 },
        { name: 'actor_id', type: 'text', required: true, min: 3, max: 100 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_f2_lots_lot_id ON f2_lots (lot_id)',
        'CREATE INDEX idx_f2_lots_competency ON f2_lots (competency)',
      ],
    })
    app.save(lots)

    // ---- Collection de idempotência (emissões) ----
    const idem = new Collection({
      name: 'f2_idempotency',
      type: 'base',
      // Emissões são consultáveis por usuários autenticados; a chave nunca é reutilizada.
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      // Registro de emissão é imutável e inapagável pela API (nunca limpar a idempotência).
      updateRule: '',
      deleteRule: '',
      fields: [
        {
          name: 'idempotency_key',
          type: 'text',
          required: true,
          min: 10,
          max: 200,
        },
        { name: 'lot_id', type: 'text', required: true, min: 3, max: 100 },
        { name: 'contract_version', type: 'text', required: true, min: 3, max: 50 },
        // Envelope production-record.v1 completo, preservando nulls (CA-1-015).
        { name: 'envelope', type: 'json', required: true, maxSize: 200000 },
        { name: 'record_id', type: 'text', required: true, min: 3, max: 100 },
        { name: 'source_version', type: 'number', required: true, onlyInt: true, min: 1 },
        { name: 'entity_id', type: 'text', required: true, min: 3, max: 100 },
        { name: 'unit_id', type: 'text', required: true, min: 3, max: 100 },
        { name: 'professional_id', type: 'text', required: true, min: 3, max: 100 },
        { name: 'competency', type: 'text', required: true, min: 7, max: 7 },
        { name: 'actor_id', type: 'text', required: true, min: 3, max: 100 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        // Unicidade no servidor (RN-2-002/RN-2-003) — a chave sistema:record_id:versão.
        'CREATE UNIQUE INDEX idx_f2_idem_key ON f2_idempotency (idempotency_key)',
        'CREATE INDEX idx_f2_idem_lot ON f2_idempotency (lot_id)',
      ],
    })
    app.save(idem)
  },
  (app) => {
    // Reversão estrutural: remove as duas collections na ordem inversa.
    try {
      app.delete(app.findCollectionByNameOrId('f2_idempotency'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('f2_lots'))
    } catch (_) {}
  },
)
