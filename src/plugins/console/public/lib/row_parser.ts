/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { CoreEditor, Token } from '../types';
import { TokenIterator } from './token_iterator';

export const MODE = {
  REQUEST_START: 2,
  IN_REQUEST: 4,
  MULTI_DOC_CUR_DOC_END: 8,
  REQUEST_END: 16,
  BETWEEN_REQUESTS: 32,
};

// eslint-disable-next-line import/no-default-export
export default class RowParser {
  constructor(private readonly editor: CoreEditor) {}

  MODE = MODE;

  getRowParseMode(lineNumber = this.editor.getCurrentPosition().lineNumber) {
    const linesCount = this.editor.getLineCount();
    if (lineNumber > linesCount || lineNumber < 1) {
      return MODE.BETWEEN_REQUESTS;
    }
    const mode = this.editor.getLineState(lineNumber);
    if (!mode) {
      return MODE.BETWEEN_REQUESTS;
    } // shouldn't really happen

    // If another "start" mode is added here because we want to allow for new language highlighting
    // please see https://github.com/elastic/kibana/pull/51446 for a discussion on why
    // should consider a different approach.
    if (mode !== 'start' && mode !== 'start-sql') {
      return MODE.IN_REQUEST;
    }

    let line = (this.editor.getLineValue(lineNumber) || '').trim();
    if (!line || line[0] === '#') {
      return MODE.BETWEEN_REQUESTS;
    } // empty line or a comment waiting for a new req to start

    // ------------------------------------------------------------------
    // A line that *starts* with "[" is the first line of a request body
    // (e.g. PATCH with a JSON-Patch array), **not** the start of a new
    // request.  Mark it simply as “inside a request”.
    // ------------------------------------------------------------------
    if (line[0] === '[') {
      return MODE.IN_REQUEST;
    }

    /* -----------------------------------------------------------
     * PATCH bodies are a JSON array.  While we are *inside* that
     * array (between the opening “[” and its matching “]”) we must
     * never consider a line starting with “{” or ending with “}”
     * to open / close a new doc.
     * --------------------------------------------------------- */
    const insideJsonArray = (() => {
      let i = lineNumber;
      let openBrackets = 0;
      while (i >= 1) {
        const l = (this.editor.getLineValue(i) || '').trim();
        if (l.startsWith(']')) {
          if (openBrackets === 0) return false;
          openBrackets--;
        }
        if (l.endsWith('[')) {
          openBrackets++;
        }
        if (openBrackets > 0 && i < lineNumber) return true;
        i--;
      }
      return false;
    })();

    if (insideJsonArray) {
      return MODE.IN_REQUEST;
    }

    // If the current line ends with a closing brace/bracket, decide if the request/doc ends here.
    const endsWithCloseBrace = line.endsWith('}');
    const endsWithCloseBracket = /\]\s*$/.test(line);
    if (endsWithCloseBrace || endsWithCloseBracket) {
      // check for a multi doc request (must start a new json doc immediately after this one end.
      lineNumber++;
      if (lineNumber < linesCount + 1) {
        line = (this.editor.getLineValue(lineNumber) || '').trim();
        if (line.startsWith('{')) {
          // next line is another doc in a multi doc
          // eslint-disable-next-line no-bitwise
          return MODE.MULTI_DOC_CUR_DOC_END | MODE.IN_REQUEST;
        }
        // If next line starts with ']' we are still inside an array body,
        // don't end the request yet — the real end is the line with ']'.
        if (endsWithCloseBrace && line.startsWith(']')) {
          return MODE.IN_REQUEST;
        }
      }
      // End the request when the current line ends with a closing bracket,
      // or when it's a lone '}' not followed by another JSON doc.
      // eslint-disable-next-line no-bitwise
      return MODE.REQUEST_END | MODE.MULTI_DOC_CUR_DOC_END;
    }

    // check for single line requests
    lineNumber++;
    if (lineNumber >= linesCount + 1) {
      // eslint-disable-next-line no-bitwise
      return MODE.REQUEST_START | MODE.REQUEST_END;
    }
    line = (this.editor.getLineValue(lineNumber) || '').trim();
    // if the next line doesn't begin a JSON body (object or array),
    // it means the current line is a complete request line (no body)
    if (!(line.startsWith('{') || line.startsWith('['))) {
      // next line is another request
      // eslint-disable-next-line no-bitwise
      return MODE.REQUEST_START | MODE.REQUEST_END;
    }

    return MODE.REQUEST_START;
  }

  rowPredicate(lineNumber: number | undefined, editor: CoreEditor, value: any) {
    const mode = this.getRowParseMode(lineNumber);
    // eslint-disable-next-line no-bitwise
    return (mode & value) > 0;
  }

  isEndRequestRow(row?: number, _e?: CoreEditor) {
    const editor = _e || this.editor;
    return this.rowPredicate(row, editor, MODE.REQUEST_END);
  }

  isRequestEdge(row?: number, _e?: CoreEditor) {
    const editor = _e || this.editor;
    // eslint-disable-next-line no-bitwise
    return this.rowPredicate(row, editor, MODE.REQUEST_END | MODE.REQUEST_START);
  }

  isStartRequestRow(row?: number, _e?: CoreEditor) {
    const editor = _e || this.editor;
    return this.rowPredicate(row, editor, MODE.REQUEST_START);
  }

  isInBetweenRequestsRow(row?: number, _e?: CoreEditor) {
    const editor = _e || this.editor;
    return this.rowPredicate(row, editor, MODE.BETWEEN_REQUESTS);
  }

  isInRequestsRow(row?: number, _e?: CoreEditor) {
    const editor = _e || this.editor;
    return this.rowPredicate(row, editor, MODE.IN_REQUEST);
  }

  isMultiDocDocEndRow(row?: number, _e?: CoreEditor) {
    const editor = _e || this.editor;
    return this.rowPredicate(row, editor, MODE.MULTI_DOC_CUR_DOC_END);
  }

  isEmptyToken(tokenOrTokenIter: TokenIterator | Token | null) {
    const token =
      tokenOrTokenIter && (tokenOrTokenIter as TokenIterator).getCurrentToken
        ? (tokenOrTokenIter as TokenIterator).getCurrentToken()
        : tokenOrTokenIter;
    return !token || (token as Token).type === 'whitespace';
  }

  isUrlOrMethodToken(tokenOrTokenIter: TokenIterator | Token) {
    const t = (tokenOrTokenIter as TokenIterator)?.getCurrentToken() ?? (tokenOrTokenIter as Token);
    return t && t.type && (t.type === 'method' || t.type.indexOf('url') === 0);
  }

  nextNonEmptyToken(tokenIter: TokenIterator) {
    let t = tokenIter.stepForward();
    while (t && this.isEmptyToken(t)) {
      t = tokenIter.stepForward();
    }
    return t;
  }

  prevNonEmptyToken(tokenIter: TokenIterator) {
    let t = tokenIter.stepBackward();
    // empty rows return null token.
    while ((t || tokenIter.getCurrentPosition().lineNumber > 1) && this.isEmptyToken(t))
      t = tokenIter.stepBackward();
    return t;
  }
}
