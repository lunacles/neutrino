import {
  ChatInputCommandInteraction,
  CacheType,
  SlashCommandBuilder,
  SlashCommandBooleanOption,
  PermissionsBitField,
  SlashCommandRoleOption,
  Role,
  APIRole,
  SlashCommandUserOption,
  SlashCommandStringOption,
  User,
} from 'discord.js'
import InteractionObserver from '../interactionobserver.js'
import Database from '../../db/database.js'
import { Abort } from '../../types/enum.js'

const RolePersist: CommandInterface = {
  name: 'role-persist',
  description: 'Add, remove, or list the roles that will persist when a user leaves and rejoins.',
  data: new SlashCommandBuilder()
  .addUserOption((option: SlashCommandUserOption): SlashCommandUserOption => option
    .setName('user')
    .setDescription('The user you want to apply role-persist to.')
  ).addStringOption((option: SlashCommandStringOption): SlashCommandStringOption => option
    .setName('user-id')
    .setDescription('The user id you want to apply role-persist to.')
  ).addRoleOption((option: SlashCommandRoleOption): SlashCommandRoleOption => option
    .setName('role')
    .setDescription('The role that will persist when a member leaves.')
  ).addBooleanOption((option: SlashCommandBooleanOption): SlashCommandBooleanOption => option
    .setName('remove')
    .setDescription('Will remove the selected role from the role persistance.')
  ),
  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    const observer = await new InteractionObserver(interaction).defer()
    const targetUser: User = interaction.options.getUser('user')
    const userId: string = interaction.options.getString('user-id')
    const role: NonNullable<Role | APIRole> = interaction.options.getRole('role')
    const remove: boolean = interaction.options.getBoolean('remove') ?? false

    if (!observer.checkPermissions([PermissionsBitField.Flags.ManageRoles], interaction.channel)) return await observer.abort(Abort.InsufficientPermissions)

    let user: string
    if (targetUser) {
      user = targetUser.id
    } else if (userId) {
      user = userId
    } else {
      return await observer.abort(Abort.TargetNotGiven)
    }

    let userData: DatabaseInstanceInterface = await Database.discord.users.fetch(user)

    if (userData.rolePersist[role.id]) {
      return await observer.abort(Abort.AlreadyPersistent)
    } else if (remove) {
      return await observer.abort(Abort.NotPersistent)
    }

    if (remove) {
      await userData.removeRolePersistence(role.id)
      interaction.editReply(`Removed ${role.name} from role persistance.`)
    } else {
      let serverRoles = Object.values(userData.rolePersist).filter((serverId: string): boolean => serverId === interaction.guildId).length
      if (serverRoles >= global.rolePersistCap)
        observer.abort(Abort.MaxPersistence)

      await userData.addRolePersistence(role.id, interaction.guildId)
      interaction.editReply(`Add ${role.name} to role persistance.`)
    }
  },
  test(): boolean {
    return true
  },
}

export default RolePersist
