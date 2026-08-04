/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

function getSignalState(view, signalNames) {
  const signalNameSet = new Set(signalNames || []);
  if (!signalNameSet.size) return null;

  // Restore only the selected signal values. Data and subcontext state belong
  // to the new refresh cycle and should not be carried over from the old view.
  const state = view.getState({
    signals: (name) => signalNameSet.has(name),
    data: false,
    recurse: false,
  });
  if (!state?.signals || !Object.keys(state.signals).length) {
    return null;
  }

  return state.signals;
}

function getFocusedControl(controlsEl) {
  // The controls container is destroyed on refresh. Capture enough identity to
  // find the equivalent generated control after Vega recreates it.
  if (
    typeof document === 'undefined' ||
    !controlsEl ||
    !document.activeElement ||
    !controlsEl.contains(document.activeElement)
  ) {
    return null;
  }

  const { activeElement } = document;
  const name = activeElement.getAttribute('name');
  if (!name) return null;

  const focusedControl = {
    name,
    tagName: activeElement.tagName,
    type: activeElement.getAttribute('type'),
    value: activeElement.getAttribute('value'),
  };

  if (typeof activeElement.selectionStart === 'number') {
    focusedControl.selectionStart = activeElement.selectionStart;
    focusedControl.selectionEnd = activeElement.selectionEnd;
  }

  return focusedControl;
}

function getMatchingControl(controlsEl, focusedControl) {
  if (!controlsEl || !focusedControl) return null;

  // Vega-generated controls use the signal name as the element name. Radio
  // controls share a name, so include the value to restore the exact option.
  return Array.from(controlsEl.querySelectorAll('[name]')).find((element) => {
    if (element.getAttribute('name') !== focusedControl.name) return false;
    if (element.tagName !== focusedControl.tagName) return false;
    if (focusedControl.type && element.getAttribute('type') !== focusedControl.type) return false;
    if (focusedControl.type === 'radio' && element.getAttribute('value') !== focusedControl.value) {
      return false;
    }
    return true;
  });
}

function restoreFocusedControl(controlsEl, focusedControl) {
  const element = getMatchingControl(controlsEl, focusedControl);
  if (!element) return;

  try {
    element.focus({ preventScroll: true });
  } catch {
    element.focus();
  }

  if (
    typeof element.setSelectionRange === 'function' &&
    typeof focusedControl.selectionStart === 'number'
  ) {
    try {
      element.setSelectionRange(focusedControl.selectionStart, focusedControl.selectionEnd);
    } catch {
      // Some input types do not support selection ranges.
    }
  }
}

export class VegaSignalStateManager {
  constructor() {
    this._state = null;
    this._focusedControl = null;
  }

  clear() {
    this._state = null;
    this._focusedControl = null;
  }

  getState() {
    return this._state;
  }

  save(view, controlsEl, signalNames) {
    if (!view || typeof view.getState !== 'function') return;

    try {
      this._state = getSignalState(view, signalNames);
      this._focusedControl = getFocusedControl(controlsEl);
    } catch {
      this.clear();
    }
  }

  restore(view, controlsEl) {
    const savedState = this.getState();

    if (savedState) {
      try {
        // Set signal values before the first run so generated inputs are
        // initialized with the restored values, not their spec defaults.
        Object.entries(savedState).forEach(([name, value]) => {
          view.signal(name, value);
        });
      } catch {
        this.clear();
      }
    }

    return view.runAsync().then(() => {
      restoreFocusedControl(controlsEl, this._focusedControl);
      return view;
    });
  }
}
