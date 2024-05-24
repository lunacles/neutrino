import {
  ChatInputCommandInteraction,
  CacheType,
  SlashCommandBuilder,
  SlashCommandStringOption,
  SlashCommandUserOption,
  User,
} from 'discord.js'
import {
  CommandInterface,
  GuildCollectionInterface,
} from '../../types.d.js'
import InteractionObserver from '../interactionobserver.js'
import global from '../../utilities/global.js'
import GuildCollection from '../../user-manager/guildcollection.js'

const FetchUserData: CommandInterface = {
  name: 'fetch',
  description: 'Fetches.',
  data: new SlashCommandBuilder()
    .addUserOption((option: SlashCommandUserOption ): SlashCommandUserOption => option
      .setName('user')
      .setDescription('The user to fetch.')
    )
    .addStringOption((option: SlashCommandStringOption): SlashCommandStringOption => option
      .setName('user-id')
      .setDescription('The user id to fetch.')
    ),
  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    await interaction.deferReply()
    const targetUserOption = interaction.options.getUser('user', false)
    const targetUserId = interaction.options.getString('user-id', false)
    const observer = new InteractionObserver(interaction)

    if (interaction.user.id !== global.ownerId) return await observer.abort(0)
    let targetUser: string

    if (targetUserOption instanceof User) {
      targetUser = targetUserOption.id
    } else if (targetUserId) {
      targetUser = targetUserId
    }
    let guild: GuildCollectionInterface = await GuildCollection.fetch(interaction.guildId)
    let userData: string = JSON.stringify((await guild.fetchMember(targetUser)).data, null, 2)
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
