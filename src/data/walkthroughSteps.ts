import { GapBuffer, type GapBufferSnapshot } from '@/utils/gapBuffer';

export type WalkthroughStep = {
  title: string;
  description: string;
  label: string;
  snapshot: GapBufferSnapshot;
};

function createStep(
  title: string,
  label: string,
  description: string,
  snapshot: GapBufferSnapshot
): WalkthroughStep {
  return { title, label, description, snapshot };
}

export function buildWalkthroughSteps() {
  const gapBuffer = new GapBuffer(12);
  const steps: WalkthroughStep[] = [];

  steps.push(
    createStep(
      'Step 1: Empty Buffer',
      'new GapBuffer(12)',
      'We start with an empty buffer of capacity 12. The gap spans the entire array, so the cursor begins at position 0 with 12 free cells ready for insertion.',
      gapBuffer.getSnapshot()
    )
  );

  gapBuffer.insert('Hello');
  steps.push(
    createStep(
      'Step 2: Type "Hello"',
      'insert("Hello")',
      'Each character fills the gap from the left. After inserting 5 characters, the cursor is at position 5 and 7 gap cells remain.',
      gapBuffer.getSnapshot()
    )
  );

  gapBuffer.insert(' World');
  steps.push(
    createStep(
      'Step 3: Type " World"',
      'insert(" World")',
      'We continue typing at the same cursor position. The text becomes "Hello World", the cursor moves to position 11, and only 1 gap cell remains.',
      gapBuffer.getSnapshot()
    )
  );

  gapBuffer.moveLeft(5);
  steps.push(
    createStep(
      'Step 4: Move Cursor Left 5',
      'moveLeft(5)',
      'We move the cursor left 5 positions so the gap sits between the space and "World". The text stays "Hello World", but the gap shifts left to cursor position 6.',
      gapBuffer.getSnapshot()
    )
  );

  gapBuffer.ensureGap('Beautiful '.length);
  steps.push(
    createStep(
      'Step 5: Grow The Buffer',
      'ensureGap(10)',
      'The gap is too small to hold "Beautiful ". The buffer grows from capacity 12 to 24, keeping the cursor at position 6 and expanding the gap to 13 cells.',
      gapBuffer.getSnapshot()
    )
  );

  gapBuffer.insert('Beautiful ');
  steps.push(
    createStep(
      'Step 6: Type "Beautiful "',
      'insert("Beautiful ")',
      'Now the insert fits cleanly into the enlarged gap. The text becomes "Hello Beautiful World", the cursor advances to position 16, and 3 gap cells remain.',
      gapBuffer.getSnapshot()
    )
  );

  gapBuffer.deleteBack('Beautiful '.length);
  steps.push(
    createStep(
      'Step 7: Delete Back 10',
      'deleteBack(10)',
      'Backspace removes "Beautiful " by expanding the gap to the left. No surrounding text needs to shift, and the text returns to "Hello World" with the cursor back at position 6.',
      gapBuffer.getSnapshot()
    )
  );

  return steps;
}

export const walkthroughSteps = buildWalkthroughSteps();
