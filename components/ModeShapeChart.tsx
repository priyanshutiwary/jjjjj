'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush } from 'recharts';
import { ModeShape } from '@/lib/beamAnalysis';

interface ModeShapeChartProps {
  modeShapes: ModeShape[];
}

const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

export default function ModeShapeChart({ modeShapes }: ModeShapeChartProps) {
  const [xDomain, setXDomain] = useState<[number, number] | undefined>(undefined);
  const [yDomain, setYDomain] = useState<[number, number] | undefined>(undefined);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; domain: [number, number] } | null>(null);
  const chartRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Prepare data for the chart
  const chartData = useMemo(() => {
    if (!modeShapes || modeShapes.length === 0 || !modeShapes[0]?.x) {
      return [];
    }
    
    const data = modeShapes[0].x.map((x, index) => {
      const dataPoint: Record<string, number | string> = { x: Number(x.toFixed(4)) };
      
      // Add base state (zero line)
      dataPoint['Base State'] = 0;
      
      // Add each mode shape
      modeShapes.forEach((modeShape) => {
        if (modeShape.w[index] !== undefined) {
          dataPoint[`Mode ${modeShape.mode}`] = modeShape.w[index];
        }
      });
      
      return dataPoint;
    });

    // Calculate initial domain from actual data
    if (data.length > 0) {
      const xValues = data.map(d => d.x as number);
      const minX = Math.min(...xValues);
      const maxX = Math.max(...xValues);
      
      // Get all y values for all modes
      const allYValues: number[] = [];
      data.forEach(d => {
        Object.keys(d).forEach(key => {
          if (key !== 'x' && typeof d[key] === 'number') {
            allYValues.push(d[key] as number);
          }
        });
      });
      const minY = Math.min(...allYValues);
      const maxY = Math.max(...allYValues);
      
      // Set initial domains with padding
      const xPadding = (maxX - minX) * 0.02;
      const yPadding = (maxY - minY) * 0.1;
      
      setXDomain([Math.max(0, minX - xPadding), maxX + xPadding]);
      setYDomain([minY - yPadding, maxY + yPadding]);
    }

    return data;
  }, [modeShapes]);

  // Reset zoom when data changes significantly (when max X value changes)
  const maxXValue = useMemo(() => {
    if (chartData.length === 0) return 0;
    return Math.max(...chartData.map(d => d.x as number));
  }, [chartData]);

  useEffect(() => {
    if (chartData.length > 0 && maxXValue > 0) {
      const xValues = chartData.map(d => d.x as number);
      const minX = Math.min(...xValues);
      const maxX = Math.max(...xValues);
      const xPadding = (maxX - minX) * 0.02;
      setXDomain([Math.max(0, minX - xPadding), maxX + xPadding]);
      
      // Reset Y domain too
      const allYValues: number[] = [];
      chartData.forEach(d => {
        Object.keys(d).forEach(key => {
          if (key !== 'x' && typeof d[key] === 'number') {
            allYValues.push(d[key] as number);
          }
        });
      });
      const minY = Math.min(...allYValues);
      const maxY = Math.max(...allYValues);
      const yPadding = (maxY - minY) * 0.1;
      setYDomain([minY - yPadding, maxY + yPadding]);
    }
  }, [chartData, maxXValue]);

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
        const newMaxX = newMinX + newRangeX;
        setXDomain([newMinX, newMaxX]);
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
  }, [xDomain, yDomain, chartData]);

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
        const dataMinX = Math.min(...chartData.map(d => d.x as number));
        const dataMaxX = Math.max(...chartData.map(d => d.x as number));
        
        const shift = -deltaX * rangeX;
        const newMinX = Math.max(dataMinX, minX + shift);
        const newMaxX = Math.min(dataMaxX, maxX + shift);
        
        if (newMaxX - newMinX === rangeX) {
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
  }, [isPanning, panStart, xDomain, chartData]);

  // Unique key derived from data so the chart remounts when inputs change
  const chartKey = useMemo(() => {
    if (!modeShapes || modeShapes.length === 0) return 'empty';
    const maxX = modeShapes[0]?.x ? Math.max(...modeShapes[0].x) : 0;
    const minX = modeShapes[0]?.x ? Math.min(...modeShapes[0].x) : 0;
    return `${minX.toFixed(3)}-${maxX.toFixed(3)}-${modeShapes.map(m => m.bL.toFixed(4)).join('_')}`;
  }, [modeShapes]);

  const handleResetZoom = () => {
    if (chartData.length > 0) {
      const xValues = chartData.map(d => d.x as number);
      const minX = Math.min(...xValues);
      const maxX = Math.max(...xValues);
      const xPadding = (maxX - minX) * 0.02;
      
      const allYValues: number[] = [];
      chartData.forEach(d => {
        Object.keys(d).forEach(key => {
          if (key !== 'x' && typeof d[key] === 'number') {
            allYValues.push(d[key] as number);
          }
        });
      });
      const minY = Math.min(...allYValues);
      const maxY = Math.max(...allYValues);
      const yPadding = (maxY - minY) * 0.1;
      
      setXDomain([Math.max(0, minX - xPadding), maxX + xPadding]);
      setYDomain([minY - yPadding, maxY + yPadding]);
    }
  };

  if (chartData.length === 0) {
    return (
      <div className="w-full h-[500px] bg-white rounded-lg shadow-sm p-4 flex items-center justify-center">
        <p className="text-gray-500">No data to display</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[500px] bg-white rounded-lg shadow-sm p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Mode Shapes</h3>
        <button
          onClick={handleResetZoom}
          className="px-3 py-1 text-sm bg-primary-500 text-white rounded hover:bg-primary-600 transition-colors"
        >
          Reset Zoom
        </button>
      </div>
      <div ref={containerRef} className="w-full h-full" style={{ cursor: isPanning ? 'grabbing' : 'grab' }}>
        <ResponsiveContainer width="100%" height="100%">
        <LineChart 
          key={chartKey}
          ref={chartRef}
          data={chartData} 
          margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="x" 
            type="number"
            domain={xDomain}
            allowDataOverflow={true}
            label={{ value: 'Length (m)', position: 'insideBottom', offset: -5 }}
            stroke="#6b7280"
            tickFormatter={(value) => value.toFixed(2)}
            allowDecimals={true}
          />
          <YAxis 
            type="number"
            domain={yDomain}
            allowDataOverflow={true}
            label={{ value: 'Normal Function W(x)', angle: -90, position: 'insideLeft' }}
            stroke="#6b7280"
            allowDecimals={true}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px' }}
            formatter={(value: number) => value.toFixed(4)}
            labelFormatter={(label) => `Length: ${Number(label).toFixed(3)} m`}
          />
          <Legend />
          
          {/* Base state line */}
          <Line 
            type="monotone" 
            dataKey="Base State" 
            stroke="#000000" 
            strokeDasharray="5 5"
            strokeWidth={1.5}
            dot={false}
          />
          
          {/* Mode shape lines */}
          {modeShapes.map((modeShape, index) => (
            <Line
              key={`mode-${modeShape.mode}-${chartKey}`}
              type="monotone"
              dataKey={`Mode ${modeShape.mode}`}
              stroke={colors[index % colors.length]}
              strokeWidth={2}
              dot={false}
            />
          ))}
          
          {/* Brush for zooming */}
          <Brush
            dataKey="x"
            height={30}
            stroke="#8884d8"
            tickFormatter={(value) => value.toFixed(2)}
            onChange={(brushData) => {
              if (brushData && brushData.startIndex !== undefined && brushData.endIndex !== undefined) {
                const startX = chartData[brushData.startIndex]?.x as number;
                const endX = chartData[brushData.endIndex]?.x as number;
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
      </div>
    </div>
  );
}

