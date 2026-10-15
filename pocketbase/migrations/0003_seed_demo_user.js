// F2-T002 — usuário sintético de demonstração para autenticação no PocketBase.
//
// As regras das collections da central exigem usuário autenticado
// (@request.auth.id != ''). A demonstração usa um usuário FIXTURE, sem
// qualquer dado real — identidade sintética da fonte fixture://fase-2.
// Seed idempotente: cria somente se o e-mail não existir.
migrate(
  (app) => {
    try {
      app.findAuthRecordByEmail('_pb_users_auth_', 'demo-f2@fixture.qualivida.com.br')
      return // já semeado
    } catch (_) {}
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    const record = new Record(users)
    record.setEmail('demo-f2@fixture.qualivida.com.br')
    record.setPassword('F2-demo-fixture-001')
    record.setVerified(true)
    record.set('name', 'Usuário de demonstração F2 (sintético)')
    app.save(record)
  },
  (app) => {
    try {
      const record = app.findAuthRecordByEmail(
        '_pb_users_auth_',
        'demo-f2@fixture.qualivida.com.br',
      )
      app.delete(record)
    } catch (_) {}
  },
)
