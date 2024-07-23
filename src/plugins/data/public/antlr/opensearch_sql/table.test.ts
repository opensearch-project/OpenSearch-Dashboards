/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { TokenStream, Token } from 'antlr4ng';
import {
  getClosingBracketIndex,
  getTableQueryPosition,
  getJoinIndex,
  getPreviousToken,
  TokenDictionary,
} from './table';

const mockTokenStream = (tokens: Array<Partial<Token>>): TokenStream => {
  return {
    size: tokens.length,
    get: (index: number) => tokens[index] as Token,
  } as TokenStream;
};

const tokenDictionary: TokenDictionary = {
  SPACE: 1,
  FROM: 2,
  OPENING_BRACKET: 3,
  CLOSING_BRACKET: 4,
  JOIN: 5,
  SEMICOLON: 6,
  SELECT: 7,
};

describe('Autocomplete Utils', () => {
  describe('getClosingBracketIndex', () => {
    it('should return undefined if no closing bracket is found', () => {
      const tokens = [
        { type: tokenDictionary.OPENING_BRACKET, start: 0 },
        { type: tokenDictionary.FROM, start: 1 },
        { type: tokenDictionary.SPACE, start: 2 },
      ];
      const tokenStream = mockTokenStream(tokens);
      expect(getClosingBracketIndex(tokenStream, 0, tokenDictionary)).toBeUndefined();
    });
  });

  describe('getTableQueryPosition', () => {
    it('should return the table query position', () => {
      const tokens = [
        { type: tokenDictionary.SPACE, start: 0 },
        { type: tokenDictionary.FROM, start: 1 },
        { type: tokenDictionary.SPACE, start: 2 },
        { type: tokenDictionary.CLOSING_BRACKET, start: 3 },
        { type: tokenDictionary.SEMICOLON, start: 4 },
      ];
      const tokenStream = mockTokenStream(tokens);
      expect(getTableQueryPosition(tokenStream, 1, tokenDictionary)).toEqual({
        start: 1,
        end: 3,
        type: 'from',
        joinTableQueryPosition: undefined,
        selectTableQueryPosition: undefined,
      });
    });

    it('should return undefined if no FROM keyword is found', () => {
      const tokens = [
        { type: tokenDictionary.SPACE, start: 0 },
        { type: tokenDictionary.SPACE, start: 1 },
        { type: tokenDictionary.CLOSING_BRACKET, start: 2 },
      ];
      const tokenStream = mockTokenStream(tokens);
      expect(getTableQueryPosition(tokenStream, 1, tokenDictionary)).toBeUndefined();
    });
  });

  describe('getJoinIndex', () => {
    it('should return the index of the JOIN token', () => {
      const tokens = [
        { type: tokenDictionary.SPACE, start: 0 },
        { type: tokenDictionary.JOIN, start: 1, stop: 1 },
        { type: tokenDictionary.SPACE, start: 2 },
      ];
      const tokenStream = mockTokenStream(tokens);
      expect(getJoinIndex(tokenStream, 0, 3, tokenDictionary)).toEqual(2);
    });

    it('should return undefined if no JOIN token is found', () => {
      const tokens = [
        { type: tokenDictionary.SPACE, start: 0 },
        { type: tokenDictionary.SPACE, start: 1 },
      ];
      const tokenStream = mockTokenStream(tokens);
      expect(getJoinIndex(tokenStream, 0, 2, tokenDictionary)).toBeUndefined();
    });
  });

  describe('getPreviousToken', () => {
    it('should return the previous token of the specified type', () => {
      const tokens = [
        { type: tokenDictionary.SPACE, start: 0 },
        { type: tokenDictionary.SELECT, start: 1 },
        { type: tokenDictionary.SPACE, start: 2 },
      ];
      const tokenStream = mockTokenStream(tokens);
      expect(getPreviousToken(tokenStream, tokenDictionary, 2, tokenDictionary.SELECT)).toEqual(
        tokens[1]
      );
    });

    it('should return undefined if no previous token of the specified type is found', () => {
      const tokens = [
        { type: tokenDictionary.SPACE, start: 0 },
        { type: tokenDictionary.SPACE, start: 1 },
      ];
      const tokenStream = mockTokenStream(tokens);
      expect(
        getPreviousToken(tokenStream, tokenDictionary, 1, tokenDictionary.SELECT)
      ).toBeUndefined();
    });
  });
});
