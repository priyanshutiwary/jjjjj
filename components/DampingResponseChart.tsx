'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush } from 'recharts';
import { DampedResponse } from '@/lib/beamAnalysis';

interface DampingResponseChartProps {
  dampedResponse: DampedResponse;
}

export default function DampingResponseChart({ dampedResponse }: DampingResponseChartProps) {
  const [xDomain, setXDomain] = useState<[number, number] | undefined>(undefined);
  const [yDomain, setYDomain] = useState<[number, number] | undefined>(undefined);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; domain: [number, number] } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Combine all data into one dataset
  const chartData = useMemo(() => {
    const mainData = dampedResponse.time.map((t, index) => {
      const time = Number(t.toFixed(4));
      const displacement = dampedResponse.displacement[index];
      
      // Find corresponding envelope values (interpolate if needed)
      let upper: number | null = null;
      let lower: number | null = null;
      
      const envelopeIndex = dampedResponse.envelope.time.findIndex(et => Math.abs(et - t) < 0.001);
      if (envelopeIndex >= 0) {
        upper = dampedResponse.envelope.upper[envelopeIndex];
        lower = dampedResponse.envelope.lower[envelopeIndex];
      } else {
        // Interpolate envelope values
        for (let i = 0; i < dampedResponse.envelope.time.length - 1; i++) {
          const t1 = dampedResponse.envelope.time[i];
          const t2 = dampedResponse.envelope.time[i + 1];
          if (t >= t1 && t <= t2) {
            const ratio = (t - t1) / (t2 - t1);
            upper = dampedResponse.envelope.upper[i] + ratio * (dampedResponse.envelope.upper[i + 1] - dampedResponse.envelope.upper[i]);
            lower = dampedResponse.envelope.lower[i] + ratio * (dampedResponse.envelope.lower[i + 1] - dampedResponse.envelope.lower[i]);
            break;
          }
        }
      }
      
      return {
        time,
        displacement,
        upper: upper ?? undefined,
        lower: lower ?? undefined,
      };
    });
    
    return mainData;
  }, [dampedResponse]);

  // Calculate proper domain for Y-axis
  const initialYDomain = useMemo(() => {
    const allY = [...dampedResponse.displacement, ...dampedResponse.envelope.upper, ...dampedResponse.envelope.lower];
    const minY = Math.min(...allY);
    const maxY = Math.max(...allY);
    const padding = (maxY - minY) * 0.1 || 0.1;
    return [minY - padding, maxY + padding] as [number, number];
  }, [dampedResponse.displacement, dampedResponse.envelope]);

  // Calculate proper domain for X-axis
  const initialXDomain = useMemo(() => {
    const allX = dampedResponse.time;
    const minX = Math.min(...allX);
    const maxX = Math.max(...allX);
    const padding = (maxX - minX) * 0.02 || 0.01;
    return [Math.max(0, minX - padding), maxX + padding] as [number, number];
  }, [dampedResponse.time]);

  // Initialize domains
  useEffect(() => {
    if (chartData.length > 0) {
      setXDomain(initialXDomain);
      setYDomain(initialYDomain);
    }
  }, [chartData, initialXDomain, initialYDomain]);

  // Mouse wheel zoom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!xDomain || !yDomain || chartData.length === 0) return;

      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Determine if zooming X or Y axis (based on which axis is closer)
      const chartWidth = rect.width - 60; // Account for margins
      const chartHeight = rect.height - 60;
      const xRatio = mouseX / chartWidth;
      const yRatio = mouseY / chartHeight;

      const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
      
      if (e.shiftKey || Math.abs(xRatio - 0.5) < Math.abs(yRatio - 0.5)) {
        // Zoom X axis
        const [minX, maxX] = xDomain;
        const rangeX = maxX - minX;
        const centerX = minX + rangeX * xRatio;
        const newRangeX = rangeX * zoomFactor;
        const newMinX = Math.max(0, centerX - newRangeX * xRatio);
        const newMaxX = Math.min(Math.max(...dampedResponse.time), newMinX + newRangeX);
        if (newMaxX > newMinX) {
          setXDomain([newMinX, newMaxX]);
        }
      } else {
        // Zoom Y axis
        const [minY, maxY] = yDomain;
        const rangeY = maxY - minY;
        const centerY = minY + rangeY * (1 - yRatio);
        const newRangeY = rangeY * zoomFactor;
        const newMinY = centerY - newRangeY * (1 - yRatio);
        const newMaxY = newMinY + newRangeY;
        setYDomain([newMinY, newMaxY]);
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [xDomain, yDomain, chartData, dampedResponse.time]);

  // Mouse drag pan
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0 && xDomain) { // Left mouse button
        setIsPanning(true);
        setPanStart({ x: e.clientX, domain: xDomain });
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isPanning && panStart && xDomain && chartData.length > 0) {
        const rect = container.getBoundingClientRect();
        const chartWidth = rect.width - 60;
        const deltaX = (e.clientX - panStart.x) / chartWidth;
        
        const [minX, maxX] = panStart.domain;
        const rangeX = maxX - minX;
        const dataMinX = Math.min(...dampedResponse.time);
        const dataMaxX = Math.max(...dampedResponse.time);
        
        const shift = -deltaX * rangeX;
        const newMinX = Math.max(dataMinX, minX + shift);
        const newMaxX = Math.min(dataMaxX, maxX + shift);
        
        if (newMaxX - newMinX === rangeX && newMinX >= dataMinX && newMaxX <= dataMaxX) {
          setXDomain([newMinX, newMaxX]);
        }
      }
    };

    const handleMouseUp = () => {
      setIsPanning(false);
      setPanStart(null);
    };

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPanning, panStart, xDomain, chartData, dampedResponse.time]);

  const handleResetZoom = () => {
    if (chartData.length > 0) {
      setXDomain(initialXDomain);
      setYDomain(initialYDomain);
    }
  };

  // Calculate logarithmic decrement (for display)
  const logDecrement = useMemo(() => {
    if (dampedResponse.dampingRatio <= 0) return 0;
    // Logarithmic decrement: δ = 2πζ / sqrt(1 - ζ²)
    return (2 * Math.PI * dampedResponse.dampingRatio) / Math.sqrt(1 - dampedResponse.dampingRatio * dampedResponse.dampingRatio);
  }, [dampedResponse.dampingRatio]);

  return (
    <div className="w-full h-[400px] p-4">
      <div className="mb-4 flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Damped Vibration Response</h3>
          <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
          <div>
            <span className="text-gray-600">Damping Ratio (ζ): </span>
            <span className="font-semibold">{(dampedResponse.dampingRatio * 100).toFixed(2)}%</span>
          </div>
          <div>
            <span className="text-gray-600">Natural Frequency: </span>
            <span className="font-semibold">{dampedResponse.naturalFrequency.toFixed(2)} Hz</span>
          </div>
          <div>
            <span className="text-gray-600">Damped Frequency: </span>
            <span className="font-semibold">{dampedResponse.dampedFrequency.toFixed(2)} Hz</span>
          </div>
          <div>
            <span className="text-gray-600">Logarithmic Decrement (δ): </span>
            <span className="font-semibold">{logDecrement.toFixed(4)}</span>
          </div>
          </div>
        </div>
        <button
          onClick={handleResetZoom}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Reset Zoom
        </button>
      </div>
      <div ref={containerRef} className="w-full h-full" style={{ cursor: isPanning ? 'grabbing' : 'grab' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={chartData} 
            margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="time" 
              type="number"
              domain={xDomain}
              allowDataOverflow={true}
              label={{ value: 'Time (s)', position: 'insideBottom', offset: -5 }}
              stroke="#6b7280"
              tickFormatter={(value) => value.toFixed(1)}
              allowDecimals={true}
            />
            <YAxis 
              type="number"
              domain={yDomain}
              allowDataOverflow={true}
              label={{ value: 'Displacement (m)', angle: -90, position: 'insideLeft' }}
              stroke="#6b7280"
              allowDecimals={true}
              tickFormatter={(value) => {
                if (Math.abs(value) < 1e-3) return `${(value * 1e3).toFixed(2)} mm`;
                return `${value.toFixed(3)} m`;
              }}
            />
          <Tooltip 
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px' }}
            formatter={(value: number) => {
              if (Math.abs(value) < 1e-3) return `${(value * 1e3).toFixed(4)} mm`;
              return `${value.toFixed(6)} m`;
            }}
            labelFormatter={(label) => `Time: ${Number(label).toFixed(3)} s`}
          />
          <Legend />
          
          {/* Envelope curves */}
          <Line 
            type="monotone"
            dataKey="upper"
            stroke="#f59e0b"
            strokeWidth={1.5}
            strokeDasharray="5 5"
            dot={false}
            name="Envelope (+)"
            isAnimationActive={false}
            connectNulls={false}
          />
          <Line 
            type="monotone"
            dataKey="lower"
            stroke="#f59e0b"
            strokeWidth={1.5}
            strokeDasharray="5 5"
            dot={false}
            name="Envelope (-)"
            isAnimationActive={false}
            connectNulls={false}
          />
          
          {/* Damped response */}
          <Line 
            type="monotone"
            dataKey="displacement"
            stroke="#ef4444"
            strokeWidth={2}
            dot={false}
            name="Damped Response"
            isAnimationActive={false}
          />
          
          {/* Brush for zooming */}
          <Brush
            dataKey="time"
            height={30}
            stroke="#8884d8"
            tickFormatter={(value) => value.toFixed(2)}
            onChange={(brushData) => {
              if (brushData && brushData.startIndex !== undefined && brushData.endIndex !== undefined) {
                const startX = chartData[brushData.startIndex]?.time as number;
                const endX = chartData[brushData.endIndex]?.time as number;
                if (startX !== undefined && endX !== undefined) {
                  setXDomain([startX, endX]);
                }
              }
            }}
          />
        </LineChart>
      </ResponsiveContainer>
      </div>
      <div className="mt-2 text-xs text-gray-500">
        <p>💡 <strong>Zoom:</strong> Scroll wheel (Shift+Scroll for X-axis, normal scroll for Y-axis) | 
        <strong> Pan:</strong> Click and drag | 
        <strong> Brush:</strong> Use the slider at the bottom for X-axis zoom</p>
        <p className="mt-1"><strong>Damped Response:</strong> Shows how vibrations decay over time. The envelope curves (dashed) show the exponential decay: ±A·e^(-ζωₙt). Higher damping ratio = faster decay.</p>
      </div>
    </div>
  );
}

