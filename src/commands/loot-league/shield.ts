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
  PermissionsBitField,
  User,
} from 'discord.js'
//import GuildCollection from '../../user-manager/guildcollection.js'
import InteractionObserver from '../interactionobserver.js'
import global from 'global.js'
import * as util from '../../utilities/util.js'
import Icon from '../../utilities/icon.js'
import Database from 'db/database.js'
import { Abort } from 'types/enum.d.js'

type Action = StringSelectMenuInteraction<CacheType> | UserSelectMenuInteraction<CacheType> | RoleSelectMenuInteraction<CacheType> | MentionableSelectMenuInteraction<CacheType> | ChannelSelectMenuInteraction<CacheType> | ButtonInteraction<CacheType>
type Component = InteractionCollector<CollectedInteraction<CacheType>>

const Shield: CommandInterface = {
  name: 'shield',
  description: `Shield yourself from thieves for ${util.formatSeconds(global.shieldDuration)}! ${util.formatSeconds(global.cooldown.shield)} cooldown.`,
  data: new SlashCommandBuilder(),
  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    const observer = await new InteractionObserver(interaction).defer()
    const user: User = await util.fetchUser(interaction.user.id)

    //if (interaction.guild.id !== global.testServerId) return await observer.abort(Abort.CommandUnavailableInServer)
    //if (interaction.channel.id !== global.commandChannels.lootLeague && !observer.checkPermissions([PermissionsBitField.Flags.ManageMessages], interaction.channel))
      //return await observer.abort(Abort.CommandRestrictedChannel)

    let userData: DatabaseInstanceInterface = await Database.discord.users.fetch(user.id)

    if (userData.shieldEnd > Date.now()) {
      await interaction.editReply(`You cannot create a shield while one is active!\nRemaining shield time: **${util.formatSeconds(Math.floor((userData.shieldEnd - Date.now()) / 1e3), true)}!**`)
      return
    } else if (observer.isOnCooldown('shield')) {
      await interaction.editReply(`This command is on cooldown for **${util.formatSeconds(observer.getCooldown('shield'), true)}!**`)
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
        .setColor(user.accentColor)
        .setAuthor({
          name: `${user.username}`,
          iconURL: user.avatarURL(),
        })
        .setThumbnail(`attachment://${Icon.HazardSign}`)
        .setDescription(`# Are you sure you want to activate a shield <@${user.id}> for ${util.formatSeconds(global.shieldDuration), true}?\nThis action will cost __20%__ of your total points!`)
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
          .setColor(user.accentColor)
          .setAuthor({
            name: `${user.username}`,
            iconURL: user.avatarURL(),
          })
          .setThumbnail(`attachment://${Icon.TemporaryShield}`)
          .setDescription(`# <@${user.id}> has activated a shield for ${util.formatSeconds(global.shieldDuration)}s!`)
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

          await userData.setScore(Math.floor(userData.score * 0.8))
          await userData.setShield(Date.now() + global.shieldDuration * 1e3)
          observer.resetCooldown('shield')

        } else if (action.customId === 'cancelShield') {
          await action.update({
            content: 'Shield activation canceled.',
            components: []
          })
        }
      })
      observer.resetCooldown('shield')

      collector.on('end', async (collected: Collection<string, CollectedInteraction<CacheType>>): Promise<void> => {
        if (collected.size === 0) {
          await interaction.editReply({
            content: 'No response received, shield activation timed out.',
            components: []
          })
        }
      })
    }
  },
  test(): boolean {
    return true
  },
}

export default Shield
