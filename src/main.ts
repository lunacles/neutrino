import { ShardingManager, Shard } from 'discord.js'
import config from './config.js'
import path from 'path'
import { fileURLToPath } from 'url'
import Log from './utilities/log.js'

const manager = new ShardingManager(path.join(path.dirname(fileURLToPath(import.meta.url)), 'index.ts'), {
  execArgv: ['--no-warnings=ExperimentalWarning', '--loader', 'ts-node/esm', '--enable-source-maps'],
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

export default manager
