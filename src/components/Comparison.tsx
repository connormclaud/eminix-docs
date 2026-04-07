import { ArrowDown, ArrowUp } from 'lucide-react';

const comparisons = [
  { operation: 'Insert at cursor', gapBuffer: 'O(1)', array: 'O(n)', rope: 'O(log n)', gbGood: true },
  { operation: 'Delete at cursor', gapBuffer: 'O(1)', array: 'O(n)', rope: 'O(log n)', gbGood: true },
  { operation: 'Move cursor', gapBuffer: 'O(n)', array: 'O(1)', rope: 'O(log n)', gbGood: false },
  { operation: 'Insert at start', gapBuffer: 'O(n)', array: 'O(n)', rope: 'O(log n)', gbGood: false },
  { operation: 'Memory usage', gapBuffer: 'Low', array: 'Low', rope: 'Higher', gbGood: true },
  { operation: 'Implementation', gapBuffer: 'Simple', array: 'Simplest', rope: 'Complex', gbGood: true },
  { operation: 'Cache friendly', gapBuffer: 'Yes', array: 'Yes', rope: 'No', gbGood: true },
];

export default function Comparison() {
  return (
    <div className="bg-editor-mid rounded-2xl border border-white/5 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left px-4 py-3 text-text-secondary font-medium">Operation</th>
              <th className="text-center px-4 py-3 text-cursor font-semibold">Gap Buffer 🏆</th>
              <th className="text-center px-4 py-3 text-text-secondary font-medium">Array/List</th>
              <th className="text-center px-4 py-3 text-text-secondary font-medium">Rope</th>
            </tr>
          </thead>
          <tbody>
            {comparisons.map((row, i) => (
              <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3 text-text-primary font-medium">{row.operation}</td>
                <td className="px-4 py-3 text-center">
                  <span className="font-mono text-cursor font-bold">{row.gapBuffer}</span>
                  {row.gbGood && (
                    <span className="ml-1.5 inline-block">
                      <ArrowDown size={12} className="text-emerald-400 inline" />
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-center font-mono text-text-secondary">{row.array}</td>
                <td className="px-4 py-3 text-center font-mono text-text-secondary">{row.rope}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 bg-editor-dark border-t border-white/5">
        <div className="flex items-start gap-2 text-xs text-text-secondary">
          <ArrowUp size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" />
          <span><strong className="text-emerald-400">Green arrow</strong> = Gap Buffer performs best for this operation</span>
        </div>
        <div className="flex items-start gap-2 text-xs text-text-secondary mt-1">
          <ArrowDown size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
          <span>Gap Buffer is <strong className="text-red-400">not ideal</strong> for random access / frequent cursor jumping</span>
        </div>
      </div>
    </div>
  );
}
