import {
  ChatInputCommandInteraction,
  CacheType,
  SlashCommandBuilder,
  EmbedBuilder,
  ColorResolvable,
  PermissionsBitField,
} from 'discord.js'
import { version } from 'discord.js'
import InteractionObserver from '../interactionobserver.js'
import config from '../../config.js'
import Colors from '../../canvas/palette.js'
import Log from '../../utilities/log.js'
import { Abort } from '../../types/enum.js'
const { version: packageVersion } = (await import('../../../package.json', {
  assert: { type: 'json' }
})).default

const Info: CommandInterface = {
  name: 'info',
  description: 'Bot info.',
  data: new SlashCommandBuilder().setDMPermission(false),
  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    const observer = await new InteractionObserver(interaction).defer()

    if (interaction.channel.id !== config.commandChannels.misc && !observer.checkPermissions([PermissionsBitField.Flags.ManageMessages], interaction.channel))
      return await observer.abort(Abort.CommandRestrictedChannel)

    const embed = new EmbedBuilder()
      .setAuthor({
        name: 'Neurino',
        iconURL: interaction.client.user.displayAvatarURL(),
      })
      .setColor(Colors.darkBlue.hex as ColorResolvable)
      .setDescription(`**Bot Creator:** \`_damocles\` (<@${config.ownerId}>)
      **Uptime:** \`${Log.uptime}\`
      **Version:** \`v${packageVersion}\`
      **Commit:** \`${config.build.id} (${config.build.date})\`
      **Node Version:** \`${process.version}\`
      **Discord.js Version:** \`${version}\`
      **Shard:** \`#${interaction.guild.shardId}\`
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

