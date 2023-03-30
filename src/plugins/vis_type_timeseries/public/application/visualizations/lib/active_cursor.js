/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// TODO: Remove bus when action/triggers are available with LegacyPluginApi or metric is converted to Embeddable

const EventEmitter = require('events');

module.exports.ACTIVE_CURSOR = 'ACTIVE_CURSOR';

class EventBus extends EventEmitter {
  on(eventName, listener) {
    this.addListener(eventName, listener);
  }

  off(eventName, listener) {
    this.removeListener(eventName, listener);
  }

  trigger(eventName, detail) {
    this.emit(eventName, detail);
  }
}

module.exports.EventBus = EventBus;
