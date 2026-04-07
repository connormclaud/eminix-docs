import { BookOpen, Zap, AlertTriangle, CheckCircle2 } from 'lucide-react';

const concepts = [
  {
    icon: <BookOpen className="text-cyan-400" size={24} />,
    title: 'What is a Gap Buffer?',
    content: `A Gap Buffer is a data structure used by text editors (like Emacs, Sublime Text, and others) to efficiently represent editable text. It stores text in a single array with a "gap" — a region of unused space — where the cursor is currently positioned.`,
    keyPoint: 'Think of it as a piece of paper with a blank space you can move around. You type into the blank space!',
  },
  {
    icon: <Zap className="text-yellow-400" size={24} />,
    title: 'Why Use a Gap Buffer?',
    content: `Most text editing happens at the cursor position. With a simple array, inserting a character requires shifting ALL characters after the cursor — that's O(n) for every keystroke! A Gap Buffer makes typing at the cursor O(1) amortized, because the gap is already there waiting.`,
    keyPoint: 'Typing at the cursor is O(1). Moving the cursor is O(n), but you do it far less often than typing!',
  },
  {
    icon: <AlertTriangle className="text-orange-400" size={24} />,
    title: 'When Does It Slow Down?',
    content: `Moving the cursor requires shifting the gap, which is O(n) in the distance moved. If a user rapidly moves the cursor around the document and types one character each time, performance degrades. However, real typing patterns make this rare — users type many characters per cursor position.`,
    keyPoint: 'Fast typing at one spot. Slower when jumping around the document constantly.',
  },
  {
    icon: <CheckCircle2 className="text-emerald-400" size={24} />,
    title: 'When the Gap Runs Out',
    content: `When the gap is full, the buffer needs to grow — typically by doubling its size and relocating the gap. This is O(n) but happens rarely (amortized O(1) per insert, just like Python's list.append). The gap also shrinks as you delete text, which is very fast.`,
    keyPoint: 'Growing the buffer is like Python list resizing — occasional but amortized to O(1).',
  },
];

export default function Concepts() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {concepts.map((c, i) => (
        <div
          key={i}
          className="bg-editor-mid rounded-2xl p-6 border border-white/5 hover:border-white/10 transition-colors"
        >
          <div className="flex items-center gap-3 mb-3">
            {c.icon}
            <h3 className="text-lg font-semibold text-text-primary">{c.title}</h3>
          </div>
          <p className="text-text-secondary text-sm leading-relaxed mb-3">{c.content}</p>
          <div className="bg-editor-dark rounded-lg p-3 border-l-2 border-cursor">
            <p className="text-cursor text-sm font-medium">💡 {c.keyPoint}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
