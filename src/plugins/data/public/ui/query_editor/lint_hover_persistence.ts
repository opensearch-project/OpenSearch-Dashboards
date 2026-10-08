/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { monaco } from '@osd/monaco';

/**
 * Keep the PPL lint hover card from vanishing the instant the pointer leaves it.
 *
 * Why this is needed. The query editors run with `fixedOverflowWidgets: true` so
 * the hover card is not clipped by the small query box — it renders in Monaco's
 * `.overflowingContentWidgets` node, which sits OUTSIDE the editor's bounding
 * rect. Monaco's content-hover widget registers its own `mouseleave` handler
 * (`ContentHoverWidgetWrapper._onMouseLeave`) that hides the card immediately
 * whenever the pointer leaves it and lands outside `editor.getDomNode()`'s rect.
 * Because the card floats outside that rect, the ordinary gesture "move onto the
 * card, then travel toward a link on it" satisfies the "outside the editor" test
 * and closes the card with no grace period, making the doc link hard to reach.
 * Neither `hover.sticky` nor `hover.hidingDelay` affects that path — the hide
 * there is unconditional.
 *
 * The fix. Intercept `mouseleave` on the overflow-widgets container in the
 * CAPTURE phase (so it runs before Monaco's own handler) and
 * `stopImmediatePropagation()` it, replacing the instant hide with a short grace
 * timer. Re-entering the card cancels the timer; when it elapses we re-dispatch
 * the same event, tagged so the guard lets it through to Monaco's handler, which
 * closes the card by its normal path. No private Monaco API is touched.
 *
 * On the node this listens for. Monaco attaches its handler to
 * `ContentHoverWidget.getDomNode()`, which is `ResizableContentWidget`'s
 * `_resizableNode.domNode` — a bare `div` with NO className. The familiar
 * `.monaco-hover` element is its DESCENDANT. Since `mouseleave` does not bubble,
 * a capture-phase listener sees `event.target` as that unclassed wrapper, so
 * matching on `closest('.monaco-hover')` would never fire and the guard would
 * silently do nothing. Identify the card by "wrapper that CONTAINS a
 * `.monaco-hover`" instead.
 */

/** Marker on the replayed event so the capture guard passes it to Monaco. */
const REPLAY_FLAG = '__pplHoverReplay';

/** Class Monaco puts on the hover body inside the (unclassed) resizable wrapper. */
const HOVER_BODY_SELECTOR = '.monaco-hover';

type FlaggedMouseEvent = MouseEvent & { [REPLAY_FLAG]?: boolean };

export function attachPPLLintHoverPersistence(
  editor: monaco.editor.IStandaloneCodeEditor,
  // The grace window before a card the pointer has left is allowed to close.
  // Matches the editor's hover `hidingDelay` so the two hide paths feel alike.
  hideGraceMs = 600
): () => void {
  // Locate the container that actually holds overflowing content widgets. With no
  // custom `overflowWidgetsDomNode` configured — our case — Monaco appends
  // `.overflowingContentWidgets` under the editor's root and
  // `getOverflowWidgetsDomNode()` returns undefined, so resolve it from the DOM.
  const editorDom = editor.getDomNode();
  const overflowNode =
    (
      editor as {
        getOverflowWidgetsDomNode?: () => HTMLElement | undefined;
      }
    ).getOverflowWidgetsDomNode?.() ??
    editorDom?.querySelector<HTMLElement>('.overflowingContentWidgets') ??
    undefined;
  if (!overflowNode) {
    // No overflow container (fixedOverflowWidgets off) — Monaco already keeps the
    // card inside the editor rect, so there is nothing to correct.
    return () => {};
  }

  let hideTimer: ReturnType<typeof setTimeout> | undefined;

  const clearHideTimer = () => {
    if (hideTimer !== undefined) {
      clearTimeout(hideTimer);
      hideTimer = undefined;
    }
  };

  /**
   * The hover widget's own root, given any node the event could target. Matches
   * the element that CONTAINS the hover body rather than the body itself,
   * because that is the node Monaco listens on (see the note above). Also
   * tolerates the body itself, in case a future Monaco moves the listener.
   */
  const hoverWidgetOf = (node: EventTarget | null): Element | null => {
    if (!(node instanceof Element)) {
      return null;
    }
    if (node.querySelector(HOVER_BODY_SELECTOR)) {
      return node;
    }
    return node.closest(HOVER_BODY_SELECTOR);
  };

  const onCaptureMouseLeave = (event: MouseEvent) => {
    // The delayed replay is tagged so it reaches Monaco's handler and performs
    // the real hide.
    if ((event as FlaggedMouseEvent)[REPLAY_FLAG]) {
      return;
    }
    const card = hoverWidgetOf(event.target);
    if (!card) {
      // Some other overflow widget (e.g. the suggestion list) — leave it to
      // manage its own lifecycle.
      return;
    }
    event.stopImmediatePropagation();
    clearHideTimer();
    hideTimer = setTimeout(() => {
      hideTimer = undefined;
      const replay: FlaggedMouseEvent = new MouseEvent('mouseleave', {
        bubbles: false,
        clientX: event.clientX,
        clientY: event.clientY,
      });
      replay[REPLAY_FLAG] = true;
      card.dispatchEvent(replay);
    }, hideGraceMs);
  };

  const onCaptureMouseEnter = (event: MouseEvent) => {
    // Moving back onto the card cancels a pending hide, so it stays open while
    // in use (matching sticky-hover expectations).
    if (hoverWidgetOf(event.target)) {
      clearHideTimer();
    }
  };

  overflowNode.addEventListener('mouseleave', onCaptureMouseLeave, true);
  overflowNode.addEventListener('mouseenter', onCaptureMouseEnter, true);

  return () => {
    clearHideTimer();
    overflowNode.removeEventListener('mouseleave', onCaptureMouseLeave, true);
    overflowNode.removeEventListener('mouseenter', onCaptureMouseEnter, true);
  };
}
