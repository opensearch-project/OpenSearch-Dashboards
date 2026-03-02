/*
 * Copyright Wazuh
 * SPDX-License-Identifier: Apache-2.0
 */
// @ts-check

/**
 * @typedef {Object} Task
 * @property {string} name
 * @property {StatusValuesType} status
 * @property {ResultValuesType} result
 * @property {any} data
 * @property {string} createdAt
 * @property {string} startedAt
 * @property {string} finishedAt
 * @property {number} duration
 * @property {string} error
 * @property {boolean} critical
 * @property {boolean} enabled
 */

/**
 * @typedef {Object} HealthCheckTasks
 * @property {string} message
 * @property {Task[]} tasks
 */

/**
 * @typedef {Object} FetchOptions
 * @property {'GET' | 'POST' | 'PUT' | 'DELETE'} method
 * @property {any} [body]
 * @property {Record<string, string>} [headers]
 */

/** @type {Task[]} */
let tasks = [];
/** Indicates if the healthcheck run is in progress */
let isRunning = false;
const FILENAME = 'healthcheck.json';

/**
 * Simple HTTP request wrapper
 */
class HttpService {
  /**
   * @private
   * @type {string}
   */
  baseUrl;

  constructor() {
    this.baseUrl = window.location.origin + window.__CONFIG.serverBasePath;
  }

  /**
   * @template T
   * @param {string} endpoint
   * @returns {Promise<T>}
   */
  get(endpoint) {
    return this.request('GET', endpoint);
  }

  /**
   * @template T
   * @param {string} endpoint
   * @param {any} [payload]
   * @returns {Promise<T>}
   */
  post(endpoint, payload) {
    return this.request('POST', endpoint, payload);
  }

  /**
   * @private
   * @param {string} endpoint
   * @param {FetchOptions} options
   */
  fetch(endpoint, options) {
    return fetch(this.baseUrl + endpoint, options);
  }

  /**
   * @template T
   * @private
   * @returns {Promise<T>}
   */
  async request(
    /** @type {'GET' | 'POST' | 'PUT' | 'DELETE'} */ method,
    /** @type {string} */ endpoint,
    /** @type {any} */ payload = undefined
  ) {
    /** @type {FetchOptions} */
    const options = { method, body: payload };

    if (payload) {
      options.headers = { 'content-type': 'application/json' };
    }

    const response = await this.fetch(endpoint, options);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `[HTTP ERROR] Status: ${response.status} - ${response.statusText}. Response: ${errorText}`
      );
    }

    return await response.json();
  }
}

const httpService = new HttpService();

class UseCases {
  /** @private */
  static INTERNAL_HEALTHCHECK_API_ENDPOINT = '/api/healthcheck/internal';

  static async retrieveHealthCheckTasks() {
    try {
      const response = await /** @type {Promise<HealthCheckTasks>} */ (httpService.get(
        this.INTERNAL_HEALTHCHECK_API_ENDPOINT
      ));
      return response.tasks;
    } catch (err) {
      console.error('Failed to get health check tasks:', err);
      return [];
    }
  }

  static async executeHealthCheckForCriticalTasks() {
    const params = new URLSearchParams();
    params.set(
      'name',
      getCriticalTasks(tasks)
        .map(({ name }) => name)
        .toString()
    );
    try {
      const response = await /** @type {Promise<HealthCheckTasks>} */ (httpService.post(
        `${this.INTERNAL_HEALTHCHECK_API_ENDPOINT}?${params.toString()}`
      ));

      return combineTaskArraysByKey(tasks || [], response.tasks, 'name');
    } catch (err) {
      console.error('Failed to run health check:', err);
      return [];
    }
  }
}

class HealthCheckDocument {
  static ROOT_ID = 'root';
  static BTN_EXPORT_ID = 'btn-download';
  static BTN_RUN_FAILED_CRITICAL_CHECKS_ID = 'btn-run-failed-critical-checks';

  /**
   * @template {HTMLElement} T
   * @param {string} id
   * @returns {T}
   * @private
   */
  static getElementById(id) {
    return /** @type {T} */ (document.getElementById(id));
  }

  static getRoot() {
    return /** @type {HTMLDivElement} */ (this.getElementById(this.ROOT_ID));
  }

  /**
   * Sets the content of the root element.
   * @param {string} content
   */
  static setRootContent(content) {
    const root = this.getRoot();
    if (root) {
      // eslint-disable-next-line no-unsanitized/property
      root.innerHTML = content;
    }
  }

  static getExportButton() {
    return /** @type {HTMLButtonElement} */ (this.getElementById(this.BTN_EXPORT_ID));
  }

  static getRunFailedCriticalChecksButton() {
    return /** @type {HTMLButtonElement}  */ (this.getElementById(
      this.BTN_RUN_FAILED_CRITICAL_CHECKS_ID
    ));
  }
}

class Status {
  /** @typedef {typeof Status.StatusValues[keyof typeof Status.StatusValues]} StatusValuesType */

  /**
   * @private
   * @enum {string}
   */
  static StatusValues = {
    NOT_STARTED: /** @type {'not_started'} */ ('not_started'),
    RUNNING: /** @type {'running'} */ ('running'),
    FINISHED: /** @type {'finished'} */ ('finished'),
  };

  /**
   * Checks if the given status is finished.
   * @param {string} status
   * @returns {status is 'finished'}
   */
  static isFinished(status) {
    return status === Status.StatusValues.FINISHED;
  }
}

class Result {
  /** @typedef {typeof Result.ResultValues[keyof typeof Result.ResultValues]} ResultValuesType */

  /**
   * @private
   * @enum {string}
   */
  static ResultValues = {
    GREEN: /** @type {'green'} */ ('green'),
    RED: /** @type {'red'} */ ('red'),
    GRAY: /** @type {'gray'} */ ('gray'),
  };

  /**
   * Checks if the given value is a success.
   * @param {string} value
   * @returns {value is 'green'}
   */
  static isSuccess(value) {
    return value === Result.ResultValues.GREEN;
  }

  /**
   * Checks if the given value is a failure.
   * @param {string} value
   * @returns {value is 'red' | 'yellow'}
   */
  static isFailed(value) {
    return value === Result.ResultValues.RED;
  }

  /**
   * Checks if the given value is unknown.
   * @param {string} value
   * @returns {value is 'gray'}
   */
  static isUnknown(value) {
    return value === Result.ResultValues.GRAY;
  }
}

/**
 * Combines two arrays of tasks by a specific key.
 * @param {Task[]} arr1
 * @param {Task[]} arr2
 * @param {keyof Task} key
 * @returns {Task[]}
 */
function combineTaskArraysByKey(arr1, arr2, key) {
  if (!Array.isArray(arr1)) arr1 = [];
  if (!Array.isArray(arr2)) arr2 = [];

  const isPlainObject = (/** @type {unknown}  */ v) =>
    v && typeof v === 'object' && v.constructor === Object;

  /** @type {Map<string, Task>} */
  const map = new Map();

  // Seed with arr1 (preserve insertion order)
  arr1.forEach((item) => {
    if (!item) return;
    const k = item[key];
    if (k === undefined) return;
    map.set(String(k), item);
  });

  // Merge/overwrite with arr2. If both values are plain objects, shallow-merge them.
  arr2.forEach((item) => {
    if (!item) return;
    const k = item[key];
    if (k === undefined) return;
    const mapKey = String(k);

    if (map.has(mapKey)) {
      const existing = map.get(mapKey);
      if (isPlainObject(existing) && isPlainObject(item)) {
        map.set(mapKey, { ...existing, ...item });
      } else {
        map.set(mapKey, item);
      }
    } else {
      map.set(mapKey, item);
    }
  });

  return Array.from(map.values());
}

/**
 * Download the health checks as a JSON file
 */
function downloadHealthChecksAsJSONFile() {
  const btn = HealthCheckDocument.getExportButton();
  try {
    btn.disabled = true;
    const content = JSON.stringify({ checks: tasks, _meta: { server: 'not-ready' } });
    // Normalize content into a Blob
    const blob = new Blob([content], { type: 'application/json' });

    // Create an object URL and anchor element
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = FILENAME;

    // Append, click, and clean up
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error(error);
  } finally {
    btn.disabled = false;
  }
}

// Run health checks data
async function runHealthCheck() {
  const btn = HealthCheckDocument.getRunFailedCriticalChecksButton();
  if (btn) btn.disabled = true;
  isRunning = true;
  // Re-render immediately to reflect running state
  renderHealthCheckSummary(tasks);
  try {
    const healthCheckTasks = await UseCases.executeHealthCheckForCriticalTasks();
    isRunning = false;
    renderHealthCheckSummary(healthCheckTasks);
  } catch (e) {
    console.error(e);
    isRunning = false;
    renderHealthCheckSummary(tasks);
  } finally {
    const latestBtn = HealthCheckDocument.getRunFailedCriticalChecksButton();
    if (latestBtn) latestBtn.disabled = false;
  }
}

/**
 * Maps each element of an array using a mapper function.
 * @template T
 * @param {T[]} arr
 * @param {(item: T) => string} mapper
 * @returns {string}
 */
function $map(arr, mapper) {
  if (!Array.isArray(arr) || typeof mapper !== 'function') {
    throw new Error('Invalid arguments');
  }
  const result = [];
  for (const item of arr) {
    result.push(mapper(item));
  }
  return result.join('');
}

/**
 * Returns trueValue if condition is true, otherwise falseValue.
 * @param {boolean} condition
 * @param {string} trueValue
 * @param {string} [falseValue]
 */
function $if(condition, trueValue, falseValue = '') {
  return condition ? trueValue : falseValue;
}

function filterEnabledFinishedFailedTasks() {
  /**
   *
   * @param {Task} task
   * @returns
   */
  return (task) => {
    const { enabled, status, result } = task;
    return enabled && Status.isFinished(status) && !Result.isSuccess(result);
  };
}

/**
 *
 * @param {Task[]} tasks
 * @returns
 */
function getCriticalTasks(tasks) {
  return tasks.filter(filterEnabledFinishedFailedTasks()).filter(({ critical }) => critical);
}

/**
 *
 * @param {Task[]} tasks
 * @returns
 */
function getNonCriticalTasks(tasks) {
  return tasks.filter(filterEnabledFinishedFailedTasks()).filter(({ critical }) => !critical);
}

/**
 * Format ISO date or numeric timestamps to a short, readable string
 * @param {string | number | undefined} value
 */
function formatDateTime(value) {
  if (!value) return '';
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) return String(value);
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return String(value);
  }
}

/**
 * Format duration in milliseconds to a compact human string
 * @param {number | undefined} ms
 */
function formatDuration(ms) {
  if (ms == null || isNaN(ms)) return '';
  const totalMs = Math.max(0, Math.floor(ms));
  const s = Math.floor(totalMs / 1000);
  const msR = totalMs % 1000;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const parts = [];
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  if (sec || (!h && !m)) parts.push(`${sec}s`);
  if (!h && !m && msR) parts.push(`${msR}ms`);
  return parts.join(' ');
}

class Icons {
  static get healthCheck() {
    return /* html */ `
      <picture>
        <img
          width="52"
          src="data:image/png;base64,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"
          alt="Health Check Icon"
        />
      </picture>
    `;
  }

  static get export() {
    return /* html */ `
      <picture>
        <img
          width="22"
          src="data:image/png;base64,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"
          alt="Export Icon"
        />
      </picture>
    `;
  }

  static get download() {
    return /* html */ `
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M12 3v12m0 0 4-4m-4 4-4-4"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M4 20h16"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        />
      </svg>
    `;
  }

  static get wrench() {
    return /* html */ `
    <picture>
      <img
        width="52"
        src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFIAAABaCAYAAAArfwH2AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAPiSURBVHhe7Zy9axRBGMZX/wlzdmKvcodgqSlUuKjYWihCImppYach2llYqiQB0cJW/DgwFtFSkAS1F7uc/hW6T24WJ5M97+t53znD84OQuUB2dn/7vLMzc5fs+11SiInZH76LCZFIEhJJQiJJSCQJiSQhkSQkkoREkpBIEhJJQiJJSCQJiSQhkSQkkoREkpBIEhJJYmpEvu28C63BbGx+Ca3pIavIre7PYmX1WXH8xGwp8n346WBWVp8X5y9e2v7daSGbSEi4UMpYHlNGt7wJ+N1pEeouEim8fvPW2AJTYqE4di5cRWJsQwotxjgIxQ3KlU43kXiY4EItgcw3nbUsMl1EIoFL9x+EVz1azWPbX5PSaMzsOE5V6t4yzUVCYppEXPiTRw/Dq8k4WIq8e+d2cW3+SvhJDyTTc5pkLjJN4lz7LE1iBWS222d2yEQy074tMRWJ8sIFVSCJi2V6LIDMhVJkWuZeMs1EYiqSTnFQgtakfaC8PUrcTCRWHzFIIlJjDfqIU49UjrJqGhczkfHaGeWGsdEL9BWX+H+byHQDYq59OrT8aDWPhlYvldYyTURubH4LrR7NKB1e4CkeY13eRiL/3n2U2LBjY/VgGPQ1zJoafXqWt8lnyLEtVoG5HaYldWCiPukFQla/eSmmX/HM4fOn9dDiQ09kzh2YQVieG11kPAEHjcaB0PIn7Ts9Nyb00kapxmtrzOn6TX0Y4xY2LfqNwZg9xCubVy9fmM1l6SJRPthzrPiXSGs8RZo8tWO63V+h5Y9n33SRuOMot4qNza+h5c9WItIqjcAkkfEJ53yKxyss6+HFRKT38qyOdJnaah4JLRtMRHovz+pI+7ReppqVdrw8Qzo8U4m+4v5GWaaOi4lIsDB/ObR6pPuTlqR9pedigZlIpCDdNEjHLQvq0hifhxVmIkGahOUyKfFFssGx03csPdIITEUiCXXv7FnIrJOIvj3SCExFAjzB44uxkIm5at175/227yxw+Z8WuNB7NfIwSUbpjftExXE7nbVd71ZiZfW6XFd74vbPQarU7N5mmynOlakdNT3ppm1FDonATSTolyCAUhz2Exi4IXVDAxJu9QGEQZiPkTEoYSQPFxtvbEwKjoVj5pIIXEVWIDlIH+OJWpVyrj3PiiwiAWvJZr30G5ZsIvcaEklCIklIJAmJJCGRJCSShESSkEgSEklCIkm4bqPtZZRIEhJJImtpL33gfJRl8ZT/n5+kZBU5+/Rx8fHH9/BqPE4eOlysX70RXuVDpU1CIklo+kNCiSQhkSQkkoREkpBIEhJJQiJJSCQJiSQhkSQkkoREkpBICkXxB/8+yoZ/03zeAAAAAElFTkSuQmCC"
        alt="Wrench Icon"
      />
    </picture>
    `;
  }

  static get warning() {
    return /* html */ `
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M12 3l9 16H3l9-16z" stroke="currentColor" stroke-width="2" fill="none"/>
        <path d="M12 9v5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <circle cx="12" cy="17" r="1.25" fill="currentColor"/>
      </svg>
    `;
  }

  static get alertCircle() {
    return /* html */ `
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
      >
        <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" />
        <path d="M12 7v6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        <circle cx="12" cy="16.5" r="1.25" fill="currentColor" />
      </svg>
    `;
  }

  static get wazuhDashboard() {
    return /* html */ `
      <svg
        width="228"
        height="29"
        viewBox="0 0 228 29"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M28.1876 19.5312L22.1851 0H17.4312L11.4287 19.5312L5.47425 0H0L8.71558 28.457H13.1334L19.8081 7.84605L26.4589 28.457H30.8767L39.5923 0H34.166L28.1876 19.5312Z"
          fill="black"
        />
        <path
          d="M43.9227 28.457C46.3143 28.457 48.2531 26.5182 48.2531 24.1265C48.2531 21.7349 46.3143 19.7961 43.9227 19.7961C41.5311 19.7961 39.5923 21.7349 39.5923 24.1265C39.5923 26.5182 41.5311 28.457 43.9227 28.457Z"
          fill="#3D82F1"
        />
        <path
          d="M218.515 28.9858C216.74 28.9858 215.224 28.5451 213.966 27.6635C212.708 26.7702 211.745 25.5654 211.075 24.0492C210.405 22.5329 210.07 20.8227 210.07 18.9186C210.07 17.0262 210.399 15.3219 211.057 13.8056C211.727 12.2893 212.685 11.0904 213.931 10.2089C215.177 9.32734 216.669 8.88657 218.409 8.88657C220.196 8.88657 221.7 9.32147 222.923 10.1913C224.145 11.0611 225.068 12.2541 225.691 13.7703C226.325 15.2748 226.643 16.9909 226.643 18.9186C226.643 20.811 226.331 22.5212 225.708 24.0492C225.085 25.5654 224.169 26.7702 222.958 27.6635C221.747 28.5451 220.266 28.9858 218.515 28.9858ZM218.779 26.5704C220.131 26.5704 221.248 26.2413 222.129 25.5831C223.011 24.9249 223.669 24.0198 224.104 22.8679C224.539 21.7043 224.756 20.3878 224.756 18.9186C224.756 17.4258 224.539 16.1094 224.104 14.9692C223.669 13.8174 223.011 12.9182 222.129 12.2717C221.259 11.6252 220.16 11.302 218.832 11.302C217.469 11.302 216.34 11.637 215.447 12.307C214.554 12.9769 213.89 13.8879 213.455 15.0398C213.032 16.1917 212.82 17.4846 212.82 18.9186C212.82 20.3643 213.038 21.669 213.472 22.8326C213.919 23.9845 214.583 24.8955 215.465 25.5654C216.346 26.2354 217.451 26.5704 218.779 26.5704ZM224.756 28.4569V14.123H224.474V3.06836H227.084V28.4569H224.756Z"
          fill="#2F2F34"
        />
        <path
          d="M198.765 28.4569V9.41551H201.092V13.9996L200.634 13.4001C200.846 12.8359 201.122 12.3187 201.463 11.8486C201.803 11.3667 202.174 10.9729 202.573 10.6673C203.067 10.2324 203.643 9.9033 204.301 9.67998C204.959 9.4449 205.624 9.30973 206.293 9.27447C206.963 9.22745 207.575 9.27447 208.127 9.41551V11.8486C207.434 11.6723 206.675 11.6311 205.853 11.7252C205.03 11.8192 204.272 12.1483 203.578 12.7125C202.944 13.2062 202.468 13.7997 202.15 14.4932C201.833 15.175 201.621 15.9037 201.516 16.6795C201.41 17.4435 201.357 18.2016 201.357 18.9539V28.4569H198.765Z"
          fill="#2F2F34"
        />
        <path
          d="M184.619 28.9857C183.185 28.9857 181.981 28.7272 181.005 28.21C180.041 27.6928 179.318 27.0052 178.836 26.1472C178.354 25.2891 178.114 24.3547 178.114 23.3438C178.114 22.3095 178.319 21.428 178.731 20.6992C179.154 19.9587 179.724 19.3534 180.441 18.8832C181.17 18.4131 182.01 18.0546 182.962 17.8077C183.926 17.5727 184.99 17.367 186.153 17.1906C187.329 17.0026 188.475 16.8439 189.591 16.7146C190.72 16.5736 191.707 16.4384 192.553 16.3091L191.636 16.8733C191.672 14.9927 191.307 13.5998 190.543 12.6948C189.779 11.7897 188.451 11.3372 186.559 11.3372C185.254 11.3372 184.149 11.631 183.244 12.2187C182.351 12.8064 181.722 13.735 181.358 15.0044L178.836 14.2639C179.271 12.5596 180.147 11.2373 181.463 10.2969C182.78 9.35663 184.49 8.88647 186.594 8.88647C188.334 8.88647 189.809 9.21558 191.019 9.87381C192.242 10.5203 193.106 11.4606 193.611 12.6948C193.846 13.2472 193.999 13.8643 194.07 14.546C194.14 15.2277 194.175 15.9212 194.175 16.6265V28.4568H191.866V23.6788L192.536 23.9609C191.889 25.5947 190.884 26.8407 189.521 27.6987C188.157 28.5567 186.523 28.9857 184.619 28.9857ZM184.919 26.7466C186.13 26.7466 187.188 26.5292 188.093 26.0943C188.998 25.6594 189.726 25.0658 190.279 24.3135C190.831 23.5495 191.19 22.6915 191.354 21.7394C191.495 21.1282 191.572 20.4582 191.584 19.7295C191.595 18.989 191.601 18.4366 191.601 18.0722L192.589 18.5835C191.707 18.701 190.749 18.8186 189.715 18.9361C188.692 19.0537 187.681 19.1888 186.682 19.3416C185.695 19.4944 184.802 19.6766 184.002 19.8882C183.462 20.041 182.939 20.2584 182.433 20.5405C181.928 20.8109 181.51 21.1752 181.181 21.6336C180.864 22.0921 180.705 22.6621 180.705 23.3438C180.705 23.8963 180.84 24.4311 181.111 24.9483C181.393 25.4654 181.84 25.8945 182.451 26.2353C183.074 26.5762 183.896 26.7466 184.919 26.7466Z"
          fill="#2F2F34"
        />
        <path
          d="M166.255 28.9857C164.363 28.9857 162.746 28.5567 161.407 27.6987C160.067 26.8407 159.038 25.6535 158.321 24.1372C157.604 22.621 157.246 20.8814 157.246 18.9185C157.246 16.9203 157.61 15.169 158.339 13.6645C159.067 12.16 160.102 10.9904 161.442 10.1559C162.794 9.30962 164.398 8.88647 166.255 8.88647C168.159 8.88647 169.781 9.31549 171.121 10.1735C172.473 11.0198 173.501 12.2011 174.207 13.7174C174.924 15.2219 175.282 16.9556 175.282 18.9185C175.282 20.9167 174.924 22.6739 174.207 24.1901C173.49 25.6946 172.455 26.87 171.104 27.7163C169.752 28.5626 168.136 28.9857 166.255 28.9857ZM166.255 26.4998C168.371 26.4998 169.946 25.8004 170.98 24.4017C172.014 22.9912 172.532 21.1635 172.532 18.9185C172.532 16.6147 172.009 14.7811 170.963 13.4176C169.928 12.0542 168.359 11.3724 166.255 11.3724C164.833 11.3724 163.657 11.6957 162.729 12.3421C161.812 12.9769 161.124 13.8643 160.666 15.0044C160.219 16.1328 159.996 17.4375 159.996 18.9185C159.996 21.2105 160.525 23.05 161.583 24.437C162.641 25.8122 164.198 26.4998 166.255 26.4998Z"
          fill="#2F2F34"
        />
        <path
          d="M145.987 28.9858C144.235 28.9858 142.754 28.5451 141.544 27.6635C140.333 26.7702 139.416 25.5654 138.793 24.0492C138.17 22.5212 137.859 20.811 137.859 18.9186C137.859 16.9909 138.17 15.2748 138.793 13.7703C139.428 12.2541 140.356 11.0611 141.579 10.1913C142.801 9.32147 144.306 8.88657 146.092 8.88657C147.832 8.88657 149.325 9.32734 150.571 10.2089C151.817 11.0904 152.769 12.2893 153.427 13.8056C154.097 15.3219 154.432 17.0262 154.432 18.9186C154.432 20.8227 154.097 22.5329 153.427 24.0492C152.757 25.5654 151.793 26.7702 150.535 27.6635C149.278 28.5451 147.761 28.9858 145.987 28.9858ZM137.418 28.4569V3.06836H140.027V14.123H139.745V28.4569H137.418ZM145.722 26.5704C147.05 26.5704 148.155 26.2354 149.037 25.5654C149.918 24.8955 150.577 23.9845 151.011 22.8326C151.458 21.669 151.681 20.3643 151.681 18.9186C151.681 17.4846 151.464 16.1917 151.029 15.0398C150.594 13.8879 149.93 12.9769 149.037 12.307C148.155 11.637 147.033 11.302 145.669 11.302C144.341 11.302 143.236 11.6252 142.355 12.2717C141.485 12.9182 140.833 13.8174 140.398 14.9692C139.963 16.1094 139.745 17.4258 139.745 18.9186C139.745 20.3878 139.963 21.7043 140.398 22.8679C140.833 24.0198 141.491 24.9249 142.372 25.5831C143.254 26.2413 144.37 26.5704 145.722 26.5704Z"
          fill="#2F2F34"
        />
        <path
          d="M130.251 28.4569V18.7423C130.251 17.6844 130.151 16.7147 129.951 15.8332C129.751 14.9399 129.428 14.1641 128.982 13.5059C128.547 12.8359 127.977 12.3187 127.271 11.9544C126.578 11.59 125.732 11.4078 124.733 11.4078C123.816 11.4078 123.005 11.5665 122.299 11.8838C121.606 12.2012 121.018 12.6596 120.536 13.259C120.066 13.8467 119.708 14.5637 119.461 15.41C119.214 16.2563 119.091 17.2201 119.091 18.3015L117.257 17.896C117.257 15.9448 117.598 14.3051 118.28 12.9769C118.961 11.6488 119.902 10.6438 121.101 9.96206C122.299 9.28033 123.675 8.93946 125.226 8.93946C126.366 8.93946 127.36 9.11577 128.206 9.46839C129.064 9.82101 129.787 10.297 130.374 10.8965C130.974 11.4959 131.456 12.1836 131.82 12.9593C132.185 13.7233 132.449 14.5402 132.614 15.41C132.778 16.2681 132.86 17.1261 132.86 17.9841V28.4569H130.251ZM116.481 28.4569V3.06836H118.826V17.4023H119.091V28.4569H116.481Z"
          fill="#2F2F34"
        />
        <path
          d="M105.078 28.9681C102.845 28.9681 101.005 28.4862 99.5594 27.5224C98.1254 26.5586 97.2438 25.2186 96.9147 23.5025L99.5594 23.0618C99.8415 24.1431 100.482 25.007 101.481 25.6535C102.492 26.2882 103.738 26.6056 105.219 26.6056C106.665 26.6056 107.805 26.3058 108.639 25.7064C109.474 25.0952 109.891 24.2665 109.891 23.2204C109.891 22.6327 109.756 22.1567 109.486 21.7923C109.227 21.4162 108.692 21.0695 107.881 20.7521C107.07 20.4347 105.859 20.0586 104.249 19.6237C102.521 19.1536 101.17 18.6834 100.194 18.2132C99.2185 17.7431 98.525 17.2024 98.1136 16.5912C97.7023 15.9682 97.4966 15.2101 97.4966 14.3168C97.4966 13.2354 97.8022 12.2892 98.4134 11.4782C99.0246 10.6554 99.8709 10.0207 100.952 9.57408C102.034 9.11568 103.291 8.88647 104.725 8.88647C106.159 8.88647 107.44 9.12155 108.569 9.59171C109.709 10.0501 110.626 10.6966 111.319 11.5311C112.013 12.3656 112.424 13.3353 112.553 14.4402L109.909 14.9163C109.732 13.7996 109.174 12.9181 108.234 12.2716C107.305 11.6134 106.124 11.2725 104.69 11.249C103.338 11.2138 102.239 11.4723 101.393 12.0248C100.547 12.5655 100.124 13.2883 100.124 14.1934C100.124 14.6988 100.276 15.1337 100.582 15.4981C100.888 15.8507 101.44 16.1857 102.239 16.503C103.05 16.8204 104.202 17.1671 105.695 17.5433C107.446 17.9899 108.821 18.4601 109.821 18.9537C110.82 19.4474 111.531 20.0292 111.954 20.6992C112.377 21.3692 112.589 22.1978 112.589 23.1852C112.589 24.9835 111.919 26.3999 110.579 27.4342C109.251 28.4568 107.417 28.9681 105.078 28.9681Z"
          fill="#2F2F34"
        />
        <path
          d="M83.8268 28.9857C82.3928 28.9857 81.188 28.7272 80.2125 28.21C79.2486 27.6928 78.5258 27.0052 78.0439 26.1472C77.5619 25.2891 77.321 24.3547 77.321 23.3438C77.321 22.3095 77.5267 21.428 77.9381 20.6992C78.3612 19.9587 78.9313 19.3534 79.6483 18.8832C80.377 18.4131 81.2174 18.0546 82.1695 17.8077C83.1333 17.5727 84.1971 17.367 85.3607 17.1906C86.5361 17.0026 87.6821 16.8439 88.7987 16.7146C89.9271 16.5736 90.9144 16.4384 91.7607 16.3091L90.8439 16.8733C90.8792 14.9927 90.5148 13.5998 89.7508 12.6948C88.9868 11.7897 87.6586 11.3372 85.7662 11.3372C84.4615 11.3372 83.3566 11.631 82.4516 12.2187C81.5583 12.8064 80.9295 13.735 80.5651 15.0044L78.0439 14.2639C78.4788 12.5596 79.3544 11.2373 80.6709 10.2969C81.9873 9.35663 83.6975 8.88647 85.8015 8.88647C87.5411 8.88647 89.0162 9.21558 90.2268 9.87381C91.4493 10.5203 92.3132 11.4606 92.8186 12.6948C93.0537 13.2472 93.2065 13.8643 93.277 14.546C93.3475 15.2277 93.3828 15.9212 93.3828 16.6265V28.4568H91.0731V23.6788L91.7431 23.9609C91.0966 25.5947 90.0917 26.8407 88.7282 27.6987C87.3647 28.5567 85.7309 28.9857 83.8268 28.9857ZM84.1265 26.7466C85.3372 26.7466 86.395 26.5292 87.3001 26.0943C88.2052 25.6594 88.9339 25.0658 89.4863 24.3135C90.0388 23.5495 90.3973 22.6915 90.5618 21.7394C90.7029 21.1282 90.7793 20.4582 90.791 19.7295C90.8028 18.989 90.8087 18.4366 90.8087 18.0722L91.796 18.5835C90.9144 18.701 89.9565 18.8186 88.9221 18.9361C87.8996 19.0537 86.8887 19.1888 85.8896 19.3416C84.9023 19.4944 84.009 19.6766 83.2097 19.8882C82.669 20.041 82.146 20.2584 81.6406 20.5405C81.1351 20.8109 80.7179 21.1752 80.3888 21.6336C80.0714 22.0921 79.9127 22.6621 79.9127 23.3438C79.9127 23.8963 80.0479 24.4311 80.3182 24.9483C80.6003 25.4654 81.047 25.8945 81.6582 26.2353C82.2812 26.5762 83.1039 26.7466 84.1265 26.7466Z"
          fill="#2F2F34"
        />
        <path
          d="M64.8639 28.9858C63.089 28.9858 61.5728 28.5451 60.3151 27.6635C59.0574 26.7702 58.0936 25.5654 57.4236 24.0492C56.7537 22.5329 56.4187 20.8227 56.4187 18.9186C56.4187 17.0262 56.7478 15.3219 57.406 13.8056C58.076 12.2893 59.0339 11.0904 60.2798 10.2089C61.5258 9.32734 63.0185 8.88657 64.7581 8.88657C66.5447 8.88657 68.0492 9.32147 69.2716 10.1913C70.494 11.0611 71.4167 12.2541 72.0397 13.7703C72.6744 15.2748 72.9918 16.9909 72.9918 18.9186C72.9918 20.811 72.6803 22.5212 72.0573 24.0492C71.4344 25.5654 70.5175 26.7702 69.3069 27.6635C68.0962 28.5451 66.6152 28.9858 64.8639 28.9858ZM65.1284 26.5704C66.4801 26.5704 67.5967 26.2413 68.4782 25.5831C69.3598 24.9249 70.018 24.0198 70.4529 22.8679C70.8878 21.7043 71.1052 20.3878 71.1052 18.9186C71.1052 17.4258 70.8878 16.1094 70.4529 14.9692C70.018 13.8174 69.3598 12.9182 68.4782 12.2717C67.6084 11.6252 66.5094 11.302 65.1812 11.302C63.8178 11.302 62.6894 11.637 61.7961 12.307C60.9028 12.9769 60.2387 13.8879 59.8038 15.0398C59.3807 16.1917 59.1691 17.4846 59.1691 18.9186C59.1691 20.3643 59.3865 21.669 59.8214 22.8326C60.2681 23.9845 60.9322 24.8955 61.8137 25.5654C62.6953 26.2354 63.8002 26.5704 65.1284 26.5704ZM71.1052 28.4569V14.123H70.8232V3.06836H73.4325V28.4569H71.1052Z"
          fill="#2F2F34"
        />
      </svg>
    `;
  }
}

class Components {
  /**
   *
   * @param {{
   *  children: string
   * }} param0
   * @returns
   */
  static card({ children }) {
    return /* html */ `
      <div class="card">
        <div class="card-body">
          ${children}
        </div>
      </div>
    `;
  }

  /**
   *
   * @param {{
   *  id: string,
   *  text: string,
   *  onclick?: string,
   *  icon?: string,
   *  iconPosition?: 'left' | 'right',
   *  disabled?: boolean,
   * }} param0
   * @returns
   */
  static button({ id, text, onclick, icon = '', iconPosition = 'right', disabled = false }) {
    return /* html */ `
      <button class="button" id="${id}" ${disabled ? 'disabled' : ''} ${
      onclick ? `onclick=\"${onclick}()\"` : ''
    }>
        ${$if(iconPosition === 'left', icon)}
        ${text}
        ${$if(iconPosition === 'right', icon)}
      </button>
    `;
  }

  /**
   * Simple notice banner
   * @param {{ type: 'info' | 'success', message: string }} param0
   * @returns {string}
   */
  static notice({ type, message }) {
    const typeClass = type === 'success' ? 'notice--success' : 'notice--info';
    return /* html */ `
      <div class="notice ${typeClass}">
        <div class="notice__content">${message}</div>
      </div>
    `;
  }

  /**
   * Render a health check item
   * @param {Task} task
   * @returns
   */
  static checkCriticalItem(task) {
    const created = formatDateTime(task.createdAt);
    const finished = formatDateTime(task.finishedAt);
    const duration = formatDuration(task.duration);
    return /* html */ `
      <div class="critical-item" role="listitem" aria-label="critical check item">
        <div class="critical-item__header">
          <span class="critical-item__icon" aria-hidden="true">${Icons.alertCircle}</span>
          <div class="critical-item__text">
            <div class="critical-item__title">
              Check [<code class="critical-item__name">${task.name}</code>]
              <span class="badge badge--critical">Critical</span>
            </div>
            <div class="critical-item__msg">${task.error || 'No details provided'}</div>
          </div>
        </div>
        <div class="critical-item__meta">
          ${$if(
            Boolean(created),
            /* html */ `<div><span class="meta-key">Created:</span> <time>${created}</time></div>`
          )}
          ${$if(
            Boolean(finished),
            /* html */ `<div><span class="meta-key">Finished:</span> <time>${finished}</time></div>`
          )}
          ${$if(
            task.duration != null,
            /* html */ `<div><span class="meta-key">Duration:</span> ${duration}</div>`
          )}
        </div>
      </div>
    `;
  }

  /**
   *
   * @param {Task[]} tasks
   * @returns
   */
  static tableNonCriticalItems(tasks) {
    return /* html */ `
      <div class="noncritical-list" role="list">
        ${$map(tasks, (task) => {
          const created = formatDateTime(task.createdAt);
          const finished = formatDateTime(task.finishedAt);
          const duration = formatDuration(task.duration);
          return /* html */ `
              <div class="noncritical-item" role="listitem" aria-label="minor check item">
                <div class="noncritical-item__header">
                  <span class="noncritical-item__icon" aria-hidden="true">${Icons.warning}</span>
                  <div class="noncritical-item__text">
                    <div class="noncritical-item__title">
                      Check [<code class="noncritical-item__name">${task.name}</code>]
                      <span class="badge badge--minor">Minor</span>
                    </div>
                    <div class="noncritical-item__msg">${task.error || 'No details provided'}</div>
                  </div>
                </div>
                <div class="noncritical-item__meta">
                  ${$if(
                    Boolean(created),
                    /* html */ `<div><span class="meta-key">Created:</span> <time>${created}</time></div>`
                  )}
                  ${$if(
                    Boolean(finished),
                    /* html */ `<div><span class="meta-key">Finished:</span> <time>${finished}</time></div>`
                  )}
                  ${$if(
                    task.duration != null,
                    /* html */ `<div><span class="meta-key">Duration:</span> ${duration}</div>`
                  )}
                </div>
              </div>
            `;
        })}
      </div>
    `;
  }
}

/**
 *
 * @param {Task[]} criticalTasks
 * @param {Task[]} nonCriticalTasks
 * @returns
 */
function buildHealthCheckReport(criticalTasks, nonCriticalTasks) {
  return /* html */ `
    <div class="title">
      ${Icons.wazuhDashboard}
      <div>
        <span class="server-is">server is</span>
        <div class="not-ready">not ready yet</div>
      </div>
    </div>
    ${$if(
      isRunning,
      Components.notice({
        type: 'info',
        message:
          'Running failed critical checks… This may take a few seconds. The button will be re-enabled when finished.',
      })
    )}
    ${$if(
      !isRunning && Array.isArray(tasks) && tasks.length > 0 && criticalTasks.length === 0,
      Components.notice({
        type: 'success',
        message:
          'No critical errors remain. In about 30 seconds, you can reload this page and you should be redirected to the application.',
      })
    )}
    ${$if(
      window.__CONFIG.documentationTroubleshootingLink !== undefined &&
        window.__CONFIG.documentationTroubleshootingLink.length > 0,
      /* html */ `<div>
          For more information, please visit the
          <a rel="noopener noreferrer" target="_blank" href="${window.__CONFIG.documentationTroubleshootingLink}">Troubleshooting</a>
          documentation.
        </div>`
    )}
    ${$if(
      criticalTasks.length > 0 || nonCriticalTasks.length > 0,
      /* html */ `
      ${Components.card({
        children: /* html */ `
          <div style="display: flex; align-items: center; gap: 0.25rem;">
            ${Icons.healthCheck}
            <div class="healthcheck-title">
              Health Check
            </div>
          </div>
          ${$if(
            tasks && tasks.length > 0,
            Components.button({
              id: HealthCheckDocument.BTN_EXPORT_ID,
              text: 'Download checks',
              onclick: downloadHealthChecksAsJSONFile.name,
              icon: Icons.download,
            })
          )}
        `,
      })}
      `
    )}

    ${$if(
      criticalTasks.length > 0,
      /* html */ `${Components.card({
        children: /* html */ `
        <div style="display: flex; align-items: center; gap: 0.25rem;">
          ${Icons.wrench}
          <div>There are some <b>critical errors that require to be solved</b>,<br /> ensure the problems are solved and run the failed critical checks:</div>
        </div>
        ${Components.button({
          id: HealthCheckDocument.BTN_RUN_FAILED_CRITICAL_CHECKS_ID,
          text: isRunning ? 'Running failed critical checks…' : 'Run failed critical checks',
          onclick: runHealthCheck.name,
          icon: $if(isRunning, /* html */ `<span class="spinner" aria-hidden="true"></span>`),
          iconPosition: 'left',
          disabled: isRunning,
        })}
      `,
      })}
      `
    )}

    ${$if(
      criticalTasks.length > 0 || nonCriticalTasks.length > 0,
      /* html */ `
      ${Components.card({
        children: /* html */ `
          <div style="width: 100%;">
            <div class="critical-list" role="list">
              ${$map(criticalTasks, (task) => Components.checkCriticalItem(task))}
            </div>
            ${$if(
              nonCriticalTasks.length > 0,
              /* html */ `
                <div style="margin-block: 2rem;">There are some <span style="color: var(--yellow); font-weight: var(--semi-bold);">minor errors</span>. Some features could require to solve these problems to work:</div>
                ${Components.tableNonCriticalItems(nonCriticalTasks)}
              `
            )}
          </div>
        `,
      })}
      `
    )}
  `;
}

/**
 * Function to update HTML content
 * @param {Task[]} data
 */
function renderHealthCheckSummary(data) {
  tasks = data;
  const criticalTasks = getCriticalTasks(tasks);
  const nonCriticalTasks = getNonCriticalTasks(tasks);
  const content = buildHealthCheckReport(criticalTasks, nonCriticalTasks);
  HealthCheckDocument.setRootContent(content);
}

// Auto-call the function when the page loads
window.addEventListener('load', () => {
  UseCases.retrieveHealthCheckTasks().then((tasks) => renderHealthCheckSummary(tasks));
});
