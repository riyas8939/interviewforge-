import React from 'react';

const RadarChart = ({ data }) => {
  // Expected schema: data = { Technical: 85, Coding: 80, Communication: 90, Behavioral: 75, Fit: 88 }
  const keys = Object.keys(data);
  const values = Object.values(data);
  const numPoints = keys.length;
  
  const width = 300;
  const height = 300;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = 100;

  // Generate web grid concentric lines (e.g. 25%, 50%, 75%, 100%)
  const gridLevels = [0.25, 0.5, 0.75, 1];
  const gridPaths = gridLevels.map(level => {
    const points = [];
    for (let i = 0; i < numPoints; i++) {
      const angle = (i * 2 * Math.PI) / numPoints - Math.PI / 2;
      const x = centerX + radius * level * Math.cos(angle);
      const y = centerY + radius * level * Math.sin(angle);
      points.push(`${x},${y}`);
    }
    return points.join(' ');
  });

  // Calculate actual candidate scoring polygon
  const valuePoints = values.map((val, idx) => {
    const scoreFraction = val / 100;
    const angle = (idx * 2 * Math.PI) / numPoints - Math.PI / 2;
    const x = centerX + radius * scoreFraction * Math.cos(angle);
    const y = centerY + radius * scoreFraction * Math.sin(angle);
    return `${x},${y}`;
  }).join(' ');

  // Calculate axis lines and label placements
  const axes = keys.map((key, idx) => {
    const angle = (idx * 2 * Math.PI) / numPoints - Math.PI / 2;
    const xOuter = centerX + radius * Math.cos(angle);
    const yOuter = centerY + radius * Math.sin(angle);
    
    // Position labels slightly further outside the grid
    const labelX = centerX + (radius + 25) * Math.cos(angle);
    const labelY = centerY + (radius + 15) * Math.sin(angle);
    
    return {
      x2: xOuter,
      y2: yOuter,
      labelX,
      labelY,
      label: key,
      value: values[idx]
    };
  });

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Concentric grid lines */}
        {gridPaths.map((path, idx) => (
          <polygon
            key={idx}
            points={path}
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="1"
          />
        ))}

        {/* Outer concentric level circles/polygons background */}
        <polygon points={gridPaths[gridPaths.length - 1]} fill="rgba(30, 41, 59, 0.15)" />

        {/* Axis lines */}
        {axes.map((axis, idx) => (
          <line
            key={idx}
            x1={centerX}
            y1={centerY}
            x2={axis.x2}
            y2={axis.y2}
            stroke="rgba(255, 255, 255, 0.12)"
            strokeWidth="1"
          />
        ))}

        {/* Candidate Scoring Polygon */}
        <polygon
          points={valuePoints}
          fill="rgba(6, 182, 212, 0.25)"
          stroke="#06B6D4"
          strokeWidth="2"
        />

        {/* Candidate scores data dots */}
        {values.map((val, idx) => {
          const scoreFraction = val / 100;
          const angle = (idx * 2 * Math.PI) / numPoints - Math.PI / 2;
          const x = centerX + radius * scoreFraction * Math.cos(angle);
          const y = centerY + radius * scoreFraction * Math.sin(angle);
          return (
            <circle
              key={idx}
              cx={x}
              cy={y}
              r="4"
              fill="#8B5CF6"
              stroke="#F8FAFC"
              strokeWidth="1"
            />
          );
        })}

        {/* Labels */}
        {axes.map((axis, idx) => (
          <g key={idx}>
            <text
              x={axis.labelX}
              y={axis.labelY}
              fill="#94A3B8"
              fontSize="10"
              fontWeight="600"
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {axis.label}
            </text>
            <text
              x={axis.labelX}
              y={axis.labelY + 12}
              fill="#06B6D4"
              fontSize="10"
              fontWeight="700"
              textAnchor="middle"
            >
              {Math.round(axis.value)}%
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

export default RadarChart;
