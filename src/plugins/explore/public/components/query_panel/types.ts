export type Query = {
  query: string;
  prompt: string;
  language: string; // The language of the query (e.g., 'ppl', 'natural-language', etc.)
  dataset: string;
};
