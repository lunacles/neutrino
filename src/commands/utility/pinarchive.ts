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
  DiscordAPIError,
  SlashCommandChannelOption,
  PermissionsBitField,
} from 'discord.js'
import Log from '../../utilities/log.js'
import Icon from '../../utilities/icon.js'
import InteractionObserver from '../interactionobserver.js'
import DeletedUsers from '../../utilities/deletedusers.js'
import { Abort } from '../../types/enum.js'

const PinArchive: CommandInterface = {
  name: 'archive-pins',
  description: 'Archives pinned messages of a specified channel.',
  data: new SlashCommandBuilder()
    .addChannelOption((option: SlashCommandChannelOption): SlashCommandChannelOption => option
      .setName('target')
      .setDescription('The channel to archive pinned messages from.')
      .setRequired(true)
    ),
  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    const observer = await new InteractionObserver(interaction).defer()
    const targetChannel: TextChannel = interaction.options.getChannel('target')

    if (!observer.checkPermissions([PermissionsBitField.Flags.ManageMessages], targetChannel)) return await observer.abort(Abort.InsufficientPermissions)

    let archive: GuildBasedChannel = observer
      .filterChannels()
      .byChannelType(ChannelType.GuildCategory)
      .byExactName(`#${targetChannel.name} pin archive`)
      .finishFilter()
      .first()

    if (archive == null) {
      try {
        archive = await interaction.guild.channels.create({
          name: `#${targetChannel.name} Pin Archive`,
          type: ChannelType.GuildCategory,
        })
      } catch (err) {
        Log.error('Failed to create pin archive category', err)
      }
    }
    let children: Collection<string, GuildBasedChannel> = observer
      .filterChannels()
      .byParentId(archive.id)
      .finishFilter()

    let highestMin: number = 0
    for (let [_, child] of children) {
      let min: number = parseInt(child.name.split('-')[1])
      if (min > highestMin)
        highestMin = min
    }

    const pinnedMessages: Collection<string, Message<true>> = await targetChannel.messages.fetchPinned()
    const archiveChannel: GuildBasedChannel = await interaction.guild.channels.create({
      name: `${highestMin + 1}-${highestMin + pinnedMessages.size}`,
      type: ChannelType.GuildText,
      parent: archive.id,
    })
    await interaction.editReply(`Archiving ${pinnedMessages.size} pin(s) from <#${targetChannel.id}>...`)

    let pins: Array<Message> = pinnedMessages.map(message => message).reverse()
    for (let [i, msg] of pins.entries()) {
      let author: User = await interaction.client.users.fetch(DeletedUsers.fixId(msg.author.id), {
        force: true,
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
          text: 'Message created',
        })
        .setTimestamp(msg.createdTimestamp)

      pinnedMessage.addFields({
        name: 'Author',
        value: `<@${DeletedUsers.fixId(msg.author.id)}>`,
        inline: true,
      }, {
        name: 'Message URL',
        value: msg.url,
        inline: true,
      }, {
        name: 'Content',
        value: msg.content.length > 0 ? `>>> ${msg.cleanContent.slice(0, 1024 - 4)}` : '*None*',
      })

      if (msg.type === MessageType.Reply) {
        let repliedMsg = await msg.fetchReference()
        pinnedMessage.addFields({
          name: `Replied to`,
          value: `<@${repliedMsg.author.id}>`,
          inline: true,
        }, {
          name: 'Reply URL',
          value: repliedMsg.url,
          inline: true,
        }, {
          name: 'Content',
          value: repliedMsg.content.length > 0 ? `>>> ${repliedMsg.cleanContent.slice(0, 1024 - 4)}` : '*None*',
        })
      }

      let splitArray = (array: Array<any>, groupSize: number): Array<Array<any>> => {
        let groups: Array<any> = []
        for (let i: number = 0; i < array.length; i += groupSize)
          groups.push(array.slice(i, i + groupSize))

        return groups
      }

      let map: Array<any> = attachments.map(message => message)

      if (attachments.size > 0) {
        pinnedMessage.addFields({
          name: `${attachments.size} Attachment${attachments.size === 1 ? '' : 's'}`,
          value: ' ',
        })

        let fields: Array<APIEmbedField> = []
        let groups: Array<Array<Attachment>> = splitArray(map, 3)
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

      if (i > 0)
        await archiveChannel.send('``` ```')

      let linkedAttachments = msg.cleanContent.match(/https?:\/\/\S+\.(?:png|mp4|webm|mov|mp3|gif|jpg|jpeg|pdf|docx|xlsx)/ig) ?? []
      if (linkedAttachments.length > 0)
        await archiveChannel.send(linkedAttachments.join(' '))

      try {
        await archiveChannel.send({
          embeds: [pinnedMessage],
          files: map,
        })
      } catch (err) {
        // If the attached file(s) is too big do a bandaid fix
        if (err instanceof DiscordAPIError && err.code === 40005) {
          for (let attachment of map)
            await archiveChannel.send(attachment.url)

        } else {
          throw err
        }
      }
    }
  },
  test(): boolean {
    return true
  },
}

export default PinArchive
