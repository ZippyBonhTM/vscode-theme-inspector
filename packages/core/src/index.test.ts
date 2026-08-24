import { describe, expect, it } from 'vitest';

import { version } from '../package.json';
import { CORE_VERSION } from './index';

describe('CORE_VERSION', () => {
  it('matches the version declared in package.json', () => {
    expect(CORE_VERSION).toBe(version);
  });
});
