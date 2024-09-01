import {
  ChatInputCommandInteraction,
  CacheType,
  SlashCommandBuilder,
  SlashCommandIntegerOption,
  EmbedBuilder,
  PermissionsBitField,
  User,
} from 'discord.js'
import InteractionObserver from '../interactionobserver.js'
import * as util from '../../utilities/util.js'
import Icon from '../../utilities/icon.js'
import Database from '../../db/database.js'
import config from '../../config.js'
import bot from '../../index.js'

let chance: number = 0
let setChance = (set: number): number => chance += set

enum Chance {
  Lose25 = setChance(0.22),
  Lose50 = setChance(0.40),
  Lose100 = setChance(0.08),
  Win200 = setChance(0.17),
  Win300 = setChance(0.10),
  Win500 = setChance(0.03)
}

const Gamble: CommandInterface = {
  name: 'gamble',
  description: `Gamble some points! ${util.formatSeconds(config.cooldown.gamble)} cooldown.`,
  data: new SlashCommandBuilder()
    .addIntegerOption((option: SlashCommandIntegerOption ): SlashCommandIntegerOption => option
    .setName('amount')
    .setDescription('The amount of points you want to gamble.')
    .setMinValue(250)
    .setRequired(true)
  ),
  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    const observer = await new InteractionObserver(interaction).defer()
    const amount = interaction.options.getInteger('amount', true)
    const user: User = await util.fetchUser(interaction.user.id)

    //if (interaction.guild.id !== global.testServerId) return await observer.abort(Abort.server423)
    //if (interaction.channel.id !== global.commandChannels.lootLeague && !observer.checkPermissions([PermissionsBitField.Flags.ManageMessages], interaction.channel))
      //return await observer.abort(Abort.CommandRestrictedChannel)

    let userData: DatabaseInstanceInterface = await Database.discord.users.fetch(user)

    if (userData.shieldEnd > Date.now()) {
      interaction.editReply('You cannot gamble while you have a shield active!')
      return
    } else if (observer.isOnCooldown('gamble')) {
      await interaction.editReply(`This command is on cooldown for **${util.formatSeconds(observer.getCooldown('gamble'), true)}!**`)
      return
    } else {
      if (amount > userData.score) {
        await interaction.editReply('You cannot gamble more points than what you currently have!')
      } else {
        let result: number
        let win: boolean
        let chance = await userData.random()//crypto.getRandomValues(new Uint32Array(1))[0] / 0x100000000
        let icon: string
        if (chance < Chance.Lose25) {
          // 30% chance to lose 25% of the amount
          result = amount * 0.75
          win = false
          icon = Icon.DiceFive
        } else if (chance < Chance.Lose50) {
          // 20% chance to lose 50% of the amount
          result = amount * 0.5
          win = false
          icon = Icon.DiceThree
        } else if (chance < Chance.Lose100) {
          // 10% chance to lose all of the amount
          result = 0
          win = false
          icon = Icon.DiceOne
        } else if (chance < Chance.Win200) {
          // 25% chance to multiply the amount by 2
          result = amount * 2
          win = true
          icon = Icon.DiceTwo
        } else if (chance < Chance.Win300) {
          // 10% chance to multiply the amount by 3
          result = amount * 3
          win = true
          icon = Icon.DiceFour
        } else {
          // 5% chance to multiply the amount by 5
          result = amount * 5
          win = true
          icon = Icon.DiceSix
        }
        let netResult: number = Math.floor(result - amount)
        let resultMessage: string = win ?
          `won **${result.toLocaleString()}**!` :
          `lost **${Math.floor(Math.abs(netResult)).toLocaleString()}**!`
        let roll: string = icon.match(/dice-(\w+)\.png/)[1]

        userData.setScore(Math.floor(userData.score - amount + result))

        const embed = new EmbedBuilder()
          .setColor(user.accentColor)
          .setAuthor({
            name: `${user.username}`,
            iconURL: user.avatarURL(),
          })
          .setThumbnail(`attachment://${icon}`)
          .setDescription(`# You rolled a ${roll} and ${resultMessage}!`)
          .addFields({
            name: 'Amount Wager',
            value: amount.toLocaleString(),
            inline: true,
          }, {
            name: `${win ? 'Won' : 'Lost'}`,
            value: Math.floor(Math.abs(netResult)).toLocaleString(),
            inline: true,
          }, {
            name: 'New Total Points',
            value: Math.floor(userData.score).toLocaleString(),
          })

        await interaction.editReply({
          embeds: [embed],
          files: [{
            attachment: `./src/utilities/assets/${icon}`,
            name: icon,
          }]
        })
      }

      observer.resetCooldown('gamble')
    }
  },
  test(): boolean {
    return true
  },
}

export default Gamble
