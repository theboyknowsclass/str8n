export enum InstructionMode {
  IMPORT = 1 << 0, // 1
  EDIT = 1 << 1, // 2
  EXPORT = 1 << 2, // 4
  ALL = IMPORT | EDIT | EXPORT,
  EDIT_AND_EXPORT = EDIT | EXPORT,
}
