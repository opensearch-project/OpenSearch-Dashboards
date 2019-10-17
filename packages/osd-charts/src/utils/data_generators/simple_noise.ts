export type RandomNumberGenerator = () => number;

export class Simple1DNoise {
  private maxVertices: number;
  private maxVerticesMask: number;
  private amplitude: number;
  private scale: number;
  private getRandomNumber: RandomNumberGenerator;

  constructor(randomNumberGenerator?: RandomNumberGenerator, maxVertices = 256, amplitude = 5.1, scale = 0.6) {
    this.getRandomNumber = randomNumberGenerator ? randomNumberGenerator : Math.random;
    this.maxVerticesMask = maxVertices - 1;
    this.amplitude = amplitude;
    this.scale = scale;
    this.maxVertices = maxVertices;
  }

  getValue(x: number) {
    const r = new Array(this.maxVertices).fill(0).map(this.getRandomNumber);
    const scaledX = x * this.scale;
    const xFloor = Math.floor(scaledX);
    const t = scaledX - xFloor;
    const tRemapSmoothstep = t * t * (3 - 2 * t);

    // tslint:disable-next-line:no-bitwise
    const xMin = xFloor & this.maxVerticesMask;
    // tslint:disable-next-line:no-bitwise
    const xMax = (xMin + 1) & this.maxVerticesMask;

    const y = this.lerp(r[xMin], r[xMax], tRemapSmoothstep);

    return y * this.amplitude;
  }

  private lerp(a: number, b: number, t: number) {
    return a * (1 - t) + b * t;
  }
}
