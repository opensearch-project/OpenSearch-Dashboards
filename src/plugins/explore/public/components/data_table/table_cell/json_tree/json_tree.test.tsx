/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { copyToClipboard } from '@elastic/eui';
import { JsonTree } from './json_tree';
import { collapseAllJsonTrees, expandAllJsonTrees } from './json_tree_state';

jest.mock('@elastic/eui', () => ({
  ...jest.requireActual('@elastic/eui'),
  copyToClipboard: jest.fn(),
}));

beforeEach(() => {
  // Resets the shared tree state (stored choices and "expand all").
  act(() => collapseAllJsonTrees());
  (copyToClipboard as jest.Mock).mockClear();
});

describe('JsonTree state, copy and highlighting', () => {
  const value = { id: 1, user: { name: 'Ada' }, list: [{ sku: 'A1' }] };

  it('remembers expanded nodes and raw mode across re-mounts when given a stateKey', () => {
    const first = render(<JsonTree value={value} rawText="RAW" stateKey="doc1/payload" />);
    fireEvent.click(screen.getAllByTestId('jsonTreeToggle')[1]); // expand `user`
    expect(screen.getByText('"Ada"')).toBeInTheDocument();
    first.unmount();

    const second = render(<JsonTree value={value} rawText="RAW" stateKey="doc1/payload" />);
    expect(screen.getByText('"Ada"')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('jsonTreeRawToggle'));
    second.unmount();

    render(<JsonTree value={value} rawText="RAW" stateKey="doc1/payload" />);
    expect(screen.getByTestId('exploreJsonTreeRaw')).toHaveTextContent('RAW');
  });

  it('keeps separate state per stateKey', () => {
    const first = render(<JsonTree value={value} rawText="" stateKey="doc1/payload" />);
    fireEvent.click(screen.getAllByTestId('jsonTreeToggle')[1]);
    first.unmount();
    render(<JsonTree value={value} rawText="" stateKey="doc2/payload" />);
    expect(screen.queryByText('"Ada"')).not.toBeInTheDocument();
  });

  it('expands and collapses every tree on expand all / collapse all', () => {
    render(<JsonTree value={value} rawText="" stateKey="doc1/payload" />);
    render(<JsonTree value={{ other: { deep: 'x' } }} rawText="" />);
    expect(screen.queryByText('"Ada"')).not.toBeInTheDocument();

    act(() => expandAllJsonTrees());
    expect(screen.getByText('"Ada"')).toBeInTheDocument();
    expect(screen.getByText('"A1"')).toBeInTheDocument();
    expect(screen.getByText('"x"')).toBeInTheDocument();

    act(() => collapseAllJsonTrees());
    expect(screen.queryByText('"Ada"')).not.toBeInTheDocument();
    expect(screen.queryByText('"x"')).not.toBeInTheDocument();
    // root fields stay visible
    expect(screen.getByText('user')).toBeInTheDocument();
  });

  it('copies the pretty-printed JSON from the copy action of the root line', () => {
    render(<JsonTree value={{ a: 1 }} rawText='{"a":1}' />);
    const copy = screen.getByTestId('jsonTreeCopyJson');
    expect(copy).toHaveAttribute('aria-label', 'Copy JSON');
    // it sits on the root line, next to the toggle
    expect(copy.closest('.exploreJsonTree__line')).toContainElement(
      screen.getAllByTestId('jsonTreeToggle')[0]
    );
    fireEvent.click(copy);
    expect(copyToClipboard).toHaveBeenCalledWith('{\n  "a": 1\n}');
  });

  it('does not print the size of a collapsed node, but shows it as the toggle tooltip', () => {
    render(<JsonTree value={{ user: { name: 'Ada', id: 1 }, list: [1, 2, 3] }} rawText="" />);
    expect(screen.queryByText(/2 keys/)).not.toBeInTheDocument();
    expect(screen.queryByText(/3 items/)).not.toBeInTheDocument();
    const [root, user, list] = screen.getAllByTestId('jsonTreeToggle');
    expect(root).not.toHaveAttribute('title');
    expect(user).toHaveAttribute('title', '2 keys');
    expect(list).toHaveAttribute('title', '3 items');
  });

  it('copies the full path of a line, including array indices', () => {
    render(<JsonTree value={value} rawText="" />);
    act(() => expandAllJsonTrees());
    const copyButtons = screen.getAllByTestId('jsonTreeCopyPath');
    fireEvent.click(copyButtons[copyButtons.length - 1]); // the `sku` leaf
    expect(copyToClipboard).toHaveBeenCalledWith('list[0].sku');
    fireEvent.click(copyButtons[0]); // `id`
    expect(copyToClipboard).toHaveBeenLastCalledWith('id');
  });

  it('highlights search terms and expands the nodes that contain them', () => {
    const { container } = render(
      <JsonTree
        value={{ user: { name: 'Ada Lovelace' }, other: { name: 'Bob' } }}
        rawText=""
        highlightTerms={['Lovelace']}
      />
    );
    const marks = container.querySelectorAll('mark');
    expect(marks).toHaveLength(1);
    expect(marks[0]).toHaveTextContent('Lovelace');
    // the branch without a match stays collapsed
    expect(screen.queryByText('"Bob"')).not.toBeInTheDocument();
  });
});

describe('JsonTree accessibility', () => {
  const value = { id: 1, user: { name: 'Ada' }, ok: true };
  const item = (name: string | RegExp) => screen.getByRole('treeitem', { name });

  it('exposes an ARIA tree with levels and expanded state', () => {
    render(<JsonTree value={value} rawText="" />);
    expect(screen.getByRole('tree', { name: 'JSON value' })).toBeInTheDocument();
    const root = item('object, 3 keys');
    expect(root).toHaveAttribute('aria-level', '1');
    expect(root).toHaveAttribute('aria-expanded', 'true');
    const user = item('user object, 1 keys');
    expect(user).toHaveAttribute('aria-level', '2');
    expect(user).toHaveAttribute('aria-expanded', 'false');
    // leaves have no expanded state
    expect(item(/^id: 1/)).not.toHaveAttribute('aria-expanded');
  });

  it('has a single tab stop that follows focus', () => {
    render(<JsonTree value={value} rawText="" />);
    const tabStops = () =>
      screen.getAllByRole('treeitem').filter((el) => el.getAttribute('tabindex') === '0');
    expect(tabStops()).toEqual([item('object, 3 keys')]);
    act(() => item(/^id: 1/).focus());
    expect(tabStops()).toEqual([item(/^id: 1/)]);
    // the toggle buttons are not separate tab stops
    screen.getAllByTestId('jsonTreeToggle').forEach((toggle) => {
      expect(toggle).toHaveAttribute('tabindex', '-1');
    });
  });

  it('moves between items with the arrow, Home and End keys', () => {
    render(<JsonTree value={value} rawText="" />);
    const root = item('object, 3 keys');
    act(() => root.focus());
    fireEvent.keyDown(root, { key: 'ArrowDown' });
    expect(item(/^id: 1/)).toHaveFocus();
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' });
    expect(item('user object, 1 keys')).toHaveFocus();
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowUp' });
    expect(item(/^id: 1/)).toHaveFocus();
    fireEvent.keyDown(document.activeElement!, { key: 'End' });
    expect(item(/^ok: true/)).toHaveFocus();
    fireEvent.keyDown(document.activeElement!, { key: 'Home' });
    expect(root).toHaveFocus();
  });

  it('expands and collapses with the right/left arrows and Enter', () => {
    render(<JsonTree value={value} rawText="" />);
    const user = item('user object, 1 keys');
    act(() => user.focus());

    fireEvent.keyDown(user, { key: 'ArrowRight' }); // expand
    expect(item('user object, 1 keys')).toHaveAttribute('aria-expanded', 'true');
    expect(item('user object, 1 keys')).toHaveFocus();

    fireEvent.keyDown(document.activeElement!, { key: 'ArrowRight' }); // into first child
    expect(item(/^name: "Ada"/)).toHaveFocus();

    fireEvent.keyDown(document.activeElement!, { key: 'ArrowLeft' }); // back to the parent
    expect(item('user object, 1 keys')).toHaveFocus();

    fireEvent.keyDown(document.activeElement!, { key: 'ArrowLeft' }); // collapse
    expect(item('user object, 1 keys')).toHaveAttribute('aria-expanded', 'false');

    fireEvent.keyDown(document.activeElement!, { key: 'Enter' }); // toggle
    expect(item('user object, 1 keys')).toHaveAttribute('aria-expanded', 'true');
    fireEvent.keyDown(document.activeElement!, { key: ' ' });
    expect(item('user object, 1 keys')).toHaveAttribute('aria-expanded', 'false');
  });

  it('keeps a tab stop when the focused item is hidden by collapsing an ancestor', () => {
    render(<JsonTree value={value} rawText="" />);
    fireEvent.click(screen.getAllByTestId('jsonTreeToggle')[1]); // expand `user`
    act(() => item(/^name: "Ada"/).focus());
    fireEvent.click(screen.getAllByTestId('jsonTreeToggle')[1]); // collapse `user`
    expect(item('user object, 1 keys')).toHaveAttribute('tabindex', '0');
  });

  it('leaves keys pressed on a button inside an item alone', () => {
    render(<JsonTree value={value} rawText="" />);
    const copy = screen.getAllByTestId('jsonTreeCopyPath')[0];
    act(() => copy.focus());
    fireEvent.keyDown(copy, { key: 'ArrowDown' });
    expect(copy).toHaveFocus();
  });
});

describe('JsonTree large values', () => {
  it('renders children in batches of 50 behind "show more"', () => {
    const big = Object.fromEntries(Array.from({ length: 120 }, (_, i) => [`k${i}`, i]));
    render(<JsonTree value={big} rawText="" />);
    expect(screen.getByText('k49')).toBeInTheDocument();
    expect(screen.queryByText('k50')).not.toBeInTheDocument();
    expect(screen.getByTestId('jsonTreeShowMore')).toHaveTextContent('Show 50 more (70 hidden)');

    fireEvent.click(screen.getByTestId('jsonTreeShowMore'));
    expect(screen.getByText('k99')).toBeInTheDocument();
    expect(screen.queryByText('k100')).not.toBeInTheDocument();
    expect(screen.getByTestId('jsonTreeShowMore')).toHaveTextContent('Show 20 more (20 hidden)');

    fireEvent.click(screen.getByTestId('jsonTreeShowMore'));
    expect(screen.getByText('k119')).toBeInTheDocument();
    expect(screen.queryByTestId('jsonTreeShowMore')).not.toBeInTheDocument();
  });

  it('caps each node separately when everything is expanded', () => {
    const value = { list: Array.from({ length: 60 }, (_, i) => `v${i}`) };
    render(<JsonTree value={value} rawText="" />);
    act(() => expandAllJsonTrees());
    expect(screen.getByText('"v49"')).toBeInTheDocument();
    expect(screen.queryByText('"v50"')).not.toBeInTheDocument();
    expect(screen.getByTestId('jsonTreeShowMore')).toHaveTextContent('Show 10 more (10 hidden)');
  });
});

describe('JsonTree', () => {
  const raw = '{"id":1,"user":{"name":"Ada"},"tags":["a","b"],"ok":true,"n":null,"e":{},"s":"5"}';

  it('renders root keys and values, quoting strings', () => {
    render(<JsonTree value={JSON.parse(raw)} rawText={raw} />);
    expect(screen.getByText('user')).toBeInTheDocument();
    expect(screen.getByText('true')).toBeInTheDocument();
    expect(screen.getByText('null')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('"5"')).toBeInTheDocument();
  });

  it('shows only root fields by default and expands/collapses nested nodes', () => {
    render(<JsonTree value={{ user: { name: 'Ada' } }} rawText="" />);
    expect(screen.getByText('user')).toBeInTheDocument();
    expect(screen.queryByText('"Ada"')).not.toBeInTheDocument();
    // toggles: [0] root, [1] user
    fireEvent.click(screen.getAllByTestId('jsonTreeToggle')[1]);
    expect(screen.getByText('"Ada"')).toBeInTheDocument();
    fireEvent.click(screen.getAllByTestId('jsonTreeToggle')[1]);
    expect(screen.queryByText('"Ada"')).not.toBeInTheDocument();
  });

  it('switches between formatted and raw text', () => {
    render(<JsonTree value={JSON.parse(raw)} rawText={raw} />);
    fireEvent.click(screen.getByTestId('jsonTreeRawToggle'));
    expect(screen.getByTestId('exploreJsonTreeRaw')).toHaveTextContent(raw);
    fireEvent.click(screen.getByTestId('jsonTreeRawToggle'));
    expect(screen.queryByTestId('exploreJsonTreeRaw')).not.toBeInTheDocument();
  });

  it('does not interpret HTML in values', () => {
    const { container } = render(
      <JsonTree value={{ x: '<img src=x onerror=alert(1)>' }} rawText="" />
    );
    expect(container.querySelector('img')).toBeNull();
  });

  it('shows no filter buttons without getLeafFilter', () => {
    render(<JsonTree value={{ a: 1 }} rawText="" />);
    expect(screen.queryByTestId('jsonTreeLeafFilter')).not.toBeInTheDocument();
  });

  it('shows filter buttons only on filterable leaves and passes path, value and mode', () => {
    const apply = jest.fn();
    const getLeafFilter = jest.fn((path: string[], value: unknown) =>
      path.join('.') === 'user.name' ? (mode: '+' | '-') => apply(path, value, mode) : undefined
    );
    render(
      <JsonTree
        value={{ id: 1, user: { name: 'Ada' }, list: [{ user: { name: 'x' } }] }}
        rawText=""
        getLeafFilter={getLeafFilter}
      />
    );
    // root leaf `id` is not filterable
    expect(screen.queryByTestId('jsonTreeLeafFilter')).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByTestId('jsonTreeToggle')[1]); // expand `user`
    expect(screen.getAllByTestId('jsonTreeLeafFilter')).toHaveLength(1);

    fireEvent.click(screen.getByTestId('jsonTreeFilterFor'));
    expect(apply).toHaveBeenLastCalledWith(['user', 'name'], 'Ada', '+');
    fireEvent.click(screen.getByTestId('jsonTreeFilterOut'));
    expect(apply).toHaveBeenLastCalledWith(['user', 'name'], 'Ada', '-');
  });

  it('omits array indices from the leaf path', () => {
    const getLeafFilter = jest.fn(() => undefined);
    render(<JsonTree value={[{ sku: 'A1' }]} rawText="" getLeafFilter={getLeafFilter} />);
    fireEvent.click(screen.getAllByTestId('jsonTreeToggle')[1]); // expand the array item
    expect(getLeafFilter).toHaveBeenCalledWith(['sku'], 'A1');
  });
});
