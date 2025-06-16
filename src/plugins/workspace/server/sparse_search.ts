/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BertWordPieceTokenizer } from '@nlpjs/bert-tokenizer';

export interface Document {
  id: string;
  title: {
    text: string;
    vector: Array<Number>;
  };
  description: {
    text: string;
    vector: Array<Number>;
  };
  document: {
    text: string;
    vector: Array<Number>;
  };
}

export interface SparseSearchData {
  vocab: Record<string, number>;
  idf: number[];
  special_tokens: number[];
  documents: any;
}

export class SparseSearch {
  private documents: Document[];
  private vocab: Record<string, number>;
  private idf: number[];
  private specialTokens: Set<number>;
  private titleVectors: number[][];
  private descVectors: number[][];
  private docVectors: number[][];

  constructor(data: SparseSearchData) {
    this.documents = data.documents;
    this.vocab = data.vocab;
    this.idf = data.idf;
    this.specialTokens = new Set(data.special_tokens);

    this.titleVectors = this.documents.map((doc) =>
      this.createVector(doc.title.vector, this.idf.length)
    );
    this.descVectors = this.documents.map((doc) =>
      this.createVector(doc.description.vector, this.idf.length)
    );
    this.docVectors = this.documents.map((doc) =>
      this.createVector(doc.document.vector, this.idf.length)
    );
  }

  private createVector(sparseVector: Array<Number>, length: number): number[] {
    const vec = new Array(length).fill(0);
    for (const [dim, val] of Object.entries(sparseVector)) {
      vec[parseInt(dim)] = val;
    }
    return vec;
  }

  private buildQueryVector(tokens: string[]): number[] {
    const vec = new Array(this.idf.length).fill(0);

    tokens.forEach((token) => {
      const tokenId = this.vocab[token];
      if (tokenId !== undefined && !this.specialTokens.has(tokenId)) {
        vec[tokenId] = this.idf[tokenId] || 1;
      }
    });

    return vec;
  }

  private similarity(queryVec: number[], docVec: number[]): number {
    let score = 0;
    for (let i = 0; i < queryVec.length; i++) {
      score += queryVec[i] * docVec[i];
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
    titleScore: number;
    descScore: number;
  }> {
    const nlpBertTokenizer = new BertWordPieceTokenizer({ vocabContent: Object.keys(this.vocab) });
    const tokenizedResult = nlpBertTokenizer.tokenizeSentence(query);
    const tokensArray = tokenizedResult.tokens;
    console.log('Tokenization: ', tokensArray);

    const queryVec = this.buildQueryVector(tokensArray);
    const nonZeroValues = queryVec.filter((value) => value !== 0);
    console.log('Non-zero values count: ', nonZeroValues.length);
    console.log('Non-zero values: ', nonZeroValues);

    const results = this.documents.map((doc, idx) => {
      const titleScore = this.similarity(queryVec, this.titleVectors[idx]);
      const descScore = this.similarity(queryVec, this.descVectors[idx]);
      const score = this.similarity(queryVec, this.docVectors[idx]);
      return {
        id: doc.id,
        text: `${doc.title.text}: ${doc.description.text}`,
        score: score,
        titleScore,
        descScore,
      };
    });

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .filter((result) => result.score !== 0);
  }
}
