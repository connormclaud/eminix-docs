export type GapCell = string | null;

export type GapBufferSnapshot = {
  buffer: GapCell[];
  gapStart: number;
  gapEnd: number;
  text: string;
  length: number;
  gapSize: number;
  capacity: number;
};

export class GapBuffer {
  buffer: GapCell[];
  gapStart: number;
  gapEnd: number;

  constructor(capacity: number = 16) {
    if (!Number.isInteger(capacity) || capacity <= 0) {
      throw new Error(`GapBuffer capacity must be a positive integer. Received: ${capacity}`);
    }

    this.buffer = new Array(capacity).fill(null);
    this.gapStart = 0;
    this.gapEnd = capacity;
  }

  static fromSnapshot(snapshot: Pick<GapBufferSnapshot, 'buffer' | 'gapStart' | 'gapEnd'>) {
    const next = new GapBuffer(snapshot.buffer.length);
    next.buffer = [...snapshot.buffer];
    next.gapStart = snapshot.gapStart;
    next.gapEnd = snapshot.gapEnd;
    next.assertValid();
    return next;
  }

  clone() {
    return GapBuffer.fromSnapshot(this.getSnapshot());
  }

  get capacity() {
    return this.buffer.length;
  }

  get length() {
    return this.buffer.length - (this.gapEnd - this.gapStart);
  }

  get gapSize() {
    return this.gapEnd - this.gapStart;
  }

  get cursor() {
    return this.gapStart;
  }

  assertValid() {
    if (this.gapStart < 0 || this.gapEnd < 0 || this.gapStart > this.gapEnd || this.gapEnd > this.buffer.length) {
      throw new Error(`Invalid gap bounds: [${this.gapStart}, ${this.gapEnd}) for buffer length ${this.buffer.length}`);
    }

    for (let i = 0; i < this.buffer.length; i++) {
      const isGap = i >= this.gapStart && i < this.gapEnd;
      const cell = this.buffer[i];

      if (isGap && cell !== null) {
        throw new Error(`Gap cell ${i} must be null.`);
      }

      if (!isGap && cell === null) {
        throw new Error(`Text cell ${i} must contain a character.`);
      }
    }
  }

  getText() {
    return this.buffer
      .filter((cell, index) => (index < this.gapStart || index >= this.gapEnd) && cell !== null)
      .join('');
  }

  getCells() {
    return this.buffer.map((char, index) => ({
      index,
      char,
      isGap: index >= this.gapStart && index < this.gapEnd,
    }));
  }

  getSnapshot(): GapBufferSnapshot {
    return {
      buffer: [...this.buffer],
      gapStart: this.gapStart,
      gapEnd: this.gapEnd,
      text: this.getText(),
      length: this.length,
      gapSize: this.gapSize,
      capacity: this.capacity,
    };
  }

  ensureGap(needed: number) {
    if (needed <= 0) {
      return { grew: false, previousCapacity: this.capacity, capacity: this.capacity };
    }

    if (this.gapSize >= needed) {
      return { grew: false, previousCapacity: this.capacity, capacity: this.capacity };
    }

    const previousCapacity = this.capacity;
    const textAfter = this.buffer.slice(this.gapEnd) as string[];
    const textLength = this.length;
    let nextCapacity = this.capacity;

    while (nextCapacity - textLength < needed) {
      nextCapacity *= 2;
    }

    const nextBuffer: GapCell[] = new Array(nextCapacity).fill(null);

    for (let i = 0; i < this.gapStart; i++) {
      nextBuffer[i] = this.buffer[i];
    }

    const nextGapEnd = nextCapacity - textAfter.length;
    for (let i = 0; i < textAfter.length; i++) {
      nextBuffer[nextGapEnd + i] = textAfter[i];
    }

    this.buffer = nextBuffer;
    this.gapEnd = nextGapEnd;
    this.assertValid();

    return { grew: true, previousCapacity, capacity: this.capacity };
  }

  moveGap(newPos: number) {
    if (!Number.isInteger(newPos) || newPos < 0 || newPos > this.length) {
      throw new Error(`Cannot move gap to ${newPos}. Valid cursor range is 0..${this.length}.`);
    }

    while (this.gapStart > newPos) {
      this.gapStart--;
      this.gapEnd--;
      this.buffer[this.gapEnd] = this.buffer[this.gapStart];
      this.buffer[this.gapStart] = null;
    }

    while (this.gapStart < newPos) {
      this.buffer[this.gapStart] = this.buffer[this.gapEnd];
      this.buffer[this.gapEnd] = null;
      this.gapStart++;
      this.gapEnd++;
    }

    this.assertValid();
  }

  moveLeft(count: number = 1) {
    const distance = Math.max(0, Math.min(count, this.gapStart));
    this.moveGap(this.gapStart - distance);
    return { moved: distance };
  }

  moveRight(count: number = 1) {
    const distance = Math.max(0, Math.min(count, this.length - this.gapStart));
    this.moveGap(this.gapStart + distance);
    return { moved: distance };
  }

  insert(text: string) {
    if (!text) {
      return { inserted: 0, grew: false, previousCapacity: this.capacity, capacity: this.capacity };
    }

    const resize = this.ensureGap(text.length);

    for (const char of text) {
      this.buffer[this.gapStart] = char;
      this.gapStart++;
    }

    this.assertValid();

    return {
      inserted: text.length,
      grew: resize.grew,
      previousCapacity: resize.previousCapacity,
      capacity: this.capacity,
    };
  }

  deleteBack(count: number) {
    const toDelete = Math.max(0, Math.min(count, this.gapStart));

    for (let i = 0; i < toDelete; i++) {
      this.gapStart--;
      this.buffer[this.gapStart] = null;
    }

    this.assertValid();
    return { deleted: toDelete };
  }

  deleteForward(count: number) {
    const textAfter = this.buffer.length - this.gapEnd;
    const toDelete = Math.max(0, Math.min(count, textAfter));

    for (let i = 0; i < toDelete; i++) {
      this.buffer[this.gapEnd] = null;
      this.gapEnd++;
    }

    this.assertValid();
    return { deleted: toDelete };
  }
}
