import MemberAdd from './guild/memberAdd.js'
import MemberRemove from './guild/memberRemove.js'
import MessageCreate from './message/messageCreate.js'

const EventObservers: EventObserversInterface = {
  create: MessageCreate,
  add: MemberAdd,
  remove: MemberRemove,
}

export default EventObservers
