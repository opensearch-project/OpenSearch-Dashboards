/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ATNSimulator, RecognitionException, Recognizer, Token } from 'antlr4ng';
import { buildCommandSuggestion } from '@osd/monaco';
import { GeneralErrorListener } from '../shared/general_error_listerner';

/**
 * PPL-specific error listener for the runtime (ParserInterpreter) validation
 * path. It augments {@link GeneralErrorListener} with command-typo suggestion:
 * when the offending token is a misspelled command keyword, ANTLR's noisy
 * "mismatched input ... expecting {40 keywords}" message is replaced with
 * `Unknown command "X". Did you mean "Y"?` and a one-click quick-fix is
 * attached.
 *
 * SQL, DQL, PromQL, and PPL-autocomplete keep using the base class untouched;
 * only the PPL validation path swaps in this subclass.
 */
export class PPLCommandErrorListener extends GeneralErrorListener {
  syntaxError<S extends Token, T extends ATNSimulator>(
    recognizer: Recognizer<T>,
    token: S | null,
    startLine: number,
    startColumn: number,
    message: string,
    e?: RecognitionException | null
  ): void {
    const suggestion = buildCommandSuggestion(recognizer, token, e ?? null);

    // Delegate position bookkeeping to the base class, passing the friendly
    // message when we have one (else ANTLR's original).
    super.syntaxError(recognizer, token, startLine, startColumn, suggestion?.message ?? message, e);

    // The base class just pushed the error; attach the structured identity and
    // fix to it so the marker builder can render a lightbulb. Keep ANTLR's raw
    // message too, so a consumer can revert when command suggestions are off.
    if (suggestion) {
      const last = this.errors[this.errors.length - 1];
      if (last) {
        last.code = suggestion.code;
        last.fix = suggestion.fix;
        last.rawMessage = message;
      }
    }
  }
}
