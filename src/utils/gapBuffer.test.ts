import { describe, expect, it } from 'vitest';
import { buildWalkthroughSteps } from '@/data/walkthroughSteps';
import { GapBuffer } from '@/utils/gapBuffer';

describe('GapBuffer', () => {
  it('inserts into an existing gap without resizing', () => {
    const gapBuffer = new GapBuffer(6);
    const result = gapBuffer.insert('abc');

    expect(result.grew).toBe(false);
    expect(gapBuffer.getText()).toBe('abc');
    expect(gapBuffer.gapStart).toBe(3);
    expect(gapBuffer.gapEnd).toBe(6);
    expect(gapBuffer.gapSize).toBe(3);
    gapBuffer.assertValid();
  });

  it('grows before inserting when the gap is full', () => {
    const gapBuffer = new GapBuffer(4);

    gapBuffer.insert('abcd');
    const result = gapBuffer.insert('Z');

    expect(result.grew).toBe(true);
    expect(result.previousCapacity).toBe(4);
    expect(result.capacity).toBe(8);
    expect(gapBuffer.getText()).toBe('abcdZ');
    expect(gapBuffer.capacity).toBe(8);
    expect(gapBuffer.gapSize).toBe(3);
    gapBuffer.assertValid();
  });

  it('moves the gap left and right without losing text', () => {
    const gapBuffer = new GapBuffer(8);

    gapBuffer.insert('abcd');
    gapBuffer.moveLeft(2);
    expect(gapBuffer.gapStart).toBe(2);
    expect(gapBuffer.gapEnd).toBe(6);
    expect(gapBuffer.getText()).toBe('abcd');

    gapBuffer.moveRight(1);
    expect(gapBuffer.gapStart).toBe(3);
    expect(gapBuffer.gapEnd).toBe(7);
    expect(gapBuffer.getText()).toBe('abcd');
    gapBuffer.assertValid();
  });

  it('expands the gap correctly on backspace and forward delete', () => {
    const gapBuffer = new GapBuffer(10);

    gapBuffer.insert('abcde');
    gapBuffer.moveLeft(2);

    expect(gapBuffer.getText()).toBe('abcde');

    gapBuffer.deleteBack(1);
    expect(gapBuffer.getText()).toBe('abde');

    gapBuffer.deleteForward(1);
    expect(gapBuffer.getText()).toBe('abe');
    gapBuffer.assertValid();
  });
});

describe('walkthroughSteps', () => {
  it('produces valid, semantically consistent snapshots', () => {
    const steps = buildWalkthroughSteps();

    expect(steps).toHaveLength(7);
    expect(steps[0].snapshot.capacity).toBe(12);
    expect(steps[2].snapshot.text).toBe('Hello World');
    expect(steps[2].snapshot.gapSize).toBe(1);
    expect(steps[3].snapshot.gapStart).toBe(6);
    expect(steps[4].snapshot.capacity).toBe(24);
    expect(steps[4].snapshot.gapSize).toBe(13);
    expect(steps[5].snapshot.text).toBe('Hello Beautiful World');
    expect(steps[6].snapshot.text).toBe('Hello World');
    expect(steps[6].snapshot.gapStart).toBe(6);

    for (const step of steps) {
      const gapBuffer = GapBuffer.fromSnapshot(step.snapshot);
      expect(gapBuffer.getText()).toBe(step.snapshot.text);
      gapBuffer.assertValid();
    }
  });
});
