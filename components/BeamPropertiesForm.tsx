'use client';

import { BeamProperties } from '@/lib/beamAnalysis';

interface BeamPropertiesFormProps {
  properties: BeamProperties;
  onChange: (properties: BeamProperties) => void;
}

export default function BeamPropertiesForm({ properties, onChange }: BeamPropertiesFormProps) {
  const updateProperty = (key: keyof BeamProperties, value: number | undefined) => {
    onChange({ ...properties, [key]: value });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">Beam Dimensions</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Length (m)
          </label>
          <input
            type="number"
            value={properties.length}
            onChange={(e) => updateProperty('length', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            min="0.1"
            step="0.1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Width (m)
          </label>
          <input
            type="number"
            value={properties.width}
            onChange={(e) => updateProperty('width', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            min="0.001"
            step="0.001"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Depth (m)
          </label>
          <input
            type="number"
            value={properties.depth}
            onChange={(e) => updateProperty('depth', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            min="0.001"
            step="0.001"
          />
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Material Properties</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Young's Modulus (Pa)
            </label>
            <input
              type="number"
              value={properties.youngsModulus}
              onChange={(e) => updateProperty('youngsModulus', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              min="0"
              step="1e9"
            />
            <p className="text-xs text-gray-500 mt-1">
              Example: 2.05e11 for steel
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Density (kg/m³)
            </label>
            <input
              type="number"
              value={properties.density}
              onChange={(e) => updateProperty('density', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              min="0"
              step="100"
            />
            <p className="text-xs text-gray-500 mt-1">
              Example: 7830 for steel
            </p>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Damping Properties</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Damping Ratio (ζ) <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="number"
            value={properties.dampingRatio ?? ''}
            onChange={(e) => {
              const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
              updateProperty('dampingRatio', value);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            min="0"
            max="1"
            step="0.001"
            placeholder="0.01 - 0.05 typical"
          />
          <p className="text-xs text-gray-500 mt-1">
            Typical values: 0.01-0.05 for structures (0.01 = 1% damping, 0.05 = 5% damping)
          </p>
        </div>
      </div>
    </div>
  );
}

