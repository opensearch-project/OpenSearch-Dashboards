import seedrandom from 'seedrandom';

import { DataGenerator } from '../../src';

/**
 * Forces object to be partial type for mocking tests
 *
 * SHOULD NOT BE USED OUTSIDE OF TESTS!!!
 *
 * @param obj partial object type
 */
export const forcedType = <T extends object>(obj: Partial<T>): T => {
  return obj as T;
};

export const getRandomNumber = seedrandom(process.env.RNG_SEED || undefined);

export class SeededDataGenerator extends DataGenerator {
  constructor(frequency = 500) {
    super(frequency, getRandomNumber);
  }
}
