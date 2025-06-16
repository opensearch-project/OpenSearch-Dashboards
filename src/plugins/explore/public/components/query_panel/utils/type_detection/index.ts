/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { LanguageType } from '../../types';
import { PatternUtils, MAX_QUERY_LENGTH } from './constants';

export interface DetectionResult {
  type: LanguageType;
  confidence: number;
  reason: string;
  warnings: string[];
}

interface ScoreResult {
  score: number;
  reason: string;
  warnings: string[];
}

// TODO: Add localication for reason if facing user ui, currently only for internal use.

export class QueryTypeDetector {
  detect(query: string): DetectionResult {
    // Security: Validate and normalize input
    if (!query || typeof query !== 'string') {
      return {
        type: LanguageType.Natural,
        confidence: 0,
        reason: 'Invalid query input',
        warnings: ['No valid input provided'],
      };
    }

    if (query.length > MAX_QUERY_LENGTH) {
      return {
        type: LanguageType.Natural,
        confidence: 0,
        reason: 'Query too long',
        warnings: [`Query exceeds maximum length of ${MAX_QUERY_LENGTH} characters`],
      };
    }

    const normalizedQuery = PatternUtils.normalizeQuery(query);
    if (!normalizedQuery) {
      return {
        type: LanguageType.Natural,
        confidence: 0,
        reason: 'Empty query after normalization',
        warnings: ['No meaningful content after processing'],
      };
    }

    const scores: Record<LanguageType, ScoreResult> = {
      ppl: this._checkPpl(normalizedQuery),
      keyvalue: this._checkKeyValue(normalizedQuery),
      natural: this._checkNaturalLanguage(normalizedQuery),
    };

    const sorted = (Object.keys(scores) as Array<keyof typeof scores>).sort(
      (a, b) => scores[b].score - scores[a].score
    );
    const best = sorted[0];
    const fallback = scores[best].score < 0.4 ? LanguageType.Natural : best;

    return {
      type: fallback,
      confidence: scores[best].score,
      reason: scores[best].reason,
      warnings: scores[best].warnings,
    };
  }

  private _checkPpl(query: string): ScoreResult {
    let score = 0;
    const reasons: string[] = [];
    const warnings: string[] = [];

    const tokens = PatternUtils.tokenize(query);
    if (tokens.length === 0) {
      return { score: 0, reason: 'No tokens found', warnings: ['Empty tokenized query'] };
    }

    const firstToken = tokens[0];

    // Check PPL start patterns (safe token matching)
    if (PatternUtils.isPplStart(firstToken)) {
      score += 0.5;
      reasons.push(`Starts with PPL keyword: ${firstToken}`);
    }

    // Check for pipe character (simple string search)
    if (query.includes('|')) {
      score += 0.2;
      reasons.push("Contains pipe character '|'");

      // Check for PPL pipe commands after pipe
      if (PatternUtils.hasPplPipeCommand(tokens)) {
        score += 0.1;
        reasons.push('Has known PPL pipe commands');
      }
    }

    // Penalize if starts with natural language
    if (PatternUtils.isNaturalLanguageStart(firstToken)) {
      score -= 0.2;
      reasons.push(`Contains natural language starter: ${firstToken}`);
    }

    if (score > 0 && score < 0.3) {
      warnings.push('Low PPL score; may be ambiguous');
    }

    return { score, reason: reasons.join('; '), warnings };
  }

  private _checkKeyValue(query: string): ScoreResult {
    let score = 0;
    const reasons: string[] = [];
    const warnings: string[] = [];

    // Parse key-value pairs safely
    const kvPairs = PatternUtils.parseKeyValuePairs(query);
    const booleanOpCount = PatternUtils.countBooleanOperators(query);

    const tokens = PatternUtils.tokenize(query);
    const firstToken = tokens.length > 0 ? tokens[0] : '';

    if (kvPairs.length > 0) {
      score += 0.4 + (kvPairs.length - 1) * 0.1;
      reasons.push(`Detected ${kvPairs.length} key=value pair(s)`);
    }

    if (booleanOpCount > 0) {
      score += 0.2;
      reasons.push(`Contains ${booleanOpCount} boolean operator(s)`);
    }

    // Check for source= pattern at start
    if (firstToken.toLowerCase().startsWith('source=')) {
      score += 0.1;
      reasons.push('Starts with source= pattern');
    }

    // Penalize if starts with natural language
    if (PatternUtils.isNaturalLanguageStart(firstToken)) {
      score -= 0.2;
      reasons.push(`Contains natural language starter: ${firstToken}`);
    }

    // Warning for mixed syntax
    if (query.includes('|')) {
      warnings.push('Pipe character found; possibly mixed with PPL');
    }

    return { score, reason: reasons.join('; '), warnings };
  }

  private _checkNaturalLanguage(query: string): ScoreResult {
    let score = 0;
    const reasons: string[] = [];
    const warnings: string[] = [];

    const tokens = PatternUtils.tokenize(query);
    if (tokens.length === 0) {
      return { score: 0, reason: 'No tokens found', warnings: ['Empty tokenized query'] };
    }

    const firstToken = tokens[0];

    // Check natural language starters (safe token matching)
    if (PatternUtils.isNaturalLanguageStart(firstToken)) {
      score += 0.4;
      reasons.push(`Starts with natural language pattern: ${firstToken}`);
    }

    // Word count scoring
    if (tokens.length > 5) {
      score += 0.1;
      reasons.push(`Long query with ${tokens.length} words`);
    }

    // Question mark check (simple string search)
    if (query.includes('?')) {
      score += 0.1;
      reasons.push('Contains a question mark');
    }

    // Absence of structured syntax
    if (!query.includes('|') && !query.includes('=')) {
      score += 0.2;
      reasons.push('No PPL or key=value syntax present');
    }

    return { score, reason: reasons.join('; '), warnings };
  }
}
