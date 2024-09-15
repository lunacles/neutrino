// discord.js
type Action = StringSelectMenuInteraction<CacheType> | UserSelectMenuInteraction<CacheType> | RoleSelectMenuInteraction<CacheType> | MentionableSelectMenuInteraction<CacheType> | ChannelSelectMenuInteraction<CacheType> | ButtonInteraction<CacheType>
type Component = InteractionCollector<CollectedInteraction<CacheType>>

// canvas
type CachedElement = 'bar' | 'text' | 'rect' | 'heart' | 'club' | 'spade' | null
type Radii = Array<number> | number
type ClipType = 'circle' | 'rect' | 'path'
type CanvasColor = string | CanvasGradient | CanvasPattern
type ColorValue = typeof Color | Array<number> | CanvasColor | object

// command
type Suit = typeof Suits[keyof typeof Suits]
type Face = typeof FaceCard[keyof typeof FaceCard]
type PlayingCard = NumberRange<1, 10> | Face
type Cooldowns = 'score' | 'leaderboard' | 'claim' | 'steal' | 'gamble' | 'shield' | 'blackjack'

// misc
type Pair<T> = [T, T]
type Tuple<T> = [T, T, T]
type Quaple<T> = [T, T, T, T]
type NumberRange<Min extends number, Max extends number> = Exclude<Partial<unknown[]>, { length: Min }>['length'] & Exclude<Partial<unknown[]>, { length: Max }['length']>[number]
type Mutation = RandomInterface | number
type Keys<T> = T extends Record<infer U extends string, any> ? keyof T | Flatten<T[U]> : never
type FixedArray<T, N extends number> = [T, ...T[]] & { length: N }

// maze
type Seed = string | number
type MazeAlgorithm = RandomWalkerInterface | NoiseInterface
type Movement = Array<number> | number
type NoiseAlgorithms = 'normal' | 'clamped' | 'quantized' | 'dynamic' | 'domainWarped' | 'multiScale' | 'marble'

// colors
type RGBValue = NumberRange<0, 255>
type RGBTuple = [NumberRange<0, 255>, NumberRange<0, 255>, NumberRange<0, 255>]
type RGBAQuaple = [NumberRange<0, 255>, NumberRange<0, 255>, NumberRange<0, 255>, NumberRange<0, 255>]
type LuminosityValue = NumberRange<0, 100>
type ChromaticValue = NumberRange<-128, 127>
type LABTuple = [LuminosityValue, ChromaticValue, ChromaticValue]
type Hue = NumberRange<0, 360>
type Saturation = NumberRange<0, 100>
type Value = NumberRange<0, 100>
type HSVTuple = [Hue, Saturation, Value]
type PaletteValue = RGBTuple | RGBAQuaple

// db
type CachedInstance = FirebaseInstanceInterface | JSONDBInstanceInterface
type DatabaseType = 'firebase' | 'json'
type Data = DiscordUserData | DiscordGuildData
type DataKeys = Keys<DiscordUserData> | Keys<DiscordGuildData>
