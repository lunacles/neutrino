import Color from './color.js'

const Colors = {
  pureBlack: Color.fromHex('#000000'),
  pureWhite: Color.fromHex('#ffffff'),
  white: Color.fromHex('#f6f6f6'),
  black: Color.fromHex('#0e0e0e'),

  darkBlue: Color.fromHex('#081322'),
  glacialBlue: Color.fromHex('#afe1fb'),
  cyan: Color.fromHex('#6191ae'),
  pastelBlue: Color.fromHex('#8ec6e6'),

  gray: Color.fromHex('#b2b2b2'),
  red: Color.fromHex('#de7076'),

  wall: Color.fromHex('#999999'),

  snow: Color.fromHex('#FFFAFA'),
  darkGray: null,
  carrot: Color.fromHex('#EB8921'),
  brown: Color.fromHex('#654321'),

  error: Color.fromHex('#cc0000'),

  green: Color.fromHex('#116e5d'),

  warn: Color.fromHex('#2a842e'),
  mute: Color.fromHex('#d2a23a'),
  ban: Color.fromHex('#d23a3a'),
}
Colors.darkGray = Color.blend(Colors.gray, Colors.black, 0.6)

export default Colors
