/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Creates a namespaced wrapper around sessionStorage that prefixes all keys with a flavor
 * This ensures different Explore flavors (logs, traces, metrics) maintain separate state
 * while using the same URL parameter names (_q, _a)
 */
export class FlavoredSessionStorage implements Storage {
  constructor(private flavor: string, private storage: Storage = window.sessionStorage) {}

  private getFlavoredKey(key: string): string {
    // Prefix the key with flavor to create separate namespaces
    return `${this.flavor}:${key}`;
  }

  getItem(key: string): string | null {
    return this.storage.getItem(this.getFlavoredKey(key));
  }

  setItem(key: string, value: string): void {
    this.storage.setItem(this.getFlavoredKey(key), value);
  }

  removeItem(key: string): void {
    this.storage.removeItem(this.getFlavoredKey(key));
  }

  clear(): void {
    // Only clear keys for this flavor
    const prefix = `${this.flavor}:`;
    const keysToRemove: string[] = [];

    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => this.storage.removeItem(key));
  }

  key(index: number): string | null {
    // Get all keys for this flavor
    const prefix = `${this.flavor}:`;
    const flavorKeys: string[] = [];

    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key && key.startsWith(prefix)) {
        flavorKeys.push(key.substring(prefix.length)); // Remove prefix
      }
    }

    return index < flavorKeys.length ? flavorKeys[index] : null;
  }

  public get length(): number {
    const prefix = `${this.flavor}:`;
    let count = 0;

    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key && key.startsWith(prefix)) {
        count++;
      }
    }

    return count;
  }
}
