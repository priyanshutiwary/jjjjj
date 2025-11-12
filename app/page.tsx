'use client';

import { useState, useMemo, useEffect } from 'react';
import BeamTypeSelector from '@/components/BeamTypeSelector';
import BeamPropertiesForm from '@/components/BeamPropertiesForm';
import ModeShapeChart from '@/components/ModeShapeChart';
import StaticDeflectionChart from '@/components/StaticDeflectionChart';
import DampingResponseChart from '@/components/DampingResponseChart';
import ResultsDisplay from '@/components/ResultsDisplay';
import { BeamType, BeamProperties, calculateBeamAnalysis } from '@/lib/beamAnalysis';

type GraphTab = 'modes' | 'static' | 'damping';

export default function Home() {
  const [beamType, setBeamType] = useState<BeamType>('cantilever');
  const [activeTab, setActiveTab] = useState<GraphTab>('modes');
  const [properties, setProperties] = useState<BeamProperties>({
    length: 2,
    width: 0.1,
    depth: 0.3,
    youngsModulus: 20.5e10,
    density: 7.83e3,
  });

  const results = useMemo(() => {
    if (
      properties.length > 0 &&
      properties.width > 0 &&
      properties.depth > 0 &&
      properties.youngsModulus > 0 &&
      properties.density > 0
    ) {
      try {
        return calculateBeamAnalysis(beamType, properties, 3);
      } catch (error) {
        console.error('Calculation error:', error);
        return null;
      }
    }
    return null;
  }, [beamType, properties]);

  // Auto-switch tab if current tab's graph is not available
  useEffect(() => {
    if (results) {
      if (activeTab === 'static' && !results.staticDeflection) {
        setActiveTab('modes');
      } else if (activeTab === 'damping' && !results.dampedResponse) {
        setActiveTab('modes');
      }
    }
  }, [results, activeTab]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Beam Analysis Tool
          </h1>
          <p className="text-gray-600">
            Calculate natural frequencies and visualize mode shapes for various beam configurations
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Inputs */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <BeamTypeSelector value={beamType} onChange={setBeamType} />
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <BeamPropertiesForm properties={properties} onChange={setProperties} />
            </div>
          </div>

          {/* Right Column - Results */}
          <div className="lg:col-span-2">
            {results && (
              <div className="flex flex-col gap-6">
                <div>
                  <ResultsDisplay 
                    key={`${beamType}-${properties.length}-${properties.width}-${properties.depth}-${properties.youngsModulus}-${properties.density}`} 
                    results={results} 
                  />
                </div>
                
                {/* Graph Tabs */}
                <div className="bg-white rounded-lg shadow-sm">
                  {/* Tab Buttons */}
                  <div className="flex border-b border-gray-200">
                    <button
                      onClick={() => setActiveTab('modes')}
                      className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                        activeTab === 'modes'
                          ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      Mode Shapes
                    </button>
                    {results.staticDeflection && (
                      <button
                        onClick={() => setActiveTab('static')}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                          activeTab === 'static'
                            ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        Static Deflection
                      </button>
                    )}
                    {results.dampedResponse && (
                      <button
                        onClick={() => setActiveTab('damping')}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                          activeTab === 'damping'
                            ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        Damped Response
                      </button>
                    )}
                  </div>
                  
                  {/* Tab Content */}
                  <div className="p-0">
                    {activeTab === 'modes' && (
                      <div>
                        <ModeShapeChart 
                          key={`${beamType}-${properties.length}`} 
                          modeShapes={results.modeShapes} 
                        />
                      </div>
                    )}
                    {activeTab === 'static' && results.staticDeflection && (
                      <div>
                        <StaticDeflectionChart 
                          key={`static-${beamType}-${properties.length}`}
                          staticDeflection={results.staticDeflection} 
                        />
                      </div>
                    )}
                    {activeTab === 'damping' && results.dampedResponse && (
                      <div>
                        <DampingResponseChart 
                          key={`damped-${beamType}-${properties.length}-${properties.dampingRatio || 0}`}
                          dampedResponse={results.dampedResponse} 
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {!results && (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <p className="text-gray-500">
                  Please enter valid beam properties to see results
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Based on Euler-Bernoulli beam theory. Results are calculated using characteristic equations
            for each beam type.
          </p>
        </div>
      </div>
    </div>
  );
}

