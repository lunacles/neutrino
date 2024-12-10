import {
  ChatInputCommandInteraction,
  CacheType,
  SlashCommandBuilder,
  SlashCommandIntegerOption,
  SlashCommandNumberOption,
} from 'discord.js'

let combine = (a: number, b: number, c: number, precision: number = 2): number => {
  let shift = Math.pow(10, precision)
  let maxDecimal = 999.99
  let maxValue = Math.round(maxDecimal * shift)
  let m2 = maxValue + 1
  let m1 = m2 * m2
  let a2 = Math.round(a * shift)
  let b2 = Math.round(b * shift)
  let c2 = Math.round(c * shift)
  return a2 * m1 + b2 * m2 + c2
}

let separate = (combined: number, precision: number = 2): Tuple<number> => {
  let shift = Math.pow(10, precision)
  let maxDecimal = 999.99
  let maxValue = Math.round(maxDecimal * shift)
  let m2 = maxValue + 1
  let m1 = m2 * m2
  let A = Math.floor(combined / m1)
  let remainder = combined % m1
  let B = Math.floor(remainder / m2)
  let C = remainder % m2
  let a = A / shift
  let b = B / shift
  let c = C / shift
  return [a, b, c]
}
const bombs = new Map<string, number>([
  ['250lb AN-M30A1', combine( // USA 250lb bomb
    91.44, // length (cm)
    20.83, // diameter (cm)
    49.9, // bomb mass (kg)
  )],
  ['500lb AN-M64A1', combine( // USA 500lb bomb
    91.44, // length (cm)
    27.69, // diameter (cm)
    150.27, // bomb mass (kg)
  )],
  ['1000lb AN-M65A1', combine( // USA 1000lb bomb
    170.43, // length (cm)
    18.8, // diameter (cm)
    439.6, // bomb mass (kg)
  )],
  ['1600lb AN-Mk 1 APB', combine( // USA 1600lb armor-piercing bomb
    212.09, // length (cm)
    35.56, // diameter (cm)
    721.2, // bomb mass (kg)
  )],
  ['Type A Mark I Magnetic Mine', combine( // USA 1000lb magnetic mine
    174.63, // length (cm)
    50.48, // diameter (cm)
    494.4, // bomb mass (kg)
  )],
  ['250lb LDGP Mk 81', combine( // USA 250lb bomb
    187.96, // length (cm)
    22.86, // diameter (cm)
    117.9, // bomb mass (kg)
  )],
  ['500lb LDGP Mk 82', combine( // USA 500lb bomb
    221.0, // length (cm)
    27.4, // diameter (cm)
    240.9, // bomb mass (kg)
  )],
  ['750lb M117 Cone 45', combine( // USA 750lb bomb
    220.0, // length (cm)
    41.0, // diameter (cm)
    362.42, // bomb mass (kg)
  )],
  ['1000lb LDGP Mk 83', combine( // USA 1000lb bomb
    304.0, // length (cm)
    35.6, // diameter (cm)
    240.9, // bomb mass (kg)
  )],
  ['2000lb LDGP Mk 84', combine( // USA 2000lb bomb
    330.0, // length (cm)
    46.0, // diameter (cm)
    893.6, // bomb mass (kg)
  )],
  ['3000lb M118', combine( // USA 3000lb bomb
    410.0, // length (cm)
    57.0, // diameter (cm)
    1369.8, // bomb mass (kg)
  )],
  ['GBU-8', combine( // USA Guided bomb
    366.0, // length (cm)
    46.0, // diameter (cm)
    1027.0, // bomb mass (kg)
  )],
  ['GBU-10 Paveway II', combine( // USA Guided bomb
    430.0, // length (cm)
    46.0, // diameter (cm)
    943.93, // bomb mass (kg)
  )],
  ['GBU-12 Paveway II', combine( // USA Guided bomb
    330.0, // length (cm)
    27.3, // diameter (cm)
    277.14, // bomb mass (kg)
  )],
  ['GBU-15(V)2/B', combine( // USA Guided bomb
    389.0, // length (cm)
    46.0, // diameter (cm)
    1140.8, // bomb mass (kg)
  )],
  ['GBU-16 Paveway II', combine( // USA Guided bomb
    360.0, // length (cm)
    36.0, // diameter (cm)
    495.3, // bomb mass (kg)
  )],
  ['GBU-24 Paveway III', combine( // USA Guided bomb
    430.0, // length (cm)
    46.0, // diameter (cm)
    1079.55, // bomb mass (kg)
  )],
  ['GBU-31 JDAM', combine( // USA JDAM
    394.0, // length (cm)
    46.0, // diameter (cm)
    893.6, // bomb mass (kg)
  )],
  ['GBU-38(V)2/B JDAM', combine( // USA JDAM
    234.0, // length (cm)
    27.0, // diameter (cm)
    253.1, // bomb mass (kg)
  )],
  ['GBU-39/B (SDB I)', combine( // USA JDAM
    179.83, // length (cm)
    15.44, // diameter (cm)
    121.56, // bomb mass (cm)
  )],
  ['GBU-54B LIDAM', combine( // Germany JDAM
    300.0, // length (cm)
    27.0, // diameter (cm)
    260.82, // bomb mass (cm)
  )],
  ['Mk 77 Mod 4', combine( // USA Fire bomb
    228.60, // length (cm)
    38.10, // diameter (cm)
    235.9, // bomb mass (kg)
  )],
  ['BLU-27/B', combine( // USA Fire bomb
    220.0, // length (cm)
    38.0, // diameter (cm)
    401.4, // bomb mass (kg)
  )],
  ['BLU-1', combine( // USA Fire bomb
    210.0, // length (cm)
    35.0, // diameter (cm)
    401.4, // bomb mass (kg)
  )],


  ['100kg OFAB-100', combine( // Germany 100kg bomb
    105.0, // length (cm)
    25.0, // diameter (cm)
    114.0, // bomb mass (kg)
  )],
  ['250kg FAB-250M-62', combine( // Germany 250kg bomb
    225.0, // length (cm)
    35.0, // diameter (cm)
    227.0, // bomb mass (kg)
  )],
  ['500kg FAB-500M-62', combine( // Germany 250kg bomb
    247.0, // length (cm)
    40.0, // diameter (cm)
    508.3, // bomb mass (kg)
  )],
  ['ZB-500', combine( // Germany fire bomb
    227.0, // length (cm)
    40.0, // diameter (cm)
    374.0, // bomb mass (kg)
  )],

  ['500kg KAB-500Kr-E', combine( // USSR guided bomb
    305.0, // length (cm)
    35.0, // diameter (cm)
    520.0, // bomb mass (kg)
  )],
  ['500kg KAB-500S', combine( // USSR guided bomb
    300.0, // length (cm)
    40.0, // diameter (cm)
    560.0, // bomb mass (kg)
  )],
  ['1500kg KAB-1500Kr', combine( // USSR guided bomb
    463.0, // length (cm)
    58.0, // diameter (cm)
    1525.0, // bomb mass (kg)
  )],
  ['1500kg KAB-1500L', combine( // USSR guided bomb
    428.0, // length (cm)
    58.0, // diameter (cm)
    1525.0, // bomb mass (kg)
  )],
  ['Kh-38MT', combine( // USSR guided bomb
    420.0, // length (cm)
    31.0, // diameter (cm)
    520.0, // bomb mass (kg)
  )],
  ['Kh-38ML', combine( // USSR guided bomb
    420.0, // length (cm)
    31.0, // diameter (cm)
    520.0, // bomb mass (kg)
  )],
  ['Kh-29TD', combine( // USSR guided missile
    390.0, // length (cm)
    38.0, // diameter (cm)
    686.0, // bomb mass (kg)
  )],
])

const DropCalc: CommandInterface = {
  name: 'drop-calc',
  description: 'Calculated the distance at which a bomb should be dropped.',
  data: new SlashCommandBuilder()
  .addIntegerOption((option: SlashCommandIntegerOption): SlashCommandIntegerOption => option
    .setName('velocity')
    .setDescription('The velocity of your aircraft in kilometers per hour.')
    .setRequired(true)
  ).addIntegerOption((option: SlashCommandIntegerOption): SlashCommandIntegerOption => option
    .setName('altitude')
    .setDescription('The altitude of your aircraft in meters.')
    .setRequired(true)
  ).addNumberOption((option: SlashCommandNumberOption): SlashCommandNumberOption => option
    .setName('bomb')
    .setDescription('The size of the profile picture.')
    .addChoices(...Array.from(bombs.entries()).slice(0, 25).map(([name, dimensions]) => ({
      name,
      value: dimensions,
    })))
    .setRequired(true)
  ).setDMPermission(false),
  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    console.log('a')

    await interaction.deferReply()
    const velocity: number = interaction.options.getInteger('velocity')
    const altitude: number = interaction.options.getInteger('altitude')
    const dimensions: number = interaction.options.getNumber('bomb')

    const [length, diameter, mass] = separate(dimensions)

    const g: number = 9.81 // gravitational acceleration
    const tempLapseRate: number = 0.0065 // temperature lapse rate
    const seaLevelPressure: number = 101325 // sea level standard atmospheric pressure
    const seaLevelTemp: number = 288.15 // sea level standard temperature
    const molar: number = 0.0289644 // molar mass of the air
    const gasConstant: number = 8.3144598 // universal gas constant
    const glideRatio = 4

    const toMeter = (v: number) => v * 1000 / 3600

    // barometric formula for pressure
    let exp: number = (g * molar) / (gasConstant * tempLapseRate)
    let pressure: number = seaLevelPressure * Math.pow(1 - (
      (tempLapseRate * altitude) / seaLevelTemp
    ), exp)

    // drag coefficient
    const aspectRatio = (length / 100) / (diameter / 100)
    const dragCoeffSphere = 0.47
    const dragCoeffCylinder = 0.82
    const dragCoefficient = 0.5 * (
      (
        dragCoeffSphere /
        Math.sqrt(1 + Math.pow(aspectRatio, 2))
      ) + (
        dragCoeffCylinder /
        Math.sqrt(1 + 1 / Math.pow(aspectRatio, 2))
      )
    )

    // density
    let temp: number = seaLevelTemp - tempLapseRate * altitude
    let density: number = (pressure * molar) / (gasConstant * temp)

    // cross sectional area of the bomb
    const crossSect: number = Math.PI * ((length / 100) / 2) * ((diameter / 100) / 2)

    // drag correction
    let force: number = 0.5 * density * Math.pow(toMeter(velocity), 2) * dragCoefficient * crossSect
    let drag: number = force / mass
    let time: number = Math.sqrt(2 * altitude / g)

    // final calcs
    let effectiveVelocity: number = toMeter(velocity) - (drag * time)
    let horizontalDistance: number = effectiveVelocity * time
    let glideRange: number = glideRatio * altitude

    let dropTarget: number = horizontalDistance + glideRange

    await interaction.editReply(`The bomb should be dropped from (roughly) ${Math.round(dropTarget)}m.`)
  },
  test(): boolean {
    return true
  }
}

export default DropCalc
