import Color from './color.js'

const Colors = {
  pureBlack: new Color('#000000'),
  pureWhite: new Color('#ffffff'),
  white: new Color('#f6f6f6'),
  black: new Color('#0e0e0e'),

  darkBlue: new Color('#081322'),
  glacialBlue: new Color('#afe1fb'),
  cyan: new Color('#6191ae'),
  pastelBlue: new Color('#8ec6e6'),

  gray: new Color('#b2b2b2'),
  red: new Color('#de7076'),

  wall: new Color('#999999'),

  snow: new Color('#FFFAFA'),
  darkGray: null,
  carrot: new Color('#EB8921'),
  brown: new Color('#654321'),

  error: new Color('#cc0000'),
}
Colors.darkGray = Color.blend(Colors.gray ?? '#ffffff', Colors.black, 0.6)

export default Colors
