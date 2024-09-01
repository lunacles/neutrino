const serviceAccountJSON = (await import(`../../../${process.env.NODE_ENV.toLowerCase()}-serviceaccount.json`, {
  assert: { type: 'json' }
})).default
const serviceAccount = structuredClone(serviceAccountJSON)

export default serviceAccount
