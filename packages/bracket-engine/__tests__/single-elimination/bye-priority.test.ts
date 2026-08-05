import { describe, it, expect } from 'vitest';
import { generateByePriority } from '../../src/single-elimination/bye-priority';

const ALL_SIZES = [2, 4, 8, 16, 32, 64, 128, 256];

describe('generateByePriority', () => {
  it('bracket 2 → [0]', () => {
    expect(generateByePriority(2)).toEqual([0]);
  });

  it('bracket 4 → [0]', () => {
    expect(generateByePriority(4)).toEqual([0]);
  });

  it('bracket 8 → [0, 7, 4]', () => {
    expect(generateByePriority(8)).toEqual([0, 7, 4]);
  });

  it('bracket 16 → [0, 15, 8, 7, 12, 3, 11]', () => {
    expect(generateByePriority(16)).toEqual([0, 15, 8, 7, 12, 3, 11]);
  });

  it('bracket 32 → 15 elements starting with 0, 31, 16, 15, 24', () => {
    const p = generateByePriority(32);
    expect(p).toHaveLength(15);
    expect(p.slice(0, 5)).toEqual([0, 31, 16, 15, 24]);
  });

  it('bracket 64 → 31 elements starting with 0, 63, 32, 31, 48', () => {
    const p = generateByePriority(64);
    expect(p).toHaveLength(31);
    expect(p.slice(0, 5)).toEqual([0, 63, 32, 31, 48]);
  });

  it('bracket 128 → 63 elements starting with 0, 127, 64, 63, 96', () => {
    const p = generateByePriority(128);
    expect(p).toHaveLength(63);
    expect(p.slice(0, 5)).toEqual([0, 127, 64, 63, 96]);
  });

  it('bracket 256 → 127 elements starting with 0, 255, 128, 127, 192', () => {
    const p = generateByePriority(256);
    expect(p).toHaveLength(127);
    expect(p.slice(0, 5)).toEqual([0, 255, 128, 127, 192]);
  });

  it('throws for unsupported bracket sizes', () => {
    expect(() => generateByePriority(3)).toThrow('unsupported bracket size 3');
    expect(() => generateByePriority(512)).toThrow('unsupported bracket size 512');
    expect(() => generateByePriority(0)).toThrow('unsupported bracket size 0');
    expect(() => generateByePriority(-4)).toThrow('unsupported bracket size -4');
  });

  it('returns a copy (mutations do not affect reference)', () => {
    const a = generateByePriority(8);
    a[0] = 999;
    const b = generateByePriority(8);
    expect(b[0]).toBe(0);
  });

  it('every element is a valid 0-based position index', () => {
    for (const size of ALL_SIZES) {
      const p = generateByePriority(size);
      for (const pos of p) {
        expect(pos).toBeGreaterThanOrEqual(0);
        expect(pos).toBeLessThan(size);
      }
    }
  });

  it('no duplicate positions within each bracket', () => {
    for (const size of ALL_SIZES) {
      const p = generateByePriority(size);
      expect(new Set(p).size).toBe(p.length);
    }
  });

  it('each position belongs to a unique match', () => {
    for (const size of ALL_SIZES) {
      const p = generateByePriority(size);
      const matches = p.map((pos) => Math.floor(pos / 2));
      expect(new Set(matches).size).toBe(matches.length);
    }
  });

  it('bracket 2 has 1 element, all others have size/2 - 1', () => {
    expect(generateByePriority(2)).toHaveLength(1);
    for (const size of [4, 8, 16, 32, 64, 128, 256]) {
      expect(generateByePriority(size)).toHaveLength(size / 2 - 1);
    }
  });
});
