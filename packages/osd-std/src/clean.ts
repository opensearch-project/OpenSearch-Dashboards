/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/* Replaces a bunch of characters that should not be printed:
 *    0x03  ETX: End of Text
 *    0x04  EOT: End of Transmission
 *    0x05  ENQ: Enquiry
 *    0x07  BEL: Bell
 *    0x08  BS:  Backspace
 *    0x0B  VT:  Vertical Tabulation
 *    0x0C  FF:  Form Feed
 *    0x0D  CR:  Carriage Return
 *    0x0E  SO:  Shift Out
 *    0x0F  SI:  Shift In
 *    0x10  DLE: Data Link Escape
 *    0x11  DC1: Device Control One
 *    0x12  DC2: Device Control Two
 *    0x13  DC3: Device Control Three
 *    0x14  DC4: Device Control Four
 *    0x15  NAK: Negative Acknowledge
 *    0x16  SYN: Synchronous Idle
 *    0x17  ETB: End of Transmission Block
 *    0x18  CAN: Cancel
 *    0x19  EM:  End of Medium
 *    0x1A  SUB: EoF on Windows
 *    0x1B  ESC: Starts all the escape sequences
 *    0x1C  FS:  File Separator
 *    0x1D  GS:  Group Separator
 *    0x1E  RS:  Record Separator
 *    0x1F  US:  Unit Separator
 *    0x7F  Del
 *    0x90  DCS: Device Control String
 *    0x9B  CSI: Control Sequence Introducer
 *    0x9C  OSC: Operating System Command
 *
 * Ref: https://en.wikipedia.org/wiki/Control_character
 */
export const cleanControlSequences = (text: string): string => {
  return text.replace(
    /[\x03-\x05\x07\x08\x0B-\x1F\x7F\x90\x9B\x9C]/g,
    (char) => `(U+${char.charCodeAt(0).toString(16).padStart(4, '0')})`
  );
};
