/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// import { KnownFields } from './constants';
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
  private pplStartPatterns: RegExp[];
  private pplPipePatterns: RegExp[];
  private nlStarters: RegExp[];

  constructor() {
    this.pplStartPatterns = [
      /^\s*source\b/i, // Matches "source" as a standalone word
      /^\s*source\s*=/i, // Matches "source=" with optional spaces
      /^\s*from\s+\w+/i, // Matches "from <word>"
      /^\s*search\s+index\s*=/i, // Matches "search index="
    ];
    this.pplPipePatterns = [/\|\s*(where|filter|fields|sort|limit|stats|rename|eval)\b/i];
    this.nlStarters = [
      /^\s*(show|list|get|find|search|display|give|retrieve|fetch|tell)\b/i, // Common action verbs
      /^\s*(what|how|when|where|why|which|who)\b/i, // Question starters
      /^\s*(can|could|would|will|please|should|may|might|shall)\b/i, // Modal verbs
      /^\s*(explain|describe|summarize|analyze|compare|calculate)\b/i, // Analytical verbs
      /^\s*(is|are|was|were|do|does|did|has|have|had|am|be|being|been|the)\b/i, // Auxiliary verbs
    ];
  }

  detect(query: string): DetectionResult {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return {
        type: 'nl',
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

    // Reduce score if NL starters or general English words are detected
    if (this.nlStarters.some((p) => p.test(query))) {
      score -= 0.2;
      reasons.push('Contains natural language starter (e.g., show, what, can, if is)');
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

    const quotedKvPattern = /(\w+)\s*=\s*(['"])[^'"]*\2/g; // key="value" or key='value'
    const unquotedKvPattern = /(\w+)\s*=\s*[^"'\s]+/g; // key=value
    const booleanOpsPattern = /\b(and|or)\b/gi; // boolean operators
    const sourcePattern = /^\s*source\s*=\s*\S+/i; // source= at start

    const quotedMatches = [...query.matchAll(quotedKvPattern)];
    const unquotedMatches = [...query.matchAll(unquotedKvPattern)];
    const booleanMatches = [...query.matchAll(booleanOpsPattern)];
    const hasSourceStart = sourcePattern.test(query);

    // De-duplicate overlapping matches (quoted matches are subset of unquoted)
    const totalKvCount = new Set([
      ...quotedMatches.map((m) => m.index),
      ...unquotedMatches.map((m) => m.index),
    ]).size;

    if (totalKvCount > 0) {
      score += 0.4 + (totalKvCount - 1) * 0.1;
      reasons.push(`Detected ${totalKvCount} key=value pair(s)`);
    }

    if (booleanMatches.length > 0) {
      score += 0.2;
      reasons.push(
        `Contains boolean operator(s): ${[
          ...new Set(booleanMatches.map((m) => m[0].toLowerCase())),
        ].join(', ')}`
      );
    }

    if (hasSourceStart) {
      score += 0.1;
      reasons.push('Starts with source= pattern');
    }

    // Reduce score if NL starters or general English words are detected
    if (this.nlStarters.some((p) => p.test(query))) {
      score -= 0.2;
      reasons.push('Contains natural language starter (e.g., show, what, can)');
    }

    if (/\|/.test(query)) {
      warnings.push('Pipe character found; possibly mixed with PPL');
    }

    return {
      score,
      reason: reasons.join('; '),
      warnings,
    };
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
