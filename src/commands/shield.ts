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
} from 'discord.js'
import CommandInterface from './interface.js'
import InteractionObserver from './interactionobserver.js'
import global from '../global.js'
import {
  Database
} from '../firebase/database.js'
import * as util from '../utilities/util.js'
import UserData from '../firebase/userdoc.js'
import Icon from '../utilities/icon.js'

type Action = StringSelectMenuInteraction<CacheType> | UserSelectMenuInteraction<CacheType> | RoleSelectMenuInteraction<CacheType> | MentionableSelectMenuInteraction<CacheType> | ChannelSelectMenuInteraction<CacheType> | ButtonInteraction<CacheType>
type Component = InteractionCollector<CollectedInteraction<CacheType>>

const Shield: CommandInterface = {
  name: 'shield',
  description: `Shield yourself from thieves for ${util.formatSeconds(global.shieldDuration)}! ${util.formatSeconds(global.cooldown.shield)} cooldown.`,
  data: new SlashCommandBuilder(),
  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    await interaction.deferReply()
    const observer = new InteractionObserver(interaction)
    if (interaction.guild.id !== global.arrasDiscordId) return await observer.abort(3)

    let user = Database.users.get(interaction.user.id) ?? await UserData.new(interaction.user.id, interaction.guild)
    let data = user.data.scoregame.data
    let cooldown: number = Math.floor((Date.now() - data.cooldown.shield) / 1e3)
    if (data.shieldEnd > Date.now()) {
      interaction.editReply(`You cannot create a shield while one is active!\nRemaining shield time: **${util.formatSeconds(Math.floor((data.shieldEnd - Date.now()) / 1e3), true)}!**`)
      return
    } else if (cooldown < global.cooldown.shield) {
      interaction.editReply(`This command is on cooldown for **${util.formatSeconds(global.cooldown.shield - cooldown, true)}!**`)
      return
    } else {
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
        .setColor(user.author.hexAccentColor)
        .setAuthor({
          name: `${user.author.username}`,
          iconURL: user.author.avatarURL(),
        })
        .setThumbnail(`attachment://${Icon.HazardSign}`)
        .setDescription(`# Are you sure you want to activate a shield <@${interaction.user.id}> for ${util.formatSeconds(global.shieldDuration), true}?\nThis action will cost __20%__ of your total points!`)
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
        let expireTime: number = Math.floor(Date.now() / 1e3 + global.shieldDuration)
        const confirmatedEmbed = new EmbedBuilder()
          .setColor(user.author.hexAccentColor)
          .setAuthor({
            name: `${user.author.username}`,
            iconURL: user.author.avatarURL(),
          })
          .setThumbnail(`attachment://${Icon.TemporaryShield}`)
          .setDescription(`# <@${interaction.user.id}> has activated a shield for ${util.formatSeconds(global.shieldDuration)}s!`)
          .addFields({
            name: 'Expires At',
            value: `<t:${expireTime}> (<t:${expireTime}:R>)`,
          })

        if (action.customId === 'confirmShield') {
          await action.update({
            embeds: [confirmatedEmbed],
            files: [{
              attachment: `./src/utilities/assets/${Icon.TemporaryShield}`,
              name: Icon.TemporaryShield,
            }],
            components: []
          })

          await user.misc.scoreGame.setScore(interaction.guild, data.score * 0.8)
          await user.misc.scoreGame.setCooldown(interaction.guild, 'shield', Date.now())
          await user.misc.scoreGame.setShield(interaction.guild, Date.now() + global.shieldDuration * 1e3)
        } else if (action.customId === 'cancelShield') {
          await action.update({
            content: 'Shield activation canceled.',
            components: []
          })
        }
      })
      await user.misc.scoreGame.setCooldown(interaction.guild, 'shield', Date.now())

      collector.on('end', (collected: Collection<string, CollectedInteraction<CacheType>>) => {
        if (collected.size === 0)
          interaction.editReply({
          content: 'No response received, shield activation timed out.',
          components: []
        })
      })
    }
  },
  test(): boolean {
    return true
  },
}

export default Shield
