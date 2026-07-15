import React from 'react';

const LineChart = ({ scores }) => {
  // scores: List of numbers, e.g. [70, 75, 82, 85, 90]
  const width = 500;
  const height = 180;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  if (!scores || scores.length === 0) {
    return (
      <div style={{ color: '#64748B', fontSize: '14px', textAlign: 'center', padding: '40px 0' }}>
        No historical attempts to visualize yet.
      </div>
    );
  }

  // Handle single score edge case
  const pointsData = scores.length === 1 ? [scores[0], scores[0]] : scores;
  const numItems = pointsData.length;

  // Calculate coordinates
  const coords = pointsData.map((val, idx) => {
    const x = paddingLeft + (idx / (numItems - 1)) * chartWidth;
    // Map value (0-100) to chart height (100% is top)
    const y = paddingTop + chartHeight - (val / 100) * chartHeight;
    return { x, y, value: val };
  });

  // Construct SVG Path line
  const linePath = coords.map((c, idx) => {
    return `${idx === 0 ? 'M' : 'L'} ${c.x} ${c.y}`;
  }).join(' ');

  // Construct SVG Area/Gradient fill path
  const areaPath = `
    ${linePath} 
    L ${coords[coords.length - 1].x} ${paddingTop + chartHeight} 
    L ${coords[0].x} ${paddingTop + chartHeight} Z
  `;

  return (
    <div style={{ width: '100%' }}>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Y Axis Grid lines */}
        {[0, 25, 50, 75, 100].map((gridVal) => {
          const yGrid = paddingTop + chartHeight - (gridVal / 100) * chartHeight;
          return (
            <g key={gridVal}>
              <line
                x1={paddingLeft}
                y1={yGrid}
                x2={width - paddingRight}
                y2={yGrid}
                stroke="rgba(255, 255, 255, 0.05)"
                strokeWidth="1"
              />
              <text
                x={paddingLeft - 10}
                y={yGrid + 4}
                fill="#64748B"
                fontSize="9"
                textAnchor="end"
              >
                {gridVal}%
              </text>
            </g>
          );
        })}

        {/* Gradient fill */}
        <path d={areaPath} fill="url(#chartGradient)" />

        {/* Scoring trend line */}
        <path
          d={linePath}
          fill="none"
          stroke="#3B82F6"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {coords.map((c, idx) => (
          <g key={idx}>
            <circle
              cx={c.x}
              cy={c.y}
              r="4"
              fill="#06B6D4"
              stroke="#F8FAFC"
              strokeWidth="1"
            />
            {/* Show value tag on hover/default */}
            <text
              x={c.x}
              y={c.y - 8}
              fill="#F8FAFC"
              fontSize="9"
              fontWeight="bold"
              textAnchor="middle"
            >
              {Math.round(c.value)}%
            </text>
            {/* X-axis labels (Session 1, Session 2, etc.) */}
            <text
              x={c.x}
              y={height - 10}
              fill="#64748B"
              fontSize="9"
              textAnchor="middle"
            >
              #{idx + 1}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

export default LineChart;
