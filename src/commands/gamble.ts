import {
  ChatInputCommandInteraction,
  CacheType,
  SlashCommandBuilder,
  SlashCommandIntegerOption,
} from 'discord.js'
import CommandInterface from './interface.js'
import InteractionObserver from './interactionobserver.js'
import global from '../global.js'
import {
  Database
} from '../firebase/database.js'
import * as util from '../utilities/util.js'
import UserData from '../firebase/userdoc.js'

let chance: number = 0
let setChance = (set: number): number => chance += set

enum Chance {
  Lose25 = setChance(0.3),
  Lose50 = setChance(0.2),
  Lose100 = setChance(0.1),
  Win200 = setChance(0.25),
  Win300 = setChance(0.1),
  Win500 = setChance(0.05)
}

const Gamble: CommandInterface = {
  name: 'gamble',
  description: `Gamble some points! ${util.formatSeconds(global.cooldown.claim)} cooldown.`,
  data: new SlashCommandBuilder()
    .addIntegerOption((option: SlashCommandIntegerOption ): SlashCommandIntegerOption => option
    .setName('amount')
    .setDescription('The amount of points you want to gamble.')
    .setMinValue(250)
    .setRequired(true)
  ),
  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    await interaction.deferReply()
    const amount = interaction.options.getInteger('amount', true)
    const observer = new InteractionObserver(interaction)

    if (interaction.guild.id !== global.arrasDiscordId) return await observer.abort(3)

    let user = Database.users.get(interaction.user.id) ?? await UserData.new(interaction.user.id, interaction.guild)
    let data = user.data.scoregame.data
    let cooldown: number = Math.floor((Date.now() - data.cooldown.gamble) / 1e3)
    if (cooldown < global.cooldown.gamble) {
      interaction.editReply(`This command is on cooldown for **${util.formatSeconds(global.cooldown.gamble - cooldown, true)}!**`)
      return
    } else {
      if (amount > data.score) {
        interaction.editReply('You cannot gamble more points than what you currently have!')
      } else {
        let result: number
        let win: boolean
        let chance = Math.random()
        if (chance < Chance.Lose25) {
          // 30% chance to lose 25% of the amount
          result = amount * 0.75
          win = false
        } else if (chance < Chance.Lose50) {
          // 20% chance to lose 50% of the amount
          result = amount * 0.5
          win = false
        } else if (chance < Chance.Lose100) {
          // 10% chance to lose all of the amount
          result = 0
          win = false
        } else if (chance < Chance.Win200) {
          // 25% chance to multiply the amount by 2
          result = amount * 2
          win = true
        } else if (chance < Chance.Win300) {
          // 10% chance to multiply the amount by 3
          result = amount * 3
          win = true
        } else {
          // 5% chance to multiply the amount by 5
          result = amount * 5
          win = true
        }
        let netResult: number = Math.floor(result - amount)
        let resultMessage: string = win ?
          `You gambled **${amount.toLocaleString()}** points and won **${result.toLocaleString()}** more!` :
          `You gambled **${amount.toLocaleString()}** points and lost **${Math.floor(Math.abs(netResult)).toLocaleString()}**!`

        interaction.editReply(resultMessage)
        await user.misc.scoreGame.setScore(interaction.guild, Math.floor(data.score - amount + result))
      }

      await user.misc.scoreGame.setCooldown(interaction.guild, 'gamble', Date.now())
    }
  },
  test(): boolean {
    return true
  },
}

export default Gamble
