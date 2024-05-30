const serviceAccountJSON = (await import(`../../${process.env.NODE_ENV.toLowerCase()}-serviceaccount.json`)).default
const serviceAccount = structuredClone(serviceAccountJSON)

export default serviceAccount
