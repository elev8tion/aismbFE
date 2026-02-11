'use client';

import { useState, useEffect } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface PaybackTrendProps {
  weeklySavings: number;
  investment: number;
}

export function PaybackTrend({ weeklySavings, investment }: PaybackTrendProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    return <div className="h-[200px] w-full" />;
  }
  // Generate 12 months (52 weeks) of data
  const data = Array.from({ length: 53 }, (_, week) => {
    const cumulativeSavings = weeklySavings * week;
    return {
      week,
      netValue: cumulativeSavings - investment,
      savings: cumulativeSavings,
    };
  });

  const paybackWeek = Math.ceil(investment / weeklySavings);

  interface TooltipProps {
    active?: boolean;
    payload?: Array<{ payload: { week: number; netValue: number } }>;
  }

  const CustomTooltip = ({ active, payload }: TooltipProps) => {
    if (active && payload && payload.length) {
      const { week, netValue } = payload[0].payload;
      return (
        <div className="bg-gray-900 border border-white/10 p-3 rounded-lg shadow-xl">
          <p className="text-xs text-white/50 mb-1">Week {week}</p>
          <p className={`text-sm font-bold ${netValue >= 0 ? 'text-functional-success' : 'text-functional-error'}`}>
            Net Value: ${Math.round(netValue).toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#00E5FF" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis 
            dataKey="week" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
            ticks={[0, 10, 20, 30, 40, 50]}
            label={{ value: 'Weeks', position: 'insideBottom', offset: -5, fill: 'rgba(255,255,255,0.2)', fontSize: 10 }}
          />
          <YAxis hide domain={['auto', 'auto']} />
          <Tooltip content={<CustomTooltip />} />
          <Area 
            type="monotone" 
            dataKey="netValue" 
            stroke="#00E5FF" 
            fillOpacity={1} 
            fill="url(#colorNet)" 
            strokeWidth={2}
          />
          {/* Payback Line */}
          {paybackWeek <= 52 && (
            <Area
              type="monotone"
              dataKey="netValue"
              stroke="none"
              fill="none"
              isAnimationActive={false}
            >
               {/* Reference Dot could be added here if needed */}
            </Area>
          )}
        </AreaChart>
      </ResponsiveContainer>
      <div className="flex justify-between mt-2 px-1">
        <p className="text-[10px] text-white/40 uppercase tracking-wider">Initial Investment</p>
        <p className="text-[10px] text-white/40 uppercase tracking-wider">52 Week Projection</p>
      </div>
    </div>
  );
}
