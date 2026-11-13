/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { act, cleanup, render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  JsonTreeSettingsContext,
  JsonTree,
  extractHighlightTerms,
  parseJsonObjectOrArray,
} from './json_tree';

const renderTree = (raw: string, highlightTerms?: string[]) =>
  render(
    <JsonTree value={parseJsonObjectOrArray(raw)!} raw={raw} highlightTerms={highlightTerms} />
  );

const openStates = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('details'), (details) => details.open);

const rootSummary = (container: HTMLElement) =>
  container.querySelector('.exploreJsonTree > details > summary') as HTMLElement;

// jsdom fires toggle events on a timer and merges two on one element, so each click waits for its
// event the way separate user clicks would.
const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 10)));

const summaryFor = (container: HTMLElement, key: string) =>
  Array.from(container.querySelectorAll('summary')).find(
    (summary) => summary.querySelector('.exploreJsonTree__key')?.textContent === key
  ) as HTMLElement;

// An object nested `levels` deep, the root as level 1, where key `levelN` holds the branch at
// level N and `bottom` sits in the deepest one. Built as text, since JSON.stringify recurses once
// per level and can overflow a small call stack.
const chain = (levels: number) => {
  let raw = '{"bottom":"deep"}';
  for (let level = levels; level > 1; level--) raw = `{"level${level}":${raw}}`;
  return raw;
};

describe('parseJsonObjectOrArray', () => {
  it.each([
    ['a number', 1],
    ['an object', { a: 1 }],
    ['null', null],
    ['undefined', undefined],
    ['an empty string', ''],
    ['whitespace', '   '],
    ['a JSON number', '1'],
    ['a JSON string', '"x"'],
    ['a JSON boolean', 'true'],
    ['a JSON null', 'null'],
    ['invalid JSON', '{not json'],
    ['JSON after a text prefix', 'error: {"a":1}'],
    ['a log line starting with a bracket', '[INFO] started'],
    ['an empty object', '{}'],
    ['an empty array', '[]'],
  ])('returns undefined for %s', (_, value) => {
    expect(parseJsonObjectOrArray(value)).toBeUndefined();
  });

  it('parses a value nested 1,000 levels deep', () => {
    const nested = (levels: number) => '['.repeat(levels) + '"x"' + ']'.repeat(levels);
    expect(parseJsonObjectOrArray(nested(1000))).toBeDefined();
  });

  it('returns undefined for a value nested deeper than the parser can read', () => {
    const nested = (levels: number) => '['.repeat(levels) + '"x"' + ']'.repeat(levels);
    expect(parseJsonObjectOrArray(nested(100000))).toBeUndefined();
  });

  it.each([
    ['padded with whitespace', '  {"a":1}\n', { a: 1 }],
    ['an array', '[1,2]', [1, 2]],
    ['a nested value', '{"a":{"b":[1]}}', { a: { b: [1] } }],
  ])('parses a string %s', (_, value, expected) => {
    expect(parseJsonObjectOrArray(value)).toEqual(expected);
  });
});

describe('extractHighlightTerms', () => {
  it('decodes entities inside a mark', () => {
    expect(extractHighlightTerms('<mark>don&#39;t</mark> <mark>a&amp;b</mark>')).toEqual([
      "don't",
      'a&b',
    ]);
  });

  it('returns the unique texts the formatter wrapped in mark', () => {
    const html =
      '{&quot;a&quot;:&quot;<mark>err</mark>&quot;,&quot;<mark>err</mark>&quot;:<mark>5</mark>}';
    expect(extractHighlightTerms(html)).toEqual(['err', '5']);
  });

  it('returns nothing when the value has no mark', () => {
    expect(extractHighlightTerms('{"a":1}')).toEqual([]);
    expect(extractHighlightTerms(undefined)).toEqual([]);
  });
});

describe('JsonTree', () => {
  it('opens only the root in the data table', () => {
    const { container } = renderTree('{"l1":{"l2":{"l3":"v"}}}');
    expect(openStates(container)).toEqual([true, false]);
    expect(screen.queryByText('l2')).not.toBeInTheDocument();
  });

  it('opens and closes only the root from its toggle, keeping the branches inside', async () => {
    const { container } = renderTree('{"l1":{"l2":{"l3":"v"}}}');
    const root = rootSummary(container);
    fireEvent.click(summaryFor(container, 'l1'));
    await settle();

    fireEvent.click(root);
    expect(openStates(container)).toEqual([false, true, false]);

    fireEvent.click(root);
    expect(openStates(container)).toEqual([true, true, false]);
  });

  it('opens one nested branch on its own', () => {
    const { container } = renderTree('{"a":{"a1":1},"b":{"b1":2}}');

    fireEvent.click(summaryFor(container, 'a'));

    expect(openStates(container)).toEqual([true, true, false]);
  });

  it('mounts the entries of a closed branch only once it is first opened', async () => {
    const { container } = renderTree('{"a":{"a1":1},"b":{"b1":2}}');

    fireEvent.click(summaryFor(container, 'a'));

    await waitFor(() => expect(screen.getByText('a1')).toBeInTheDocument());
    expect(screen.queryByText('b1')).not.toBeInTheDocument();
  });

  it('draws a branch 50 entries at a time, with Show more for the rest', () => {
    const { container } = renderTree(JSON.stringify(Array.from({ length: 120 }, (_, i) => i)));
    const entries = () => container.querySelectorAll('.exploreJsonTree__children > div').length;
    expect(entries()).toBe(50);
    expect(container.querySelector('.exploreJsonTree__count')).toHaveTextContent('[120]');

    fireEvent.click(screen.getByText('Show 50 more'));
    expect(entries()).toBe(100);

    fireEvent.click(screen.getByText('Show 20 more'));
    expect(entries()).toBe(120);
    expect(screen.queryByText(/^Show \d+ more$/)).not.toBeInTheDocument();
  });

  it('draws exactly 50 entries with no Show more', () => {
    renderTree(JSON.stringify(Array.from({ length: 50 }, (_, i) => i)));
    expect(screen.queryByText(/^Show \d+ more$/)).not.toBeInTheDocument();
  });

  it('caps a nested branch at 50 entries too', () => {
    const raw = JSON.stringify({
      a: Object.fromEntries(Array.from({ length: 51 }, (_, i) => [`k${i}`, i])),
    });
    const { container } = render(
      <JsonTreeSettingsContext.Provider value={{ showJsonFormat: true, expandAllJson: true }}>
        <JsonTree value={parseJsonObjectOrArray(raw)!} raw={raw} />
      </JsonTreeSettingsContext.Provider>
    );
    expect(
      container.querySelectorAll('.exploreJsonTree__children .exploreJsonTree__children > div')
    ).toHaveLength(50);
    expect(screen.getByText('Show 1 more')).toBeInTheDocument();
  });

  it('sorts object keys by character code at every level, as Splunk does', () => {
    const raw =
      '{"statusCounts":{"500":3,"200":120,"404":7,"10":1,"9":2},"Zebra":1,' +
      '"apple":2,"banana":3,"10":"ten","2":"two","attr10":1,"attr2":2,"_hidden":0}';
    const { container } = render(
      <JsonTree value={parseJsonObjectOrArray(raw)!} raw={raw} inExpandedDocument />
    );
    expect(
      Array.from(container.querySelectorAll('.exploreJsonTree__key'), (key) => key.textContent)
    ).toEqual([
      '10',
      '2',
      'Zebra',
      '_hidden',
      'apple',
      'attr10',
      'attr2',
      'banana',
      'statusCounts',
      '10',
      '200',
      '404',
      '500',
      '9',
    ]);
  });

  it('keeps array elements in their logged order', () => {
    renderTree('["c","a","b"]');
    expect(screen.getAllByText(/^"[abc]"$/).map((leaf) => leaf.textContent)).toEqual([
      '"c"',
      '"a"',
      '"b"',
    ]);
  });

  it('keeps the index order of an array longer than ten', () => {
    const { container } = renderTree(JSON.stringify(Array.from({ length: 12 }, (_, i) => i)));
    expect(
      Array.from(container.querySelectorAll('.exploreJsonTree__number'), (leaf) => leaf.textContent)
    ).toEqual(Array.from({ length: 12 }, (_, i) => String(i)));
  });

  it('keeps the logged order in the raw view', () => {
    const raw = '{"b":1,"a":2}';
    const { container } = renderTree(raw);
    fireEvent.click(screen.getByText('Show as raw text'));
    expect(container.querySelector('.exploreJsonTree__raw')?.textContent).toBe(raw);
  });

  it('switches to the raw string and back', () => {
    const raw = '{ "a": [1, 2] }';
    const { container } = renderTree(raw);

    fireEvent.click(screen.getByText('Show as raw text'));
    expect(container.querySelector('.exploreJsonTree .exploreJsonTree__raw')?.textContent).toBe(
      raw
    );
    expect(container.querySelectorAll('details')).toHaveLength(0);

    fireEvent.click(screen.getByText('Show as formatted JSON'));
    expect(container.querySelectorAll('details')).toHaveLength(2);
    expect(screen.getByText('Show as raw text')).toBeInTheDocument();
  });

  it('labels each object and array with its size', () => {
    const raw = '{"obj":{"x":1,"y":2},"arr":[1,2,3],"e":{},"ea":[],"list":[{"k":1}]}';
    const { container } = render(
      <JsonTree value={parseJsonObjectOrArray(raw)!} raw={raw} inExpandedDocument />
    );
    const counts = Array.from(
      container.querySelectorAll('.exploreJsonTree__count'),
      (count) => count.textContent
    );
    // Keys sort, so arr, list and its element, then obj.
    expect(counts).toEqual(['{5}', '[3]', '[1]', '{1}', '{2}']);
  });

  it('shows empty objects and arrays as plain values', () => {
    const { container } = renderTree('{"e":{},"ea":[]}');
    expect(
      Array.from(
        container.querySelectorAll('.exploreJsonTree__children > div'),
        (d) => d.textContent
      )
    ).toEqual(['e: {}', 'ea: []']);
    expect(openStates(container)).toEqual([true]);
  });

  it('labels object keys and leaves array elements unlabelled', () => {
    const raw = '{"a":[1,{"b":2}]}';
    const { container } = render(
      <JsonTree value={parseJsonObjectOrArray(raw)!} raw={raw} inExpandedDocument />
    );
    expect(
      Array.from(container.querySelectorAll('.exploreJsonTree__key'), (key) => key.textContent)
    ).toEqual(['a', 'b']);
    expect(
      Array.from(container.querySelectorAll('summary'), (summary) => summary.textContent)
    ).toEqual(
      // The double spaces hold the toggle icon, which CSS draws.
      ['{  {1} }', 'a [2]: [  ]', '{  {1} }']
    );
    expect(
      Array.from(container.querySelectorAll('details > div:last-child'), (div) => div.textContent)
    ).toEqual(['}', ']', '}']);
  });

  it('keeps a branch the user opened open when its parent is closed and reopened', async () => {
    const { container } = renderTree('{"a":{"b":{"c":1}}}');
    fireEvent.click(summaryFor(container, 'a'));
    await settle();
    fireEvent.click(summaryFor(container, 'b'));
    await settle();
    fireEvent.click(summaryFor(container, 'a'));
    await settle();
    fireEvent.click(summaryFor(container, 'a'));
    await settle();
    expect(openStates(container)).toEqual([true, true, true]);
  });

  it('shows strings JSON-quoted and other values as text', () => {
    renderTree('{"q":"a\\"b","nl":"x\\ny","n":1.5,"t":true,"z":null}');
    expect(screen.getByText('"a\\"b"')).toBeInTheDocument();
    expect(screen.getByText('"x\\ny"')).toBeInTheDocument();
    expect(screen.getByText('1.5')).toBeInTheDocument();
    expect(screen.getByText('true')).toBeInTheDocument();
    expect(screen.getByText('null')).toBeInTheDocument();
  });

  it('keeps every digit of an integer past 2^53', () => {
    renderTree('{"id":12345678901234567890}');
    expect(screen.getByText('12345678901234567890')).toBeInTheDocument();
  });

  it('renders markup inside values as text', () => {
    const raw = '{"<b>k</b>":"<img src=x onerror=alert(1)>"}';
    const { container } = renderTree(raw);
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('b')).toBeNull();

    fireEvent.click(screen.getByText('Show as raw text'));
    expect(container.querySelector('img')).toBeNull();
  });

  it('marks the search terms anywhere in keys and values', () => {
    const { container } = renderTree('{"errorCode":1,"msg":"an error (x)"}', ['error', '(x)']);
    const marks = Array.from(container.querySelectorAll('mark'), (mark) => mark.textContent);
    expect(marks).toEqual(['error', 'error', '(x)']);
  });

  it('marks a CJK term inside a run of ideographs', () => {
    const { container } = renderTree('{"msg":"连接错误"}', ['错']);
    expect(Array.from(container.querySelectorAll('mark'), (mark) => mark.textContent)).toEqual([
      '错',
    ]);
  });

  it('marks numbers that match a search term', () => {
    const { container } = renderTree('{"status":500}', ['500']);
    expect(Array.from(container.querySelectorAll('mark'), (mark) => mark.textContent)).toEqual([
      '500',
    ]);
  });

  it('marks null when it matches a search term, as it opens the branch that holds it', () => {
    const { container } = renderTree('{"a":{"b":null}}', ['null']);
    expect(openStates(container)).toEqual([true, true]);
    expect(Array.from(container.querySelectorAll('mark'), (mark) => mark.textContent)).toEqual([
      'null',
    ]);
  });

  it('prefers the longer of two overlapping search terms', () => {
    const { container } = renderTree('{"city":"new york"}', ['new', 'new york']);
    expect(Array.from(container.querySelectorAll('mark'), (mark) => mark.textContent)).toEqual([
      'new york',
    ]);
  });

  it('marks the search terms in the raw view', () => {
    const { container } = renderTree('{"msg":"an error"}', ['error']);
    fireEvent.click(screen.getByText('Show as raw text'));
    expect(
      Array.from(
        container.querySelectorAll('.exploreJsonTree__raw mark'),
        (mark) => mark.textContent
      )
    ).toEqual(['error']);
  });

  it('opens a closed branch that holds a search match', () => {
    const { container } = renderTree('{"a":{"b":"deep"},"c":{"d":1}}', ['deep']);
    expect(openStates(container)).toEqual([true, true, false]);
    expect(container.querySelector('mark')).toHaveTextContent('deep');
  });

  it('opens the branch that holds a new search match on the same value', async () => {
    const raw = '{"a":{"b":"deep"},"c":{"d":"other"}}';
    const value = parseJsonObjectOrArray(raw)!;
    const { container, rerender } = render(
      <JsonTree value={value} raw={raw} highlightTerms={['deep']} />
    );
    expect(openStates(container)).toEqual([true, true, false]);

    rerender(<JsonTree value={value} raw={raw} highlightTerms={['other']} />);

    expect(openStates(container)).toEqual([true, false, true]);
    await settle();
    expect(container.querySelector('mark')).toHaveTextContent('other');
  });

  it('opens a closed branch whose match is a number', () => {
    const { container } = renderTree('{"http":{"status":500}}', ['500']);
    expect(openStates(container)).toEqual([true, true]);
  });

  it('opens a closed branch when one of several entries holds the match', () => {
    const { container } = renderTree('{"a":{"x":1,"b":"deep"},"c":["x","deep"]}', ['deep']);
    expect(openStates(container)).toEqual([true, true, true]);
  });

  it('opens a closed branch whose only match is a key, at level 3', () => {
    const { container } = renderTree('{"a":{"b":{"deep":1}},"c":{"d":1}}', ['deep']);
    expect(openStates(container)).toEqual([true, true, true, false]);
  });

  it('does not open an array for a term that only matches an index', () => {
    const { container } = renderTree('{"a":["x","y"]}', ['1']);
    expect(openStates(container)).toEqual([true, false]);
  });

  it('opens an array for a key that matches inside one of its objects', () => {
    const { container } = renderTree('{"a":[{"deep":1}]}', ['deep']);
    expect(openStates(container)).toEqual([true, true, true]);
  });

  it('does not open an object for a term that only matches the index of an array inside it', () => {
    const { container } = renderTree('{"a":{"b":["x","y"]}}', ['1']);
    expect(openStates(container)).toEqual([true, false]);
  });

  it('does not open a branch for a term that only matches how a nested branch prints as text', () => {
    const { container } = renderTree('{"a":{"b":{"c":1}}}', ['object']);
    expect(openStates(container)).toEqual([true, false]);
  });

  // A branch's own text, with each nested branch counted as {} or [], of a given length.
  const branchOfLength = (length: number) => ({ b: 'x'.repeat(length - 8) });

  it('opens each level of a tree of up to 15 levels in the expanded document, with a branch at exactly 1,000 characters', () => {
    const raw = JSON.stringify({ a: branchOfLength(1000) });
    const { container } = render(
      <JsonTree value={parseJsonObjectOrArray(raw)!} raw={raw} inExpandedDocument />
    );
    expect(openStates(container)).toEqual([true, true]);
  });

  it('keeps a branch closed in the expanded document when its own entries pass 1,000 characters', () => {
    const raw = JSON.stringify({ a: branchOfLength(1001) });
    const { container } = render(
      <JsonTree value={parseJsonObjectOrArray(raw)!} raw={raw} inExpandedDocument />
    );
    expect(openStates(container)).toEqual([true, false]);
  });

  it('closes only the branch that holds the long value, and opens the branches around it', () => {
    const raw = JSON.stringify({
      service: 'checkout',
      request: {
        method: 'POST',
        headers: { contentType: 'application/json', note: 'x'.repeat(1200) },
      },
    });
    const { container } = render(
      <JsonTree value={parseJsonObjectOrArray(raw)!} raw={raw} inExpandedDocument />
    );
    expect(openStates(container)).toEqual([true, true, false]);
    expect(summaryFor(container, 'headers').parentElement).toHaveProperty('open', false);
  });

  it('keeps a branch with many entries closed even when each one is short', () => {
    const raw = JSON.stringify({
      wide: Object.fromEntries(Array.from({ length: 200 }, (_, i) => [`k${i}`, i])),
    });
    const { container } = render(
      <JsonTree value={parseJsonObjectOrArray(raw)!} raw={raw} inExpandedDocument />
    );
    expect(openStates(container)).toEqual([true, false]);
  });

  it('opens a small branch on a search match, but not a branch past 1,000 characters', () => {
    const raw = JSON.stringify({
      request: { method: 'POST', headers: { note: 'deep ' + 'x'.repeat(1200) } },
    });
    const { container } = renderTree(raw, ['deep']);
    expect(openStates(container)).toEqual([true, true, false]);
  });

  // An object of entries keyed prefix00, prefix01 and so on, each holding what inner returns.
  const keyed = (prefix: string, count: number, inner: (i: number) => unknown) =>
    Object.fromEntries(
      Array.from({ length: count }, (_, i) => [`${prefix}${String(i).padStart(2, '0')}`, inner(i)])
    );
  const openKeys = (container: HTMLElement) =>
    Array.from(
      container.querySelectorAll('details[open] > summary > .exploreJsonTree__key'),
      (key) => key.textContent
    );
  const drawInExpandedDocument = (raw: string) =>
    render(<JsonTree value={parseJsonObjectOrArray(raw)!} raw={raw} inExpandedDocument />)
      .container;

  it('opens each level of a tree of up to 15 levels whose own entries fit, however many entries it draws', () => {
    const raw = JSON.stringify(keyed('k', 25, () => keyed('g', 25, () => keyed('l', 25, () => 1))));
    // The root, its 25 groups and their 625 groups.
    expect(openStates(drawInExpandedDocument(raw)).filter(Boolean)).toHaveLength(651);
  });

  it('opens the first page in key order in the expanded document, and the entries Show more adds', () => {
    const sorted = keyed('k', 60, () => ({ v: 1 }));
    const raw = JSON.stringify(Object.fromEntries(Object.entries(sorted).reverse()));
    const container = drawInExpandedDocument(raw);
    expect(openKeys(container)).toEqual(Object.keys(sorted).slice(0, 50));
    fireEvent.click(screen.getByText('Show 10 more'));
    expect(openKeys(container)).toEqual(Object.keys(sorted));
  });

  it('opens a small branch in the expanded document once the user opens the branch past 1,000 characters around it', async () => {
    const raw = JSON.stringify({ a: { inner: { b: 1 }, note: 'x'.repeat(1200) } });
    const container = drawInExpandedDocument(raw);
    expect(openStates(container)).toEqual([true, false]);
    fireEvent.click(summaryFor(container, 'a'));
    await settle();
    expect(openStates(container)).toEqual([true, true, true]);
  });

  it('opens a small branch on a search match once the user opens the branch past 1,000 characters around it', async () => {
    const { container } = renderTree(
      JSON.stringify({ a: { inner: { b: 'deep' }, note: 'deep ' + 'x'.repeat(1200) } }),
      ['deep']
    );
    expect(openStates(container)).toEqual([true, false]);
    fireEvent.click(summaryFor(container, 'a'));
    await settle();
    expect(openStates(container)).toEqual([true, true, true]);
  });

  it('opens a matching branch that Show more adds', () => {
    const raw = JSON.stringify(keyed('k', 60, (i) => ({ v: i === 55 ? 'deep' : 'x' })));
    const { container } = renderTree(raw, ['deep']);
    expect(openKeys(container)).toEqual([]);
    fireEvent.click(screen.getByText('Show 10 more'));
    expect(openKeys(container)).toEqual(['k55']);
  });

  it('opens the root in the expanded document even past 1,000 characters', () => {
    const raw = JSON.stringify({ a: { b: 1 }, note: 'x'.repeat(1200) });
    expect(openStates(drawInExpandedDocument(raw))).toEqual([true, true]);
  });

  it('opens the root in the data table even past 1,000 characters, with or without a search', () => {
    const raw = JSON.stringify({ a: { b: 1 }, message: 'x'.repeat(1200) });
    expect(openStates(renderTree(raw).container)).toEqual([true, false]);
    cleanup();
    expect(openStates(renderTree(raw, ['x']).container)).toEqual([true, false]);
  });

  it('opens a branch whose match sits past the first page of its entries', () => {
    const raw = JSON.stringify({ a: keyed('k', 60, (i) => (i === 55 ? 'deep' : 'x')) });
    expect(openStates(renderTree(raw, ['deep']).container)).toEqual([true, true]);
    cleanup();
    const array = JSON.stringify({
      a: Array.from({ length: 60 }, (_, i) => (i === 55 ? 'deep' : 'x')),
    });
    expect(openStates(renderTree(array, ['deep']).container)).toEqual([true, true]);
  });

  it('keeps a matching branch past 1,000 characters closed in the expanded document', () => {
    const raw = JSON.stringify({ a: { b: 'deep', note: 'x'.repeat(1200) } });
    const { container } = render(
      <JsonTree
        value={parseJsonObjectOrArray(raw)!}
        raw={raw}
        highlightTerms={['deep']}
        inExpandedDocument
      />
    );
    expect(openStates(container)).toEqual([true, false]);
  });

  it('opens every branch that fits in a tree of up to 15 levels in the expanded document while a search is on', () => {
    const raw = '{"a":{"b":"deep"},"c":{"d":1}}';
    const { container } = render(
      <JsonTree
        value={parseJsonObjectOrArray(raw)!}
        raw={raw}
        highlightTerms={['deep']}
        inExpandedDocument
      />
    );
    expect(openStates(container)).toEqual([true, true, true]);
  });

  it('opens 15 levels by itself in the expanded document, and a click opens the next level', async () => {
    const container = drawInExpandedDocument(chain(20));
    expect(openStates(container)).toEqual([...Array(15).fill(true), false]);
    fireEvent.click(summaryFor(container, 'level16'));
    await settle();
    expect(openStates(container)).toEqual([...Array(16).fill(true), false]);
  });

  it('opens 15 levels by itself toward a search match inside the branch at level 20', () => {
    const { container } = renderTree(chain(20), ['deep']);
    expect(openStates(container)).toEqual([...Array(15).fill(true), false]);
  });

  it('opens 15 levels by itself toward a search match at the bottom of 3,000 levels without overflowing the call stack', () => {
    // Plain JSON.parse, since @osd/std parse throws before 3,000 levels in node.
    const raw = chain(3000);
    const { container } = render(
      <JsonTree value={JSON.parse(raw)} raw={raw} highlightTerms={['deep']} />
    );
    expect(openStates(container)).toEqual([...Array(15).fill(true), false]);
  });

  // Each case gives the raw branch and the text the rule counts, at a given length.
  it.each([
    ['an array, whose indexes are not counted', (n: number) => `["${'x'.repeat(n - 4)}"]`],
    ['a key that needs escaping', (n: number) => `{"q\\"":"${'x'.repeat(n - 10)}"}`],
  ])('opens %s at exactly 1,000 characters and not at 1,001', (_, branchOfText) => {
    for (const [length, opens] of [
      [1000, true],
      [1001, false],
    ] as const) {
      expect(branchOfText(length)).toHaveLength(length);
      expect(openStates(drawInExpandedDocument(`{"a":${branchOfText(length)}}`))[1]).toBe(opens);
      cleanup();
    }
  });

  it('counts a nested branch as {} at the 1,000-character limit', () => {
    // Counted as {"b":"x...","c":{}}, which is 15 characters past the run of x.
    const branch = (length: number) => `{"b":"${'x'.repeat(length - 15)}","c":{"d":1}}`;
    expect(openStates(drawInExpandedDocument(`{"a":${branch(1000)}}`))[1]).toBe(true);
    cleanup();
    expect(openStates(drawInExpandedDocument(`{"a":${branch(1001)}}`))[1]).toBe(false);
  });

  it('carries the test subject the caller passes', () => {
    render(<JsonTree value={{ a: 1 }} raw='{"a":1}' data-test-subj="callerSubject" />);
    expect(screen.getByTestId('callerSubject')).toBeInTheDocument();
  });
});

describe('JsonTree with Expand all on in Table settings', () => {
  // useJsonTreeValue parses once per raw string, so the tests that flip the switch reuse one value,
  // as a table cell does.
  const withSettings = (
    expandAllJson: boolean,
    raw: string,
    value = parseJsonObjectOrArray(raw)!
  ) => (
    <JsonTreeSettingsContext.Provider value={{ showJsonFormat: true, expandAllJson }}>
      <JsonTree value={value} raw={raw} />
    </JsonTreeSettingsContext.Provider>
  );
  const renderWithExpandAll = (raw: string) => render(withSettings(true, raw));

  it('opens each level of a tree of up to 15 levels in the data table', () => {
    const { container } = renderWithExpandAll('{"l1":{"l2":{"l3":"v"}}}');
    expect(openStates(container)).toEqual([true, true, true]);
  });

  it('opens and closes each level of a tree of up to 15 levels when the switch flips on a tree already on screen', async () => {
    const raw = '{"l1":{"l2":{"l3":"v"}}}';
    const value = parseJsonObjectOrArray(raw)!;
    const { container, rerender } = render(withSettings(false, raw, value));
    expect(openStates(container)).toEqual([true, false]);

    rerender(withSettings(true, raw, value));
    await settle();
    expect(openStates(container)).toEqual([true, true, true]);

    rerender(withSettings(false, raw, value));
    await settle();
    expect(openStates(container)).toEqual([true, false]);
  });

  it('opens 15 levels by itself in the data table', () => {
    const { container } = renderWithExpandAll(chain(20));
    expect(openStates(container)).toEqual([...Array(15).fill(true), false]);
  });

  it('opens the root after the user closed it', async () => {
    const raw = '{"l1":{"l2":1}}';
    const value = parseJsonObjectOrArray(raw)!;
    const { container, rerender } = render(withSettings(false, raw, value));
    fireEvent.click(rootSummary(container));
    await settle();
    expect(rootSummary(container).parentElement).toHaveProperty('open', false);

    rerender(withSettings(true, raw, value));
    await settle();

    expect(openStates(container)).toEqual([true, true]);
  });

  it('opens every branch that fits in a tree of up to 15 levels while a search is on', () => {
    const raw = '{"a":{"b":"deep"},"c":{"d":1}}';
    const { container } = render(
      <JsonTreeSettingsContext.Provider value={{ showJsonFormat: true, expandAllJson: true }}>
        <JsonTree value={parseJsonObjectOrArray(raw)!} raw={raw} highlightTerms={['deep']} />
      </JsonTreeSettingsContext.Provider>
    );
    expect(openStates(container)).toEqual([true, true, true]);
  });
});
