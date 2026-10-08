/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { attachPPLLintHoverPersistence } from './lint_hover_persistence';

jest.useFakeTimers();

/**
 * Reproduce the DOM Monaco actually builds, because the shape is what the fix
 * turns on: the node that RECEIVES `mouseleave` is `ResizableContentWidget`'s
 * `_resizableNode.domNode` — a bare div with no className — and `.monaco-hover`
 * is its descendant. A fixture that puts the class on the listening node would
 * pass even with a `closest('.monaco-hover')` guard that can never match in
 * production, since `mouseleave` does not bubble.
 */
function buildEditorDom() {
  const editorDom = document.createElement('div');
  const overflow = document.createElement('div');
  overflow.className = 'overflowingContentWidgets';
  editorDom.appendChild(overflow);

  // The resizable wrapper: unclassed, and what Monaco listens on.
  const hoverWidget = document.createElement('div');
  const hoverBody = document.createElement('div');
  hoverBody.className = 'monaco-hover';
  hoverWidget.appendChild(hoverBody);
  overflow.appendChild(hoverWidget);

  // Monaco's own handler, registered on the wrapper in the bubble phase.
  const monacoHide = jest.fn();
  hoverWidget.addEventListener('mouseleave', monacoHide);

  document.body.appendChild(editorDom);
  return { editorDom, overflow, hoverWidget, hoverBody, monacoHide };
}

const fakeEditor = (editorDom: HTMLElement) => ({ getDomNode: () => editorDom }) as any;

const leave = (node: Element) =>
  node.dispatchEvent(new MouseEvent('mouseleave', { bubbles: false }));

const enter = (node: Element) =>
  node.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false }));

describe('attachPPLLintHoverPersistence', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    jest.clearAllTimers();
  });

  it('suppresses the immediate hide when the pointer leaves the card', () => {
    const { editorDom, hoverWidget, monacoHide } = buildEditorDom();
    attachPPLLintHoverPersistence(fakeEditor(editorDom));

    leave(hoverWidget);

    expect(monacoHide).not.toHaveBeenCalled();
  });

  it('hides the card once the grace window elapses', () => {
    const { editorDom, hoverWidget, monacoHide } = buildEditorDom();
    attachPPLLintHoverPersistence(fakeEditor(editorDom), 600);

    leave(hoverWidget);
    jest.advanceTimersByTime(599);
    expect(monacoHide).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(monacoHide).toHaveBeenCalledTimes(1);
  });

  it('keeps the card open when the pointer returns to it within the grace window', () => {
    const { editorDom, hoverWidget, monacoHide } = buildEditorDom();
    attachPPLLintHoverPersistence(fakeEditor(editorDom), 600);

    leave(hoverWidget);
    jest.advanceTimersByTime(300);
    enter(hoverWidget);
    jest.advanceTimersByTime(1000);

    expect(monacoHide).not.toHaveBeenCalled();
  });

  it('leaves other overflow widgets alone', () => {
    const { editorDom, overflow } = buildEditorDom();
    const suggestWidget = document.createElement('div');
    suggestWidget.className = 'suggest-widget';
    const suggestHide = jest.fn();
    suggestWidget.addEventListener('mouseleave', suggestHide);
    overflow.appendChild(suggestWidget);

    attachPPLLintHoverPersistence(fakeEditor(editorDom));
    leave(suggestWidget);

    // Not the hover card, so its own instant-hide must still run.
    expect(suggestHide).toHaveBeenCalledTimes(1);
  });

  it('is a no-op when the editor has no overflow-widgets container', () => {
    const editorDom = document.createElement('div');
    document.body.appendChild(editorDom);

    expect(() => attachPPLLintHoverPersistence(fakeEditor(editorDom))()).not.toThrow();
  });

  it('stops intercepting after the returned disposer runs', () => {
    const { editorDom, hoverWidget, monacoHide } = buildEditorDom();
    const detach = attachPPLLintHoverPersistence(fakeEditor(editorDom));

    detach();
    leave(hoverWidget);

    expect(monacoHide).toHaveBeenCalledTimes(1);
  });

  it('cancels a pending hide when disposed mid-grace-window', () => {
    const { editorDom, hoverWidget, monacoHide } = buildEditorDom();
    const detach = attachPPLLintHoverPersistence(fakeEditor(editorDom), 600);

    leave(hoverWidget);
    detach();
    jest.advanceTimersByTime(1000);

    expect(monacoHide).not.toHaveBeenCalled();
  });
});
