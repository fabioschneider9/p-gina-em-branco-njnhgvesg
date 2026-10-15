// F2-T002 — correção das regras de acesso (RLS) das collections da central.
//
// Achado da verificação estrutural: em PocketBase, updateRule/deleteRule = ""
// significa PÚBLICO (não negado) — o 0001 deixou lote e emissão alteráveis e
// apagáveis por qualquer anônimo, violando a trilha append-only (RN-2-005).
//
// Regras corretas:
//  - f2_lots.updateRule: somente a transação de confirmação — registro em
//    STAGING, novo estado CONFIRMADO, nenhum outro campo alterado.
//  - f2_idempotency: emissão é imutável (update/delete só superuser).
//  - delete de lote: só superuser (reversão é lógica, RN-2-005).
migrate(
  (app) => {
    const lots = app.findCollectionByNameOrId('f2_lots')
    lots.updateRule =
      "@request.auth.id != '' && state = 'STAGING' && @request.body.state = 'CONFIRMADO' && @request.body.lot_id:changed = false && @request.body.source_kind:changed = false && @request.body.source_ref:changed = false && @request.body.source_version:changed = false && @request.body.source_hash:changed = false && @request.body.entity_id:changed = false && @request.body.unit_id:changed = false && @request.body.professional_id:changed = false && @request.body.competency:changed = false && @request.body.evidence_ref:changed = false && @request.body.contract_version:changed = false && @request.body.item_count:changed = false && @request.body.actor_id:changed = false"
    lots.deleteRule = null
    app.save(lots)

    const idem = app.findCollectionByNameOrId('f2_idempotency')
    idem.updateRule = null
    idem.deleteRule = null
    app.save(idem)
  },
  (app) => {
    // Reversão fiel ao estado anterior (regras do 0001).
    const lots = app.findCollectionByNameOrId('f2_lots')
    lots.updateRule = ''
    lots.deleteRule = ''
    app.save(lots)
    const idem = app.findCollectionByNameOrId('f2_idempotency')
    idem.updateRule = ''
    idem.deleteRule = ''
    app.save(idem)
  },
)
