/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { StateAdapter } from '../state_adapter';

// Mock StateAdapter implementation
export class MockStateAdapter implements StateAdapter<{ counter: number }> {
  private state: { counter: number };
  private listeners: Array<(state: { counter: number }) => void> = [];

  constructor(initialState: { counter: number }) {
    this.state = initialState;
  }

  getState(): { counter: number } {
    return this.state;
  }

  setState(updater: (prevState: { counter: number }) => { counter: number }): void {
    this.state = updater(this.state);
    this.listeners.forEach((listener) => listener(this.state));
  }

  subscribe(listener: (state: { counter: number }) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }
}
