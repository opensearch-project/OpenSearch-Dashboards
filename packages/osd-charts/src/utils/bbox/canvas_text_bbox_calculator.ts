import { none, Option, some } from 'fp-ts/lib/Option';
import { BBox, BBoxCalculator } from './bbox_calculator';

export class CanvasTextBBoxCalculator implements BBoxCalculator {
  context: CanvasRenderingContext2D | null;
  private attachedRoot: HTMLElement;
  private offscreenCanvas: HTMLCanvasElement;
  private scaledFontSize: number;

  constructor(rootElement?: HTMLElement, scaledFontSize: number = 100) {
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.style.position = 'absolute';
    this.offscreenCanvas.style.top = '-9999px';

    this.context = this.offscreenCanvas.getContext('2d');
    this.attachedRoot = rootElement || document.documentElement;
    this.attachedRoot.appendChild(this.offscreenCanvas);
    this.scaledFontSize = scaledFontSize;
  }
  compute(text: string, padding: number, fontSize = 16, fontFamily = 'Arial'): Option<BBox> {
    if (!this.context) {
      return none;
    }

    // Padding should be at least one to avoid browser measureText inconsistencies
    if (padding < 1) {
      padding = 1;
    }

    // We scale the text up to get a more accurate computation of the width of the text
    // because `measureText` can vary a lot between browsers.
    const scalingFactor = this.scaledFontSize / fontSize;
    this.context.font = `${this.scaledFontSize}px ${fontFamily}`;
    const measure = this.context.measureText(text);

    return some({
      width: measure.width / scalingFactor + padding,
      height: fontSize,
    });
  }
  destroy(): void {
    this.attachedRoot.removeChild(this.offscreenCanvas);
  }
}
