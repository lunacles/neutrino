import Observer from '../interface.js'

import MessageCreate from './messageCreate.js'

interface MessageObserver {
  create: Observer
}

const MessageObserver: MessageObserver = {
  create: MessageCreate,
}
