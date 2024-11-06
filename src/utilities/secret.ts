import crypto from 'crypto'
import {
  AeadId,
  CipherSuite,
  KdfId,
  KemId,
  SenderContext
} from 'hpke-js'
import path from 'path'
import { fileURLToPath } from 'url'

const Secret: SecretInterface = {
  stackSecret: process.env.STACK_SECRET,
  privateSecret: process.env.PRIVATE_SECRET,

  key: crypto.createHash('sha256').update(process.env.STACK_SECRET || '').digest(),
  // 53-bit string hash - https://github.com/bryc/code/blob/master/jshash/experimental/cyrb53.js
  cyrb53(str: string = '', seed: number = 0): number {
    let h1 = 0xdeadbeef ^ seed
    let h2 = 0x41c6ce57 ^ seed
    let ch: number
    for (let i = 0; i < str.length; i++) {
      ch = str.charCodeAt(i)
      h1 = Math.imul(h1 ^ ch, 0x85ebca77)
      h2 = Math.imul(h2 ^ ch, 0xc2b2ae3d)
    }
    h1 ^= Math.imul(h1 ^ (h2 >>> 15), 0x735a2d97)
    h2 ^= Math.imul(h2 ^ (h1 >>> 15), 0xcaf649a9)
    h1 ^= h2 >>> 16
    h2 ^= h1 >>> 16
    return 2097152 * (h2 >>> 0) + (h1 >>> 11)
  },
  hash(str: string): string {
    let hmac = crypto.createHmac('sha256', this.stackSecret)
    hmac.update(str)
    return hmac.digest('hex')
  },
  encrypt(str: string): string {
    let iv: Buffer = crypto.randomBytes(16)
    let cipher = crypto.createCipheriv('aes-256-cbc', this.key, iv)
    let encrypted = cipher.update(str, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    return `${iv.toString('hex')}:${encrypted}`
  },
  decrypt(str: string): string {
    let [ivHex, encrypted] = str.split(':')
    let iv = Buffer.from(ivHex, 'hex')
    let decipher = crypto.createDecipheriv('aes-256-cbc', this.key, iv)
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  },
  id(hash: string, prefix?: string): string {
    return `${prefix ? `${prefix}-` : ''}${Secret.hash(hash).slice(0, 8)}`
  },
}

const KeyManager = class implements KeyManagerInterface {
  public static path: string = path.join(path.dirname(fileURLToPath(import.meta.url)), '../photon/keys/')
  public static async get(id: string): Promise<KeyManagerInterface> {
    const suite = new CipherSuite({
      kem: KemId.DhkemX25519HkdfSha256,
      kdf: KdfId.HkdfSha256,
      aead: AeadId.Chacha20Poly1305,
    })
    let key = new TextEncoder().encode(`${Secret.privateSecret}::${id}`)
    const derivedKeyPair = await suite.kem.deriveKeyPair(key)

    return new KeyManager(suite, id, derivedKeyPair)
  }

  public readonly suite: CipherSuite
  public readonly id: string
  public private: CryptoKey
  public public: CryptoKey
  private sender: SenderContext
  constructor(suite: CipherSuite, id: string, keyPair?: CryptoKeyPair) {
    this.suite = suite
    this.id = id

    this.private = keyPair.privateKey
    this.public = keyPair.publicKey
  }
  public async encrypt(message: string): Promise<ArrayBuffer> {
    this.sender = await this.suite.createSenderContext({
      recipientPublicKey: this.public,
    })
    return await this.sender.seal(new TextEncoder().encode(message))
  }
  public async decrypt(ct: ArrayBuffer): Promise<void> {
    const recipient = await this.suite.createRecipientContext({
      recipientKey: this.private,
      enc: this.sender.enc,
    });
    const pt = await recipient.open(ct);
    console.log("decrypted: ", new TextDecoder().decode(pt));
  }
}

export default { Secret, KeyManager }
