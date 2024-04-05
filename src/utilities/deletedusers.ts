interface DeletedUsersInterface {
  ids: Map<string, string>
  fixId(id: string): string
}

const DeletedUsers: DeletedUsersInterface = {
  ids: new Map([
    ['456226577798135808', '554859443867615233'],
  ]),
  fixId(id: string): string {
    return this.ids.get(id) ?? id
  },
}

export default DeletedUsers
