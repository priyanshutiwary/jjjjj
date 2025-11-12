'use client';

import { BeamType } from '@/lib/beamAnalysis';

interface BeamTypeSelectorProps {
  value: BeamType;
  onChange: (type: BeamType) => void;
}

const beamTypes: { value: BeamType; label: string; description: string }[] = [
  {
    value: 'cantilever',
    label: 'Cantilever',
    description: 'Fixed at one end, free at the other',
  },
  {
    value: 'simply-supported',
    label: 'Simply Supported',
    description: 'Pinned at both ends',
  },
  {
    value: 'fixed-fixed',
    label: 'Fixed-Fixed',
    description: 'Fixed at both ends',
  },
  {
    value: 'fixed-pinned',
    label: 'Fixed-Pinned',
    description: 'Fixed at one end, pinned at the other',
  },
];

export default function BeamTypeSelector({ value, onChange }: BeamTypeSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Beam Type
      </label>
      <div className="grid grid-cols-2 gap-3">
        {beamTypes.map((type) => (
          <button
            key={type.value}
            type="button"
            onClick={() => onChange(type.value)}
            className={`p-4 rounded-lg border-2 transition-all ${
              value === type.value
                ? 'border-primary-600 bg-primary-50 text-primary-900'
                : 'border-gray-200 bg-white text-gray-700 hover:border-primary-300 hover:bg-primary-50'
            }`}
          >
            <div className="font-semibold">{type.label}</div>
            <div className="text-xs text-gray-500 mt-1">{type.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

