/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BertWordPieceTokenizer } from './tokenizer';

export type SparseVector = Record<string, number>;

export interface Document {
  id: string;
  document: {
    text: string;
    vector: SparseVector;
  };
}

export interface SparseSearchData {
  vocab: Record<string, number>;
  idf: number[];
  special_tokens: number[];
  documents: Document[];
}

export class SparseSearch {
  private documents: Document[];
  private vocab: Record<string, number>;
  private idf: number[];
  private specialTokens: Set<number>;
  private docVectors: SparseVector[];

  constructor(data: SparseSearchData) {
    this.documents = data.documents;
    this.vocab = data.vocab;
    this.idf = data.idf;
    this.specialTokens = new Set(data.special_tokens);
    this.docVectors = this.documents.map((doc) => doc.document.vector);
  }

  private buildQueryVector(tokens: string[]): SparseVector {
    const vec: SparseVector = {};

    tokens.forEach((token) => {
      const tokenId = this.vocab[token];
      if (tokenId !== undefined && !this.specialTokens.has(tokenId)) {
        vec[tokenId] = this.idf[tokenId] || 1;
      }
    });

    return vec;
  }

  private calScore(queryVec: SparseVector, docVec: SparseVector): number {
    let score = 0;
    for (const dim of Object.keys(queryVec)) {
      if (docVec[dim] !== undefined) {
        score += queryVec[dim] * docVec[dim];
      }
    }
    return score;
  }

  public search(
    query: string,
    topK: number = 5
  ): Array<{
    id: string;
    text: string;
    score: number;
  }> {
    const nlpBertTokenizer = new BertWordPieceTokenizer({ vocabContent: Object.keys(this.vocab) });
    const tokenizedResult = nlpBertTokenizer.tokenizeSentence(query);
    const tokensArray = tokenizedResult.tokens;
    console.log('Tokenization: ', tokensArray);

    const queryVec = this.buildQueryVector(tokensArray);
    console.log('Non-zero query vector: ', queryVec);

    const results = this.documents.map((doc, idx) => {
      const score = this.calScore(queryVec, this.docVectors[idx]);
      return {
        id: doc.id,
        text: doc.document.text,
        score: score,
      };
    });

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .filter((result) => result.score !== 0);
  }
}
