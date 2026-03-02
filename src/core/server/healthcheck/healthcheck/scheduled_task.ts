/*
 * Copyright Wazuh
 * SPDX-License-Identifier: Apache-2.0
 */

export class ScheduledIntervalTask {
  private _interval: any;
  public status = 'not_started';
  constructor(private fn: Function, private time: number) {
    this.run = this.run.bind(this);
  }
  private async run() {
    this.status = 'started';
    const results = await this.fn();
    this.status = 'finished';
    return results;
  }
  start() {
    this._interval = setInterval(this.run, this.time);
  }
  stop() {
    if (this._interval) {
      clearInterval(this._interval);
    }
  }
}
