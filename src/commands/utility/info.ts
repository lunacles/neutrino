import {
  ChatInputCommandInteraction,
  CacheType,
  SlashCommandBuilder,
  EmbedBuilder,
  ColorResolvable,
} from 'discord.js'
import { version } from 'discord.js'
import {
  CommandInterface,
} from '../../types.js'
import global from '../../global.js'
import Colors from '../../canvas/palette.js'
import Log from '../../utilities/log.js'

const Info: CommandInterface = {
  name: 'info',
  description: 'Bot info.',
  data: new SlashCommandBuilder(),
  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    await interaction.deferReply()

    const embed = new EmbedBuilder()
      .setAuthor({
        name: 'Neurino',
        iconURL: interaction.client.user.displayAvatarURL(),
      })
      .setColor(Colors.darkBlue.hex as ColorResolvable)
      .setDescription(`**Bot Creator:** \`_damocles (<@342038795757027329>)\`
      **Uptime:** \`${Log.uptime}\`
      **Version:** \`${global.build.id} (${global.build.date})\`
      **Node Version:** \`${process.version}\`
      **Discord.js Version:** \`${version}\`
      **Memory Usage:** \`${Math.floor(process.memoryUsage().heapUsed / 1024 / 1024)}MB\`
      **Ping:** \`${interaction.client.ws.ping < 0 ? 'Unknown ' : interaction.client.ws.ping}ms\`
      **Repository:** [Github Link](<https://github.com/lunacles/neutrino>)`)

    interaction.editReply({
      embeds: [embed],
    })
  },
  test(): boolean {
    return true
  },
}

export default Info

