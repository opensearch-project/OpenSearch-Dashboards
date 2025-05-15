/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { KnownFields } from './constants';
import { LanguageType } from '../../components/editor_stack/shared';

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

export class QueryTypeDetector {
  private knownFields: Set<string>;
  private pplStartPatterns: RegExp[];
  private pplPipePatterns: RegExp[];
  private kvPatterns: RegExp[];
  private nlStarters: RegExp[];

  constructor() {
    this.knownFields = new Set(KnownFields.map((f) => f.toLowerCase()));

    this.pplStartPatterns = [/^\s*source\s*=/i, /^\s*from\s+\w+/i, /^\s*search\s+index\s*=/i];
    this.pplPipePatterns = [/\|\s*(where|filter|fields|sort|limit|stats|rename|eval)\b/i];
    this.kvPatterns = [/(\w+)\s*=\s*("[^"]+"|'[^']+'|\S+)/g, /\b(and|or)\b/i];
    this.nlStarters = [
      /^\s*(show|list|get|find|search|display|give|retrieve|fetch|tell)\b/i,
      /^\s*(what|how|when|where|why|which|who)\b/i,
      /^\s*(can|could|would|will|please)\b/i,
    ];
  }

  detect(query: string): DetectionResult {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return {
        type: 'ppl',
        confidence: 0,
        reason: 'Empty query',
        warnings: ['No input provided'],
      };
    }

    const scores: Record<'ppl' | 'kv' | 'nl', ScoreResult> = {
      ppl: this._checkPpl(trimmedQuery),
      kv: this._checkKeyValue(trimmedQuery),
      nl: this._checkNaturalLanguage(trimmedQuery),
    };

    const sorted = (Object.keys(scores) as Array<keyof typeof scores>).sort(
      (a, b) => scores[b].score - scores[a].score
    );
    const best = sorted[0];
    const fallback = scores[best].score < 0.4 ? 'nl' : best;

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

    if (this.pplStartPatterns.some((p) => p.test(query))) {
      score += 0.5;
      reasons.push('Starts with PPL pattern (e.g., source=, from, search)');
    }

    if (query.includes('|')) {
      score += 0.2;
      reasons.push("Contains pipe character '|'");
    }

    if (this.pplPipePatterns.some((p) => p.test(query))) {
      score += 0.1;
      reasons.push('Has known PPL pipe commands');
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

    const kvMatches = [...query.matchAll(this.kvPatterns[0])];
    const booleanOps = this.kvPatterns[1].test(query);

    if (kvMatches.length > 0) {
      score += 0.3 + (kvMatches.length - 1) * 0.1;
      reasons.push(`Found ${kvMatches.length} key=value pairs`);

      const knownMatches = kvMatches.filter((match) => {
        const key = match[1];
        return this.knownFields.has(key.toLowerCase());
      });

      if (knownMatches.length > 0) {
        score += 0.1;
        reasons.push('Matched known field(s): ' + knownMatches.map((m) => m[1]).join(', '));
      }
    }

    if (booleanOps) {
      score += 0.1;
      reasons.push('Uses boolean operators (and/or)');
    }

    if (/\b(show|list|get)\b/i.test(query)) {
      score -= 0.1;
      warnings.push('May be mixed with natural language');
    }

    return { score, reason: reasons.join('; '), warnings };
  }

  private _checkNaturalLanguage(query: string): ScoreResult {
    let score = 0;
    const reasons: string[] = [];
    const warnings: string[] = [];

    if (this.nlStarters.some((p) => p.test(query))) {
      score += 0.4;
      reasons.push('Starts with natural language pattern (e.g., show, what, can)');
    }

    const wordCount = query.split(/\s+/).length;
    if (wordCount > 5) {
      score += 0.1;
      reasons.push('Long query with multiple words');
    }

    if (/[?]/.test(query)) {
      score += 0.1;
      reasons.push('Contains a question mark');
    }

    if (!query.includes('|') && !query.includes('=')) {
      score += 0.2;
      reasons.push('No PPL or key=value syntax present');
    }

    return { score, reason: reasons.join('; '), warnings };
  }
}
