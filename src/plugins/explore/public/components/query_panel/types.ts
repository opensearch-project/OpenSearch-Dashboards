import { LanguageType } from './components/editor_stack/shared';

export type Query = {
  query: string;
  prompt: string;
  language: LanguageType; // The language of the query (e.g., 'ppl', 'natural-language', etc.)
  dataset: string;
};
