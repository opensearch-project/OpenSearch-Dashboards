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

// not sure where to specify this, required for tests
declare global {
  interface SVGElement {
    getBBox(): SVGRect;
  }
}

export class SvgTextBBoxCalculator implements BBoxCalculator {
  svgElem: SVGSVGElement;
  textElem: SVGTextElement;
  attachedRoot: HTMLElement;
  textNode: Text;
  // TODO specify styles for text
  // TODO specify how to hide the svg from the current dom view
  // like moving it a -9999999px
  constructor(rootElement?: HTMLElement) {
    const xmlns = 'http://www.w3.org/2000/svg';
    this.svgElem = document.createElementNS(xmlns, 'svg');
    this.textElem = document.createElementNS(xmlns, 'text');
    this.svgElem.appendChild(this.textElem);
    this.textNode = document.createTextNode('');
    this.textElem.appendChild(this.textNode);
    this.attachedRoot = rootElement || document.documentElement;
    this.attachedRoot.appendChild(this.svgElem);
  }
  compute(text: string): BBox {
    this.textNode.textContent = text;
    const rect = this.textElem.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
    };
  }
  destroy(): void {
    this.attachedRoot.removeChild(this.svgElem);
  }
}
