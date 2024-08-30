import {
  ChatInputCommandInteraction,
  CacheType,
  SlashCommandBuilder,
  SlashCommandStringOption,
  SlashCommandUserOption,
  User,
  SlashCommandBooleanOption,
} from 'discord.js'
import InteractionObserver from '../interactionobserver.js'
import global from '../../global.js'
import Database from '../../db/database.js'
import { Abort } from '../../types/enum.js'

const FetchUserData: CommandInterface = {
  name: 'fetch',
  description: 'Fetches.',
  data: new SlashCommandBuilder()
    .addUserOption((option: SlashCommandUserOption ): SlashCommandUserOption => option
      .setName('user')
      .setDescription('The user to fetch.')
    ).addStringOption((option: SlashCommandStringOption): SlashCommandStringOption => option
      .setName('user-id')
      .setDescription('The user id to fetch.')
    ).addBooleanOption((option: SlashCommandBooleanOption): SlashCommandBooleanOption => option
      .setName('redact')
      .setDescription('Redact sensitive info. True by default.')
    ),
  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    const observer = await new InteractionObserver(interaction).defer()
    const targetUserOption: User = interaction.options.getUser('user', false)
    const targetUserId: string = interaction.options.getString('user-id', false)
    const redact: boolean = interaction.options.getBoolean('redact', false) ?? true

    if (interaction.user.id !== global.ownerId) return await observer.abort(Abort.InsufficientPermissions)
    let targetUser: string

    if (targetUserOption) {
      targetUser = targetUserOption.id
    } else if (targetUserId) {
      targetUser = targetUserId
    } else {
      return await observer.abort(Abort.TargetNotGiven)
    }

    let userData: string = JSON.stringify((await Database.discord.users.fetch(targetUser)).data, null, 2)
    if (redact)
      userData = userData.replace(/("prng":\s*\[\s*)(\d+,\s*)(\d+,\s*)(\d+,\s*)(\d+\s*)(\])/g, '$1REDACTED, REDACTED, REDACTED, REDACTED\n  $6')
    let dataChunks: Array<string> = []

    for (let i = 0; i < userData.length; i += 1900)
      dataChunks.push(userData.substring(i, i + 1900))

    await interaction.editReply(`Here is the data of user <@${targetUser}>\n\`\`\`json\n${dataChunks[0]}\n\`\`\``)

    for (let i = 1; i < dataChunks.length; i++)
      await interaction.followUp(`\`\`\`json\n${dataChunks[i]}\n\`\`\``)
  },
  test(): boolean {
    return true
  },
}

export default FetchUserData
