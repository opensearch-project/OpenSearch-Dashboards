/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Simple semaphore for limiting concurrent operations
 */
export class Semaphore {
  private available: number;
  private waitQueue: (() => void)[] = [];

  constructor(limit: number) {
    this.available = limit;
  }

  /**
   * Acquire a semaphore slot. Will block if limit reached.
   */
  async acquire(): Promise<void> {
    if (this.available > 0) {
      this.available--;
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      this.waitQueue.push(resolve);
    });
  }

  /**
   * Release a semaphore slot, allowing next waiting operation to proceed
   */
  release(): void {
    const next = this.waitQueue.shift();
    if (next) {
      next();
    } else {
      this.available++;
    }
  }
}
