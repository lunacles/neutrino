import {
  ChatInputCommandInteraction,
  CacheType,
  SlashCommandBuilder,
  ChannelType,
  GuildBasedChannel,
  Collection,
  TextChannel,
  Message,
  EmbedBuilder,
  MessageType,
  Snowflake,
  Attachment,
  User,
  APIEmbedField,
} from 'discord.js'
import CommandInterface from './default.js'
import Log from '../utilities/log.js'
import Icon from '../utilities/icon.js'

const PinArchive: CommandInterface = {
  name: 'archivepins',
  description: 'Archives pinned messages of a specified channel!',
  data: new SlashCommandBuilder()
    .addChannelOption(option =>
      option
      .setName('target')
      .setDescription('The channel to archive pinned messages from.')
      .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    const targetChannel: TextChannel = interaction.options.getChannel('target')

    let archive: GuildBasedChannel = interaction.guild.channels.cache.find(channel =>
      channel.type === ChannelType.GuildCategory && channel.name.toLowerCase() === `#${targetChannel.name} pin archive`
    )

    if (archive == undefined) {
      try {
        archive = await interaction.guild.channels.create({
          name: `#${targetChannel.name} Pin Archive`,
          type: ChannelType.GuildCategory
        })
      } catch (err) {
        Log.error('Failed to create pin archive category', err)
      }
    }
    let children: Collection<string, GuildBasedChannel> = interaction.guild.channels.cache.filter(channel => channel.parentId === archive.id)

    let highestMin: number = 0
    for (let [_, child] of children) {
      let min: number = parseInt(child.name.split('-')[1])
      if (min > highestMin)
        highestMin = min
    }

    let pinnedMessages: Collection<string, Message<true>> = await targetChannel.messages.fetchPinned()

    let archiveChannel: GuildBasedChannel = await interaction.guild.channels.create({
      name: `${highestMin + 1}-${highestMin + pinnedMessages.size}`,
      type: ChannelType.GuildText,
      parent: archive.id,
    })

    let pins: Array<Message> = pinnedMessages.map(message => message).reverse()
    for (let [i, msg] of pins.entries()) {
      let author: User = await interaction.client.users.fetch(msg.author.id, {
        force: true
      })
      let attachments: Collection<Snowflake, Attachment> = msg.attachments

      const pinnedMessage = new EmbedBuilder()
        .setColor(author.hexAccentColor)
        .setAuthor({
          name: `Pin #${highestMin + i + 1}`,
          iconURL: Icon.PinMessage,
        })
        .setURL(msg.url)
        .setThumbnail(author.avatarURL())
        .setFooter({
          text: 'Message created'
        })
        .setTimestamp(msg.createdTimestamp)

      if (msg.content.length > 0) {
        pinnedMessage.setDescription(`<@${msg.author.id}>\n>>> ${msg.content.slice(0, 2000)}`)
      }

      if (msg.type === MessageType.Reply) {
        let repliedMsg = await msg.fetchReference()
        pinnedMessage.addFields({
          name: `Replied to`,
          value: `<@${repliedMsg.author.id}>\n>>> [${repliedMsg.cleanContent.slice(0, 2000)}](${repliedMsg.url})`,
        })
      }

      if (attachments.size > 0) {
        pinnedMessage.addFields({
          name: `${attachments.size + 1} Attachment(s)`,
          value: ' ',
        })

        let fields: Array<APIEmbedField> = []
        let map: Array<Attachment> = attachments.map(message => message)
        let groups: Array<Array<Attachment>> = []
        for (let i: number = 0; i < map.length; i += 3)
          groups.push(map.slice(i, i + 3))

        for (let group of groups) {
          let value: string = `>>> `
          for (let attachment of group)
            value += `[${attachment.name}](${attachment.url})\n`

          fields.push({
            name: ' ',
            value,
          })
        }
        pinnedMessage.addFields(...fields)
      }

      let embeds = [pinnedMessage]
      for (let attachment of attachments.values()) {
        embeds.push(new EmbedBuilder().setURL('https://ganyu.io/').setImage(attachment.url))
      }

      await archiveChannel.send({
        embeds,
      })
    }
  },
  test(): boolean {
    return true
  },
}

export default PinArchive
