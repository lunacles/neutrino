import {
  ChatInputCommandInteraction,
  CacheType,
  SlashCommandBuilder,
  SlashCommandIntegerOption,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
  Collection,
  CollectedInteraction,
  User,
  Message,
} from 'discord.js'
import InteractionObserver from '../interactionobserver.js'
import config from '../../config.js'
import * as util from '../../utilities/util.js'
import Random from '../../utilities/random.js'
import { Background, Card, Circle, Clip, Media, RoundRect, Text } from '../../canvas/elements.js'
import Colors from '../../canvas/palette.js'
import NodeCanvas from '../../canvas/canvas.js'
import Interpolator from '../../canvas/interpolator.js'
import { loadImage } from 'canvas'
import { GIFEncoder, pnnQuant, Palettize } from '../../gifenc/index.js'
import { Ease, EndMessage, EndState, FaceCard, Suits } from '../../types/enum.js'

const Game = class implements GameInterface {
  // NOTE: maybe allocate this to the guild data instead?
  public static activeMatches = new Map<string, TableInterface>()
  public playerCards: Array<CardData>
  public dealerCards: Array<CardData>
  private readonly ran: RandomInterface
  public deck: Array<CardData>
  public userData: DatabaseGuildMemberInstance
  public neutrinoData: DatabaseGuildMemberInstance
  constructor(userData: DatabaseGuildMemberInstance, neutrinoData: DatabaseGuildMemberInstance) {
    this.playerCards = []
    this.dealerCards = []

    this.ran = new Random()

    let ranks: Array<PlayingCard> = [...Array.from({ length: 9 }, (_, i: number): number => i + 2), ...Object.values(FaceCard) satisfies Array<Face>]
    this.deck = Object.values(Suits).flatMap((suit: Suit): Array<CardData> => ranks.map((rank: PlayingCard): CardData => ({
      suit,
      rank,
      x: 0,
      y: 0,
      xTarget: 0,
      yTarget: 0,
      delay: 0,
      interpolation: null,
      facing: 0,
    })))

    this.userData = userData
    this.neutrinoData = neutrinoData
  }
  public shuffleDeck(): void {
    this.deck = this.ran.shuffleArray(this.deck)
  }
  public hit(who: 'player' | 'dealer'): CardData {
    let card: CardData
    if (who === 'player') {
      card = this.deck.shift()
      this.playerCards.push(card)
    } else {
      card = this.deck.shift()
      this.dealerCards.push(card)
    }
    return card
  }
  public sumCards(cards: Array<CardData>): number {
    let sum: number = 0
    let aceCount: number = 0
    for (let card of cards) {
      if (card.rank === 'a') {
        sum += 11
        aceCount++
      } else if (['k', 'q', 'j'].includes(card.rank as Face)) {
        sum += 10
      } else {
        sum += card.rank as number
      }
    }
    while (sum > 21 && aceCount > 0) {
      sum -= 10
      aceCount--
    }
    return sum
  }
  public busted(sum: number): boolean {
    return sum > 21
  }
  public async updateScores(state: number, amount: number): Promise<void> {
    // Update the user and neutrino's score accordingly
    await this.neutrinoData.setScore(this.neutrinoData.score + (
      state ? -amount : // lose
      state == null ? amount * 0.5 : // tie
      amount // win
    ))
    await this.userData.setScore(this.userData.score + (
      state ? amount : // win
      state == null ? amount * -0.5 : // tie
      -amount // lose
    ))
  }
}

const Table = class implements TableInterface {
  public static neutrinoIcon = null
  private readonly c: NodeCanvasInterface
  public readonly amount: number
  public readonly game: any
  private readonly bgBorder: number
  private readonly spacing: number
  private readonly cardSize: number
  private readonly width: number
  private readonly height: number
  private readonly radius: number
  private deckX: number
  private deckY: number
  private userIcon: any
  constructor(amount: number, userData: DatabaseGuildMemberInstance, neutrinoData: DatabaseGuildMemberInstance) {
    this.amount = amount
    this.game = new Game(userData, neutrinoData)
    this.bgBorder = 24
    this.spacing = 8
    this.cardSize = 128
    this.width = 1024
    this.height = 1024
    this.c = new NodeCanvas(this.width, this.height)

    this.radius = 64
    this.deckX = this.width - this.cardSize * 1.5 - this.bgBorder - this.spacing - this.radius
    this.deckY = this.width * 0.5 - this.cardSize * 0.75
    this.userIcon = null
  }
  private async icon(x: number, y: number, file: string, name: string, bottom: boolean = false): Promise<void> {
    RoundRect.draw({
      x: x - this.radius * 4.5, y: y + (bottom ? this.radius : 0),
      width: this.radius * 3.5, height: this.radius,
      radii: bottom ? [50, 50, 10, 10] : [10, 10, 50, 50],
    }).fill(Colors.darkBlue)
    Text.draw({
      x: x - this.spacing - this.radius * 4, y: y + this.spacing + this.radius * 0.55 + (bottom ? this.radius : 0),
      fitToWidth: this.radius * 2.15,
      fitToHeight: this.radius * 0.4,
      text: name,
      align: 'left',
      family: 'Ubuntu', style: 'bold',
    }).both(Colors.white, Colors.black, 4)

    Circle.draw({
      x: x - this.radius, y: y + this.radius,
      radius: this.radius,
    }).stroke(Colors.darkBlue, 8)
    Clip.circle({
      x: x - this.radius, y: y + this.radius,
      radius: this.radius,
    })
    await Media.draw({
      x: x - this.radius * 2, y: y,
      width: this.radius * 2, height: this.radius * 2,
      dir: file,
    })
    Clip.end()
  }
  private reset(): void {
    Background.fill(Colors.green).stroke(Colors.brown, this.bgBorder)
  }
  private async player(user: User): Promise<void> {
    if (this.userIcon == null)
      this.userIcon = await loadImage(user.avatarURL({ extension: 'png' }))
    await this.icon(this.width - this.bgBorder - this.spacing, this.height - this.bgBorder - this.spacing - this.radius * 2, this.userIcon, user.username, true)
  }
  private async dealer(): Promise<void> {
    await this.icon(this.width - this.bgBorder - this.spacing, this.bgBorder + this.spacing, Table.neutrinoIcon, 'Neutrino')
  }
  private playerCards(ignore?: number): void {
    for (let [i, card] of this.game.playerCards.entries()) {
      if (i === ignore) continue
      Card.draw({
        x: this.bgBorder + this.spacing * (i + 1) + (i * this.cardSize), y: this.height - this.bgBorder - this.spacing - this.cardSize * 1.5,
        size: this.cardSize
      }, card.suit, card.rank, card.facing)
    }
  }
  private dealerCards(ignore?: number): void {
    for (let [i, card] of this.game.dealerCards.entries()) {
      if (i === ignore) continue
      Card.draw({
        x: this.bgBorder + this.spacing * (i + 1) + (i * this.cardSize), y: this.bgBorder + this.spacing,
        size: this.cardSize
      }, card.suit, card.rank, card.facing)
    }
  }
  private deck(): void {
    Card.draw({
      x: this.deckX, y: this.deckY,
      size: this.cardSize
    }, this.game.deck[0].suit, this.game.deck[0].rank, 0)
  }
  private shuffleDeck(frame: number): void {
    for (let card of this.game.deck.slice(10)) {
      let curve: number = card.interpolation.get(Math.max(0, frame - card.delay))
      Card.draw({
        x: this.deckX + card.xTarget * curve, y: this.deckY + card.yTarget * curve, size: this.cardSize
      }, card.suit, card.rank, 0)
    }
  }
  private resetCardPositions(): void {
    this.game.deck = this.game.deck.map((card: CardData, i: number): CardData => ({
      suit: card.suit,
      rank: card.rank,
      x: this.deckX,
      y: this.deckY,
      xTarget: (this.cardSize * 0.2 + this.cardSize * 0.6 * Math.random()) * (Math.random() < 0.5 ? -1 : 1),
      yTarget: -i * 1 / 4,
      delay: i % 2,
      interpolation: Interpolator.create({
        frameDuration: 4,
        type: Ease.CubicInOut,
      }),
      facing: 0,
    }))
  }
  private captureFrame(encoder: any): void {
    let canvas: ImageData = this.c.ctx.getImageData(0, 0, this.width, this.height)
    let palette = pnnQuant.quantize(canvas.data, 256)
    let index = Palettize.applyPalette(canvas.data, palette)
    encoder.writeFrame(index, this.width, this.height, {
      palette: palette,
      repeat: -1,
    })
  }
  async initialAnimation(user: User): Promise<Buffer> {
    const encoder = new GIFEncoder()
    this.game.shuffleDeck()

    for (let i: number = 0; i < 2; i++) {
      this.resetCardPositions()
      for (let frame: number = 0; frame < 4; frame++) {
        this.reset()
        await this.player(user)
        await this.dealer()
        this.shuffleDeck(frame)

        this.captureFrame(encoder)
      }
      for (let frame: number = 0; frame < 8; frame++) {
        this.reset()
        await this.player(user)
        await this.dealer()
        this.shuffleDeck(7 - frame)

        this.captureFrame(encoder)
      }
    }

    for (let i: number = 0; i < 2; i++) {
      let playerCard: CardData = this.game.hit('player')
      let dealerCard: CardData = this.game.hit('dealer')
      this.game.playerCards[i].xTarget = this.bgBorder + this.spacing * (i + 1) + (i * this.cardSize)
      this.game.playerCards[i].yTarget = this.height - this.bgBorder - this.spacing - this.cardSize * 1.5

      this.game.dealerCards[i].xTarget = this.bgBorder + this.spacing * (i + 1) + (i * this.cardSize)
      this.game.dealerCards[i].yTarget = this.bgBorder + this.spacing

      for (let frame: number = 0; frame < 7; frame++) {
        this.reset()
        await this.player(user)
        await this.dealer()
        this.playerCards(i)
        this.dealerCards(i)
        this.deck()

        let dx: number = playerCard.xTarget - this.deckX
        let dy: number = playerCard.yTarget - this.deckY
        let df: number = Math.max(0, frame - playerCard.delay)
        let curve: number = playerCard.interpolation.get(df)
        Card.draw({
          x: playerCard.x + dx * curve, y: playerCard.y + dy * curve,
          size: this.cardSize
        }, playerCard.suit, playerCard.rank, df)
        this.game.playerCards[i].facing = df

        dx = dealerCard.xTarget - this.deckX
        dy = dealerCard.yTarget - this.deckY
        df = Math.max(0, frame - dealerCard.delay)
        curve = dealerCard.interpolation.get(df)
        Card.draw({
          x: dealerCard.x + dx * curve, y: dealerCard.y + dy * curve,
          size: this.cardSize
        }, dealerCard.suit, dealerCard.rank, i < 1 ? df + 1 : 0)
        if (i < 1)
          this.game.dealerCards[i].facing = df + 1

        this.captureFrame(encoder)
      }
    }

    this.reset()
    await this.player(user)
    await this.dealer()
    this.deck()
    this.playerCards()
    this.dealerCards()
    this.captureFrame(encoder)

    encoder.finish()
    return Buffer.from(encoder.buffer)
  }
  async hitAnimation(user: User, who: 'player' | 'dealer'): Promise<Buffer> {
    const encoder = new GIFEncoder()

    if (who === 'dealer') {
      let card: CardData = this.game.dealerCards[1]
      for (let frame: number = 0; frame < 7; frame++) {
        this.reset()
        await this.player(user)
        await this.dealer()
        this.playerCards(null)
        this.dealerCards(1)
        this.deck()

        Card.draw({
          x: this.bgBorder + this.spacing * 2 + this.cardSize, y: this.bgBorder + this.spacing,
          size: this.cardSize
        }, card.suit, card.rank, frame)
        card.facing = frame

        this.captureFrame(encoder)
      }
    }

    do {
      if (who === 'dealer' && this.game.sumCards(this.game.dealerCards) >= 17) break
      let card: CardData = this.game.hit(who)

      this.resetCardPositions()
      if (who === 'player') {
        let len: number = this.game.playerCards.length - 1
        this.game.playerCards[len].xTarget = this.bgBorder + this.spacing * (len + 1) + (len * this.cardSize)
        this.game.playerCards[len].yTarget = this.height - this.bgBorder - this.spacing - this.cardSize * 1.5
      } else {
        let len: number = this.game.dealerCards.length - 1
        this.game.dealerCards[len].xTarget = this.bgBorder + this.spacing * (len + 1) + (len * this.cardSize)
        this.game.dealerCards[this.game.dealerCards.length - 1].yTarget = this.bgBorder + this.spacing
      }

      for (let frame: number = 0; frame < 7; frame++) {
        this.reset()
        await this.player(user)
        await this.dealer()
        this.playerCards(who === 'player' ? this.game.playerCards.length - 1 : null)
        this.dealerCards(who === 'dealer' ? this.game.dealerCards.length - 1 : null)
        this.deck()

        let dx: number = card.xTarget - this.deckX
        let dy: number = card.yTarget - this.deckY
        let curve: number = card.interpolation.get(frame)
        Card.draw({
          x: card.x + dx * curve, y: card.y + dy * curve,
          size: this.cardSize
        }, card.suit, card.rank, frame)
        this.game[`${who}Cards`][this.game[`${who}Cards`].length - 1].facing = frame

        this.captureFrame(encoder)
      }

    } while (who === 'dealer' && this.game.sumCards(this.game.dealerCards) < 17)

    this.reset()
    await this.player(user)
    await this.dealer()
    this.deck()
    this.playerCards()
    this.dealerCards()

    this.captureFrame(encoder)

    encoder.finish()
    return Buffer.from(encoder.buffer)
  }
  getAttachment(c: NodeCanvasInterface): AttachmentBuilder {
    let buffer: Buffer = c.canvas.toBuffer('image/png')
    return new AttachmentBuilder(buffer, {
      name: 'card.png'
    })
  }
}
Table.neutrinoIcon = await loadImage('./src/utilities/assets/neutrino.png')

const Blackjack: CommandInterface = {
  name: 'blackjack',
  description: `Play Blackjack against Neutrino to and gamble some points! ${util.formatSeconds(config.cooldown.blackjack)} cooldown.`,
  data: new SlashCommandBuilder()
    .addIntegerOption((option: SlashCommandIntegerOption ): SlashCommandIntegerOption => option
    .setName('amount')
    .setDescription('The amount of points you want to gamble.')
    .setMinValue(100)
    .setRequired(true)
  ).setDMPermission(false),
  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    const observer = await new InteractionObserver(interaction).defer()
    const amount: number = interaction.options.getInteger('amount', true)
    const [ userData, neutrinoData ] = await Promise.all([observer.getGuildUserData(), observer.getGuildUserData(config.botId)])

    if (userData.shieldEnd > Date.now()) {
      interaction.editReply('You cannot play blackjack while you have a shield active!')
      return
    } else if (observer.isOnCooldown('blackjack')) {
      interaction.editReply(`This command is on cooldown for **${util.formatSeconds(observer.getCooldown('blackjack'), true)}!**`)
      return
    } else {
      if (amount > userData.score) {
    // Create a new active match
    Game.activeMatches.set(interaction.user.id, new Table(amount, userData, neutrinoData))
    // reset their cooldown
    observer.resetCooldown('blackjack')

    const row = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('hit')
        .setLabel('Hit')
        .setStyle(ButtonStyle.Danger), // 99% of gamblers quit before they hit it big
      new ButtonBuilder()
        .setCustomId('stay')
        .setLabel('Stay')
        .setStyle(ButtonStyle.Success) // refuse gambling (they are part of the 99%)
    )

    // Send the initial animation
    let response: Message = await interaction.editReply({
      files: [new AttachmentBuilder(await Game.activeMatches.get(interaction.user.id).initialAnimation(interaction.user), {
        name: 'table.gif'
      })],
      components: [row],
    })

    // Create the collector
    const collector: Component = response.createMessageComponentCollector({
      filter: observer.componentsFilter(['hit', 'stay']),
      time: collectorLifetime,
    })

    collector.on('collect', async (action: Action): Promise<void> => {
      const table: TableInterface = Game.activeMatches.get(action.user.id)

      let endGame = async (state: number, message: string, attachment: AttachmentBuilder): Promise<void> => {
        await table.game.updateScores(state, table.amount)
        await action.editReply({
          content: message
            .replace('player', action.user.id)
            .replace('bot', config.botId)
            .replace('1x', table.amount.toLocaleString())
            .replace('0.5x', Math.floor(table.amount * 0.5).toLocaleString()),
          files: [attachment],
          components: [],
        })

            Game.activeMatches.delete(action.user.id)
          }

      let runDealer = async (): Promise<void> => {
        let attachment = new AttachmentBuilder(await table.hitAnimation(action.user, 'dealer'), {
          name: 'table.gif'
        })
        let dealerTotal: number = table.game.sumCards(table.game.dealerCards)
        let playerTotal: number = table.game.sumCards(table.game.playerCards)

        // if neutrino busted, give the user the win
        if (table.game.busted(dealerTotal)) {
          await endGame(
            EndState.PlayerWin,
            EndMessage.HouseBust,
            attachment,
          )
        // if the user has a higher sum than neutrino, give them the win
        } else if (dealerTotal < playerTotal) {
          await endGame(
            EndState.PlayerWin,
            EndMessage.HouseLose,
            attachment,
          )
        // if neutrino and the user have the same amount, end in a tie
        } else if (dealerTotal === playerTotal) {
          await endGame(
            EndState.Tie,
            EndMessage.Tie,
            attachment,
          )
        // if none of the above, give neutrino the win
        } else {
          await endGame(
            EndState.HouseWin,
            EndMessage.PlayerLose,
            attachment,
          )
        }
      }

      if (action.customId === 'hit') {
        let attachment = new AttachmentBuilder(await table.hitAnimation(action.user, 'player'), {
          name: 'table.gif'
        })
        let newSum: number = table.game.sumCards(table.game.playerCards)
        // if the user hasn't busted
        if (!table.game.busted(newSum)) {
          // if they have drawn 5 cards, give them a win
          if (table.game.playerCards.length === 5) {
            await endGame(
              EndState.PlayerWin,
              EndMessage.HouseLose,
              attachment,
            )
          // if their card total is 21, run neutrino's turn
          } else if (newSum === 21) {
            await runDealer()
          } else {
            await action.editReply({
              files: [attachment],
              components: [new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                  new ButtonBuilder()
                    .setCustomId('hit')
                    .setLabel('Hit')
                    .setStyle(ButtonStyle.Danger), // 99% of gamblers quit before they hit it big
                  new ButtonBuilder()
                    .setCustomId('stay')
                    .setLabel('Stay')
                    .setStyle(ButtonStyle.Success) // refuse gambling (they are part of the 99%)
                )]
            })
          }
        // if they busted, give neutrino the win
        } else {
          await endGame(
            EndState.HouseWin,
            EndMessage.PlayerBust,
            attachment,
          )
        }
      // if they choose to stay, run neutrino's turn
      } else if (action.customId === 'stay') {
        await runDealer()
      }
    })

        collector.on('end', async (collected: Collection<string, CollectedInteraction<CacheType>>): Promise<void> => {
          if (collected.size === 0) {
            await updateScores(0, amount)
            await interaction.editReply({
              content: 'No response received, blackjack timed out.\nYou have 30 seconds to make a decision before the interaction expires.',
              components: []
            })
            Game.activeMatches.delete(interaction.user.id)
          }
        })
      }

      // remove the game from the active matches
      Game.activeMatches.delete(interaction.user.id)
    })
  },
  test(): boolean {
    return true
  },
}

export default Blackjack
