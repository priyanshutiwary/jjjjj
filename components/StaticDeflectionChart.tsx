'use client';

import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { StaticDeflection } from '@/lib/beamAnalysis';

interface StaticDeflectionChartProps {
  staticDeflection: StaticDeflection;
}

export default function StaticDeflectionChart({ staticDeflection }: StaticDeflectionChartProps) {
  const chartData = useMemo(() => {
    return staticDeflection.x.map((x, index) => ({
      x: Number(x.toFixed(4)),
      deflection: staticDeflection.y[index],
    }));
  }, [staticDeflection]);

  // Calculate proper domain for Y-axis
  const yDomain = useMemo(() => {
    const allY = staticDeflection.y;
    const minY = Math.min(...allY);
    const maxY = Math.max(...allY);
    const padding = (maxY - minY) * 0.1 || Math.abs(maxY) * 0.1 || 1e-6;
    return [minY - padding, maxY + padding];
  }, [staticDeflection.y]);

  // Calculate proper domain for X-axis
  const xDomain = useMemo(() => {
    const allX = staticDeflection.x;
    const minX = Math.min(...allX);
    const maxX = Math.max(...allX);
    const padding = (maxX - minX) * 0.02 || 0.01;
    return [Math.max(0, minX - padding), maxX + padding];
  }, [staticDeflection.x]);

  return (
    <div className="w-full h-[400px] p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Static Deflection (y(x))</h3>
        <p className="text-sm text-gray-500 mt-1">
          Maximum deflection: {staticDeflection.maxDeflection.toFixed(6)} m at x = {staticDeflection.maxDeflectionLocation.toFixed(3)} m
        </p>
        <p className="text-xs text-gray-400 mt-1">
          (Under 1000N point load)
        </p>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart 
          data={chartData} 
          margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="x" 
            type="number"
            domain={xDomain}
            label={{ value: 'Length (m)', position: 'insideBottom', offset: -5 }}
            stroke="#6b7280"
            tickFormatter={(value) => value.toFixed(2)}
            allowDecimals={true}
          />
          <YAxis 
            type="number"
            domain={yDomain}
            label={{ value: 'Deflection (m)', angle: -90, position: 'insideLeft' }}
            stroke="#6b7280"
            allowDecimals={true}
            tickFormatter={(value) => {
              if (Math.abs(value) < 1e-6) return `${(value * 1e6).toFixed(2)} μm`;
              if (Math.abs(value) < 1e-3) return `${(value * 1e3).toFixed(3)} mm`;
              return `${value.toFixed(4)} m`;
            }}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px' }}
            formatter={(value: number) => {
              if (Math.abs(value) < 1e-6) return `${(value * 1e6).toFixed(4)} μm`;
              if (Math.abs(value) < 1e-3) return `${(value * 1e3).toFixed(4)} mm`;
              return `${value.toFixed(6)} m`;
            }}
            labelFormatter={(label) => `Length: ${Number(label).toFixed(3)} m`}
          />
          <Legend />
          <Line 
            type="monotone"
            dataKey="deflection"
            stroke="#9333ea"
            strokeWidth={2}
            dot={false}
            name="Static Deflection"
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-2 text-xs text-gray-500">
        <p>💡 <strong>Static Deflection:</strong> Displacement under load (static or dynamic). Used to check serviceability limits (building codes, machine tolerances).</p>
      </div>
    </div>
  );
}

