import {
  MessageObserverInterface
} from '../types.d.js'
import MessageCreate from './message/messageCreate.js'

export const MessageObserver: MessageObserverInterface = {
  create: MessageCreate,
}
