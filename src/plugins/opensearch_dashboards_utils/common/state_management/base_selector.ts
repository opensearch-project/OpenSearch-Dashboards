/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import debounce from 'raf-debounce';

type ChangeHandler = () => void;

export abstract class BaseSelectors<T> {
  private changeHandlers: Set<ChangeHandler> = new Set();

  /**
   * Debounce change emissions by animation frame for performance improvements.
   */
  protected emitChange = debounce(() => {
    this.changeHandlers.forEach((handler) => handler());
  });

  public subscribe(changeHandler: ChangeHandler, abortController: AbortController) {
    this.changeHandlers.add(changeHandler);

    abortController.signal.addEventListener('abort', () => {
      this.changeHandlers.delete(changeHandler);
    });
  }

  public destroy() {
    this.changeHandlers.clear();
  }

  public abstract getState(): T;
}
