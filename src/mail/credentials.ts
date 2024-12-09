const credentialsJSON = (await import(`../../src/mail/${process.env.NODE_ENV.toLowerCase()}-mail-credentials.json`, {
  assert: { type: 'json' }
})).default
const credentials = structuredClone(credentialsJSON)

export default credentials
