import seedrandom from 'seedrandom';

import { DataGenerator } from '../src';

export const getRandomNumber = seedrandom(process.env.RNG_SEED || undefined);

export class SeededDataGenerator extends DataGenerator {
  constructor(frequency = 500) {
    super(frequency, getRandomNumber);
  }
}
