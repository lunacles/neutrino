import {
  ChatInputCommandInteraction,
  CacheType,
  SlashCommandBuilder,
  EmbedBuilder,
  ColorResolvable,
  SlashCommandUserOption,
  SlashCommandBooleanOption,
  User,
  SlashCommandIntegerOption,
  AttachmentBuilder,
  ALLOWED_SIZES,
  ImageURLOptions,
} from 'discord.js'
import Colors from '../../canvas/palette.js'
import fetch, { Response } from 'node-fetch'

type ImageSize = (typeof ALLOWED_SIZES)[number]
interface Choice {
  name: string,
  value: ImageSize
}

const Avatar: CommandInterface = {
  name: 'avatar',
  description: 'Retrieve the profile picture of a given user.',
  data: new SlashCommandBuilder()
    .addUserOption((option: SlashCommandUserOption): SlashCommandUserOption => option
    .setName('user')
    .setDescription('User to get the avatar of. If left empty it retrieves your profile picture.')
  ).addBooleanOption((option: SlashCommandBooleanOption): SlashCommandBooleanOption => option
    .setName('guild-avatar')
    .setDescription('Retrieve the guild avatar instead of the global avatar. Default is false.')
  ).addIntegerOption((option: SlashCommandIntegerOption): SlashCommandIntegerOption => option
    .setName('size')
    .setDescription('The size of the profile picture.')
    .addChoices(...Array(9).fill(0).map((_, i: number): Choice => {
      let value = 2 ** (i + 4)
      return {
        name: value.toString(),
        value: value as ImageSize,
      }
    }))
  ).setDMPermission(false),
  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    await interaction.deferReply()

    const user: User = interaction.options.getUser('user') ?? interaction.user
    const guildAvatar: boolean = interaction.options.getBoolean('guild-avatar') ?? false
    const size: number = interaction.options.getInteger('size') ?? 512

    let options: ImageURLOptions = { size: size as ImageSize, extension: 'png' }
    let hyperlink: Pair<string> = [`${guildAvatar ? 'Global' : 'Guild'} Avatar URL`, guildAvatar ? user.displayAvatarURL(options) : user.avatarURL(options)]
    let buffer: Buffer
    try {
      let response: Response = await fetch(hyperlink[1])
      if (!response.ok) throw new Error(`Failed to fetch file: ${response.statusText}`)
      if (!response.body) throw new Error('Response body is null')

      let arrayBuffer: ArrayBuffer = await response.arrayBuffer()
      buffer = Buffer.from(arrayBuffer)
    } catch (err) {
      console.error('Fetch failed:', err)
      throw err
    }

    let attachment = new AttachmentBuilder(buffer, {
      name: `${user.displayName}${guildAvatar ? `-${interaction.guild.name}` : ''}.png`
    })

    const embed = new EmbedBuilder()
      .setAuthor({
        name: `${user.globalName} (${user.username})`,
      })
      .setColor(Colors.darkBlue.hex as ColorResolvable)
      .setDescription(`[${hyperlink.shift()}](${hyperlink.shift()})`)

    interaction.editReply({
      embeds: [embed],
      files: [attachment],
    })
  },
  test(): boolean {
    return true
  },
}

export default Avatar
