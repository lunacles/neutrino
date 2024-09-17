import { ShardingManager, Shard, /*Status, Client*/ } from 'discord.js'
import config from './config.js'
import path from 'path'
import { fileURLToPath } from 'url'
import Log from './utilities/log.js'

const manager = new ShardingManager(path.join(path.dirname(fileURLToPath(import.meta.url)), 'index.ts'), {
  execArgv: ['--loader', 'ts-node/esm', '--enable-source-maps'],
  totalShards: 'auto',
  mode: 'process',
  respawn: true,
  token: config.env.BOT_TOKEN,
})

enum SocketMessage {
  Request = 'request',
  Heartbeat = 'heartbeat',
}

manager.on('shardCreate', async (shard: Shard): Promise<void> => {
  shard.on('message', async (msg: {
    content: unknown
    type: Keys<SocketMessage>
  }) => {
    switch (msg.type) {
      case SocketMessage.Heartbeat: {
        await shard.send({
          content: 'Heartbeat response',
          type: SocketMessage.Heartbeat,
        })
        console.log('shard heartbeat')
      } break
    }
  })
  Log.info(`Shard with id "${shard.id}" initialized`)
})

await manager.spawn({
  amount: 'auto',
})
/*
setInterval(async () => {
  let responses: Array<Status> = await manager.broadcastEval((client: Client<boolean>): Status => client.ws.ping)
  let statuses = {
    ready: 0,
    connecting: 0,
    reconnecting: 0,
    idle: 0,
    nearly: 0,
    disconnected: 0,
    waiting: 0,
    identifying: 0,
    resuming: 0,
  }
  for (let response of responses)
    statuses[response]++

  console.log('shard heartbeat req', statuses)
}, config.heartbeatInterval)
*/
export default manager
