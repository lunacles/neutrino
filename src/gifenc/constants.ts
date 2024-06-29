// Modified from: https://github.com/mattdesl/gifenc/tree/master
// plan on improving later.
enum Const {
  Signature = 'GIF',
  Version = '0',
  Trailer = 0x3B,
  ExtensionIntroducer = 0x21,
  ApplicationExtensionLabel = 0xFF,
  GraphicControlExtensionLabel = 0xF9,
  ImageSeparator = 0x2C,
  // Header
  SignatureSize = 3,
  VersionSize = 3,
  GlobalColorTableFlagMask = 0b10000000,
  ColorResolutionMask = 0b01110000,
  SortFlagMask = 0b00001000,
  GlobalColorTableSizeMask = 0b00000111,
  // Application extension
  ApplicationIdentifierSize = 8,
  ApplicationAuthCodeSize = 3,
  // Graphic control extension
  DisposalMethodMask = 0b00011100,
  UserInputFlagMask = 0b00000010,
  TransparentColorFlagMask = 0b00000001,
  // Image descriptor
  LocalColorTableFlagMask = 0b10000000,
  InterlaceFlagMask = 0b01000000,
  IdSortFlagMask = 0b00100000,
  LocalColorTableSizeMask = 0b00000111,
}

export default Const
