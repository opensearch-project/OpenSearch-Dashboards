# VisIndexPatternSelector Plugin
`VisIndexPatternSelector` can be used by plugins to enable index pattern switching by users. To remove the burden from
individual plugins, `VisIndexPatternSelector` interfaces with necessary APIs to fetch a list of index patterns and then
provides users with a searchable list.

## Usage
`<VisIndexPatternSelector />` accepts two properties:
1. `indexPattern` which is an [`IndexPattern`](../data/common/index_patterns/index_patterns/index_pattern.ts)
2. `onChange` handler function

```tsx
import { VisIndexPatternSelector } from '../../vis_index_pattern_selector/public';


<VisIndexPatternSelector
  selectedIndexPattern={indexPattern}
  onChange={onChangeHandler}
/>
```