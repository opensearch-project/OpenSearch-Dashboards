# Task: Integrate SQL Language into Explore Plugin

## Goal
Add SQL language support to the Explore plugin (logs and traces flavors) so users can switch to SQL and get autocomplete, just like PPL.

## Key Findings
- SQL language is already registered in `query_enhancements/public/plugin.tsx` but only for `discover` and `data-explorer`
- SQL autocomplete provider is already registered in `data/public/plugin.ts` via `addQuerySuggestionProvider('SQL', getSQLSuggestions)`
- The fix is to add `'explore'` and `'agentTraces'` to SQL's `supportedAppNames` and `editorSupportedAppNames`

## Phases

### Phase 1: Update SQL language config [status: not_started]
- Add `'explore'` and `'agentTraces'` to `editorSupportedAppNames`
- Add `'explore'`, `'agentTraces'`, `'dataset_management'` to `supportedAppNames`

### Phase 2: Verify server is running and test in browser [status: not_started]
- Start server on port 5605
- Navigate to explore page
- Verify SQL language is available in language switcher
- Verify SQL autocomplete works

## Files to Modify
- `src/plugins/query_enhancements/public/plugin.tsx`
