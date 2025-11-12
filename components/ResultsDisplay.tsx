'use client';

import { BeamResults } from '@/lib/beamAnalysis';

interface ResultsDisplayProps {
  results: BeamResults;
}

export default function ResultsDisplay({ results }: ResultsDisplayProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Natural Frequencies</h3>
      <div className="grid grid-cols-3 gap-4">
        {results.naturalFrequencies.map((freq, index) => (
          <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Mode {index + 1}</div>
            <div className="text-2xl font-bold text-primary-600">
              {freq >= 1000
                ? `${(freq / 1000).toFixed(4)} kHz`
                : `${freq.toFixed(4)} Hz`
              }
            </div>
            <div className="text-xs text-gray-500 mt-1">
              bL = {results.modeShapes[index]?.bL.toFixed(4)}
            </div>
            <div className="text-[10px] text-gray-400">
              Tip: Frequencies change with E, ρ, width, depth, and length. Mode-shape curves depend on beam type and length only (normalized).
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

