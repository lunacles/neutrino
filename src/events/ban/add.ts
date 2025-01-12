import {
  //EmbedBuilder,
  Events,
  GuildBan,
  //GuildBasedChannel,
} from 'discord.js'

export default {
  id: Events.GuildBanAdd,
  async react(bot: BotInterface, ban: GuildBan, db: DatabaseInterface): Promise<void> {
    // get the guild data from the db
    //const guildData: DatabaseGuildInstance = await db.discord.guilds.fetch(ban.guild)

    /*
    // if we have moderation logs enabled, log it
    if (guildData.options.logs.moderation) {

      const embed = new EmbedBuilder()
        .setAuthor({
          name: `Ban \`${banId}\``,
        })
        .setTitle(`Jump To`)
        .setURL(ban.url)
        .setDescription(`**User:** ${username} (<@${userId}>)
          **Reason:** ${reason}
          **Duration:** ${duration}
          **Proof:** ${repliedMessage}
        `)
        .setThumbnail(`userpfp`)
        .setColor(`#ffb0f4`)
        .setFooter({
          text: `modusername`,
          iconURL: `modpfp`,
        })
        .setTimestamp()

        let logChannel: GuildBasedChannel = ban.guild.channels.cache.get(guildData.data.options.logs.moderation)
    }
        */
  }
}
