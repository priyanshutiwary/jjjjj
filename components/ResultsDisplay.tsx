'use client';

import { BeamResults } from '@/lib/beamAnalysis';

interface ResultsDisplayProps {
  results: BeamResults;
}

function formatNumber(value: number, unit: string, decimals: number = 4): string {
  if (value >= 1e9) {
    return `${(value / 1e9).toFixed(decimals)} G${unit}`;
  } else if (value >= 1e6) {
    return `${(value / 1e6).toFixed(decimals)} M${unit}`;
  } else if (value >= 1e3) {
    return `${(value / 1e3).toFixed(decimals)} k${unit}`;
  } else if (value < 1e-3) {
    return `${(value * 1e6).toFixed(decimals)} μ${unit}`;
  } else if (value < 1) {
    return `${(value * 1e3).toFixed(decimals)} m${unit}`;
  }
  return `${value.toFixed(decimals)} ${unit}`;
}

export default function ResultsDisplay({ results }: ResultsDisplayProps) {
  return (
    <div className="space-y-6 w-full">
      {/* Natural Frequencies */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Natural Frequencies (fₙ)</h3>
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
              <div className="text-[10px] text-gray-400 mt-2">
                Rate at which structure naturally wants to vibrate
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key Quantities */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Key Quantities</h3>
        <div className="grid grid-cols-2 gap-4">
          {/* Flexural Rigidity */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="text-sm text-gray-600 mb-1">Flexural Rigidity (EI)</div>
            <div className="text-xl font-bold text-blue-600">
              {formatNumber(results.flexuralRigidity, 'N·m²', 2)}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Beam's stiffness to bending
            </div>
            <div className="text-[10px] text-gray-400 mt-1">
              Used in designing beams/shafts to meet stiffness criteria
            </div>
          </div>

          {/* Mass per unit length */}
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="text-sm text-gray-600 mb-1">Mass per Unit Length (m = ρA)</div>
            <div className="text-xl font-bold text-green-600">
              {formatNumber(results.massPerUnitLength, 'kg/m', 4)}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              How heavy the beam is along its length
            </div>
            <div className="text-[10px] text-gray-400 mt-1">
              Important for dynamic load estimation and modal mass
            </div>
          </div>

          {/* Static Deflection */}
          {results.staticDeflection && (
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="text-sm text-gray-600 mb-1">Max Static Deflection (y_max)</div>
              <div className="text-xl font-bold text-purple-600">
                {formatNumber(results.staticDeflection.maxDeflection, 'm', 6)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Location: {results.staticDeflection.maxDeflectionLocation.toFixed(3)} m
              </div>
              <div className="text-xs text-gray-500 mt-1">
                (Under 1000N point load)
              </div>
              <div className="text-[10px] text-gray-400 mt-1">
                Used to check serviceability limits (building codes, machine tolerances)
              </div>
            </div>
          )}

          {/* Damping Coefficient */}
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <div className="text-sm text-gray-600 mb-1">Damping Coefficient (c)</div>
            <div className="text-xl font-bold text-orange-600">
              {results.dampingCoefficient !== null 
                ? formatNumber(results.dampingCoefficient, 'N·s/m', 2)
                : 'Not calculated'
              }
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Energy lost per vibration cycle
            </div>
            <div className="text-[10px] text-gray-400 mt-1">
              {results.dampingCoefficient !== null 
                ? 'Determines how quickly vibrations die out — key for ride comfort, stability'
                : 'Enter damping ratio (ζ) in form to calculate (typical: 0.01-0.05)'
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

