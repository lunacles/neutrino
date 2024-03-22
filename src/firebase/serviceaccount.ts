import serviceAccountJSON from '../../serviceaccount.json'

process.env.SERVICE_ACCOUNT = btoa(JSON.stringify(serviceAccountJSON))
const serviceAccount = structuredClone(serviceAccountJSON)

export default serviceAccount
