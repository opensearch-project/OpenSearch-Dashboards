/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CharStream, CommonTokenStream } from 'antlr4ng';
import { CaseInsensitiveCharStream } from './adaptors/case_insensitive_char_stream';
import { OpenSearchPPLLexer } from '../../generated/OpenSearchPPLLexer';
import { OpenSearchPPLParser } from '../../generated/OpenSearchPPLParser';

/**
 * PPL Syntax Parser.
 */
export class PPLSyntaxParser {
  /**
   * Analyze the query syntax.
   */

  parse(query: string) {
    return this.createParser(this.createLexer(query));
  }

  createLexer(query: string = '') {
    return new OpenSearchPPLLexer(new CaseInsensitiveCharStream(CharStream.fromString(query)));
  }

  createParser(lexer: OpenSearchPPLLexer) {
    return new OpenSearchPPLParser(new CommonTokenStream(lexer));
  }
}
