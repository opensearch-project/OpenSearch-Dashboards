/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License. */

import { BBox, BBoxCalculator } from './bbox_calculator';

export class DOMTextBBoxCalculator implements BBoxCalculator {
  private attachedRoot: HTMLElement;
  private offscreenCanvas: HTMLSpanElement;

  constructor(rootElement?: HTMLElement) {
    this.offscreenCanvas = document.createElement('span');
    this.offscreenCanvas.style.position = 'absolute';
    this.offscreenCanvas.style.top = '-9999px';
    this.offscreenCanvas.style.left = '-9999px';

    this.attachedRoot = rootElement || document.documentElement;
    this.attachedRoot.appendChild(this.offscreenCanvas);
  }
  compute(text: string, padding: number, fontSize = 16, fontFamily = 'Arial', lineHeight = 1, fontWeight = 400): BBox {
    this.offscreenCanvas.style.fontSize = `${fontSize}px`;
    this.offscreenCanvas.style.fontFamily = fontFamily;
    this.offscreenCanvas.style.fontWeight = `${fontWeight}`;
    this.offscreenCanvas.style.lineHeight = `${lineHeight}px`;
    this.offscreenCanvas.innerHTML = text;

    return {
      width: Math.ceil(this.offscreenCanvas.clientWidth + padding),
      height: Math.ceil(this.offscreenCanvas.clientHeight),
    };
  }
  destroy(): void {
    this.attachedRoot.removeChild(this.offscreenCanvas);
  }
}
