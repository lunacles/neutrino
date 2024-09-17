export enum PlacementType {
  Empty = 0,
  Wall = 1,
}
export enum OperationType {
  Set = 'set',
  Update = 'update',
  Delete = 'delete',
}
export enum Suits {
  Clubs = 'c',
  Spades = 's',
  Hearts = 'h',
  Diamonds = 'd',
}
export enum FaceCard {
  Ace = 'a',
  King = 'k',
  Queen = 'q',
  Jack = 'j',
}
export enum Ease {
  Linear = 'linear',
  QuadIn = 'quadIn',
  QuadOut = 'quadOut',
  QuadInOut = 'quadInOut',
  CubicIn = 'cubicIn',
  CubicOut = 'cubicOut',
  CubicInOut = 'cubicInOut',
  QuartIn = 'quartIn',
  QuartOut = 'quartOut',
  QuartInOut = 'quartInOut',
}
export enum Format {
  RGB444 = 'rgb444',
  RGBA4444 = 'rgba4444',
  RGB565 = 'rgb565',
}
export enum Abort {
  InsufficientPermissions = 'You have insufficient permissions to run this command',
  CommandUnavailable = 'Command unavailable',
  InvalidChannelType  = 'Invalid channel type',
  CommandUnavailableInServer = 'Command is not available in this server',
  SelfTargetNotAllowed = 'The selected user cannot be yourself',
  CommandRestrictedChannel = 'This command cannot be used in this channel',
  ChannelNoPermissionOverwrites = 'Selected channel does not support permission overwrites',
  AlreadyPersistent = 'This role is already persistent',
  NotPersistent = 'This role is not persistent',
  TargetNotFound = 'No target user found',
  TargetNotGiven = 'No target user provided',
  AlreadyIgnored = 'This channel is already ignored',
  NotIgnored = 'This channel is not ignored',
  ChannelNotFound = 'No target user found',
  ChannelNotGiven = 'No target user provided',
  MaxPersistence = 'Maximum number of persistence',
  EmptyLeaderboard = 'The leaderboard is empty! Something really bad must\'ve happened!'
}
