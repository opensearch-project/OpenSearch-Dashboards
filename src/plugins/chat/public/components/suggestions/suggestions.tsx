/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { Suggestion, SuggestionProps } from './suggestion';
import './suggestions.scss';

export interface SuggestionsProps {
  suggestions: SuggestionProps[];
  onSuggestionClick: (message: string) => void;
}

export const Suggestions = ({ suggestions, onSuggestionClick }: SuggestionsProps) => {
  return (
    <div className="chatSuggestions">
      {suggestions.map((suggestion, index) => (
        <Suggestion
          key={index}
          title={suggestion.title}
          message={suggestion.message}
          partial={suggestion.partial}
          className={suggestion.className}
          onClick={() => onSuggestionClick(suggestion.message)}
        />
      ))}
    </div>
  );
};
