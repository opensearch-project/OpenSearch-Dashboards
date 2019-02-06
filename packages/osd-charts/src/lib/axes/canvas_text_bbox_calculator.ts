import { none, Option, some } from 'fp-ts/lib/Option';
import { BBox, BBoxCalculator } from './bbox_calculator';

export class CanvasTextBBoxCalculator implements BBoxCalculator {
  private attachedRoot: HTMLElement;
  private offscreenCanvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D | null;
  private scaledFontSize: number;

  constructor(rootElement?: HTMLElement) {
    this.offscreenCanvas = document.createElement('canvas');
    this.context = this.offscreenCanvas.getContext('2d');
    this.attachedRoot = rootElement || document.documentElement;
    this.attachedRoot.appendChild(this.offscreenCanvas);
    this.scaledFontSize = 100;
  }
  compute(text: string, fontSize = 16, fontFamily = 'Arial'): Option<BBox> {
    if (!this.context) {
      return none;
    }

    // We scale the text up to get a more accurate computation of the width of the text
    // because `measureText` can vary a lot between browsers.
    const scalingFactor = this.scaledFontSize / fontSize;
    this.context.font = `${this.scaledFontSize}px ${fontFamily}`;
    const measure = this.context.measureText(text);

    return some({
      width: measure.width / scalingFactor,
      height: fontSize,
    });
  }
  destroy(): void {
    this.attachedRoot.removeChild(this.offscreenCanvas);
  }
}
