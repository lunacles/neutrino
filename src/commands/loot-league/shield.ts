import {
  ChatInputCommandInteraction,
  CacheType,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  Collection,

  InteractionCollector,
  ButtonInteraction,
  StringSelectMenuInteraction,
  UserSelectMenuInteraction,
  RoleSelectMenuInteraction,
  MentionableSelectMenuInteraction,
  ChannelSelectMenuInteraction,
  CollectedInteraction,
  User,
} from 'discord.js'
//import GuildCollection from '../../user-manager/guildcollection.js'
import InteractionObserver from '../interactionobserver.js'
import config from '../../config.js'
import * as util from '../../utilities/util.js'
import Icon from '../../utilities/icon.js'
import bot from '../../index.js'

type Action = StringSelectMenuInteraction<CacheType> | UserSelectMenuInteraction<CacheType> | RoleSelectMenuInteraction<CacheType> | MentionableSelectMenuInteraction<CacheType> | ChannelSelectMenuInteraction<CacheType> | ButtonInteraction<CacheType>
type Component = InteractionCollector<CollectedInteraction<CacheType>>

const Shield: CommandInterface = {
  name: 'shield',
  description: `Shield yourself from thieves for ${util.formatSeconds(config.shieldDuration)}! ${util.formatSeconds(config.cooldown.shield)} cooldown.`,
  data: new SlashCommandBuilder().setDMPermission(false),
  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    const observer = new InteractionObserver(interaction)
    const user: User = await bot.fetchUser(interaction.user.id)

    if (observer.isOnCooldown('shield')) {
      await observer.killInteraction(`This command is on cooldown for **${util.formatSeconds(observer.getCooldown('shield'), true)}!**`)
      return
    }

    await observer.defer()
    const userData = await observer.getGuildUserData()

    if (userData.shieldEnd > Date.now()) {
      let remainingTime: string = util.formatSeconds(Math.floor((userData.shieldEnd - Date.now()) / 1e3), true)
      await observer.killInteraction(`You cannot create a shield while one is active!\nRemaining shield time: **${remainingTime}!**`)
      return
    }

    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('confirmShield')
          .setLabel('Confirm')
          .setStyle(ButtonStyle.Success), // Use Success style for confirm
        new ButtonBuilder()
          .setCustomId('cancelShield')
          .setLabel('Cancel')
          .setStyle(ButtonStyle.Danger) // Use Danger style for cancel
      )

    const confirmationEmbed = new EmbedBuilder()
      .setColor(user.accentColor)
      .setAuthor({
        name: `${user.username}`,
        iconURL: user.avatarURL(),
      })
      .setThumbnail(`attachment://${Icon.HazardSign}`)
      .setDescription(`# Are you sure you want to activate a shield <@${user.id}> for ${util.formatSeconds(config.shieldDuration), true}?\nThis action will cost __20%__ of your total points!`)
      .addFields({
        name: 'WARNING!',
        value: 'If you activate a shield, you forfeit your ability to gamble and steal!',
      })

    await interaction.editReply({
      embeds: [confirmationEmbed],
      files: [{
        attachment: `./src/utilities/assets/${Icon.HazardSign}`,
        name: Icon.HazardSign,
      }],
      components: [row],
    })

    const collector: Component = interaction.channel.createMessageComponentCollector({
      filter: observer.componentsFilter(['confirmShield', 'cancelShield']),
      time: 15e3,
    })

    collector.on('collect', async (action: Action): Promise<void> => {
      if (action.customId === 'confirmShield') {
        let expireTime: number = Math.floor(Date.now() / 1e3 + config.shieldDuration)
        const confirmatedEmbed = new EmbedBuilder()
          .setColor(user.accentColor)
          .setAuthor({
            name: `${user.username}`,
            iconURL: user.avatarURL(),
          })
          .setThumbnail(`attachment://${Icon.TemporaryShield}`)
          .setDescription(`# <@${user.id}> has activated a shield for ${util.formatSeconds(config.shieldDuration)}s!`)
          .addFields({
            name: 'Expires At',
            value: `<t:${expireTime}> (<t:${expireTime}:R>)`,
          })

        await action.update({
          embeds: [confirmatedEmbed],
          files: [{
            attachment: `./src/utilities/assets/${Icon.TemporaryShield}`,
            name: Icon.TemporaryShield,
          }],
          components: []
        })

        await userData.setScore(Math.floor(userData.score * 0.8))
        await userData.setShield(Date.now() + config.shieldDuration * 1e3)
        collector.stop('ඞ')
      } else if (action.customId === 'cancelShield') {
        await action.update({
          content: 'Shield activation canceled.',
          components: []
        })
        collector.stop('ඞ')
      }
    })

    collector.on('end', async (_: Collection<string, CollectedInteraction<CacheType>>, reason: string): Promise<void> => {
      if (reason !== 'ඞ')
        await observer.killInteraction('No response received, shield activation timed out.')

      observer.resetCooldown('shield')
    })
  },
  test(): boolean {
    return true
  },
}

export default Shield
