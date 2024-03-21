import Observer from '../interface.js'

import MessageCreate from './messageCreate.js'
import MessageDelete from './messageDelete.js'
import MessageUpdate from './messageUpdate.js'

interface MessageObserver {
  create: Observer,
  delete: Observer,
  update: Observer,
}

const MessageObserver: MessageObserver = {
  create: MessageCreate,
  delete: MessageDelete,
  update: MessageUpdate,
}
