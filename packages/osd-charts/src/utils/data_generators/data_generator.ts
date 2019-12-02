import { Simple1DNoise, RandomNumberGenerator } from './simple_noise';

export class DataGenerator {
  private generator: Simple1DNoise;
  private frequency: number;
  constructor(frequency = 500, randomNumberGenerator?: RandomNumberGenerator) {
    this.generator = new Simple1DNoise(randomNumberGenerator);
    this.frequency = frequency;
  }
  generateSimpleSeries(totalPoints = 50, groupIndex = 1, groupPrefix = '') {
    const group = String.fromCharCode(97 + groupIndex);
    const dataPoints = new Array(totalPoints).fill(0).map((_, i) => {
      return {
        x: i,
        y: 3 + Math.sin(i / this.frequency) + this.generator.getValue(i),
        g: `${groupPrefix}${group}`,
      };
    });
    return dataPoints;
  }
  generateGroupedSeries(totalPoints = 50, totalGroups = 2, groupPrefix = '') {
    const groups = new Array(totalGroups).fill(0).map((group, i) => {
      // eslint-disable-line
      return this.generateSimpleSeries(totalPoints, i, groupPrefix);
    });
    return groups.reduce((acc, curr) => [...acc, ...curr]);
  }
}
