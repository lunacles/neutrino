import {
  ChatInputCommandInteraction,
  CacheType,
  SlashCommandBuilder,
} from 'discord.js'
import CommandInterface from './interface.js'
import InteractionObserver from './interactionobserver.js'
import global from '../global.js'
import {
  Database
} from '../firebase/database.js'
import * as util from '../utilities/util.js'
import UserData from '../firebase/userdoc.js'

const Claim: CommandInterface = {
  name: 'claim',
  description: `Claim some points! ${util.formatSeconds(global.cooldown.claim)} cooldown.`,
  data: new SlashCommandBuilder(),
  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    await interaction.deferReply()
    const observer = new InteractionObserver(interaction)

    if (interaction.guild.id !== global.arrasDiscordId) return await observer.abort(3)

    let user = Database.users.get(interaction.user.id) ?? await UserData.new(interaction.user.id, interaction.guild)
    let data = user.data.scoregame.data
    let cooldown: number = Math.floor((Date.now() - data.cooldown.claim) / 1e3)
    if (cooldown < global.cooldown.claim) {
      interaction.editReply(`This command is on cooldown for **${util.formatSeconds(global.cooldown.claim - cooldown, true)}!**`)
      return
    } else {
      // Get a random score between 10 and 100
      let claimedScore: number = Math.floor(Math.random() * (100 - 10) + 10)

      await user.misc.scoreGame.setScore(interaction.guild, data.score + claimedScore)
      interaction.editReply(`You have claimed **${claimedScore.toLocaleString()} points!**`)
      await user.misc.scoreGame.setCooldown(interaction.guild, 'claim', Date.now())
    }
  },
  test(): boolean {
    return true
  },
}

export default Claim
