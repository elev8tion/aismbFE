'use client';

import { useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, LabelList } from 'recharts';

interface PipelineData {
  stage: string;
  count: number;
  value: number;
  color: string;
}

interface PipelineFunnelProps {
  data: PipelineData[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-gray-900/95 border border-white/10 p-3 rounded-lg shadow-xl backdrop-blur-md">
        <p className="text-sm font-bold text-white mb-1">{data.stage}</p>
        <p className="text-xs text-white/70">Leads: <span className="text-white">{data.count}</span></p>
        <p className="text-xs text-white/70">Value: <span className="text-primary-electricBlue font-mono">${data.value.toLocaleString()}</span></p>
      </div>
    );
  }
  return null;
};

export function PipelineFunnel({ data }: PipelineFunnelProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    return <div className="h-[300px] w-full mt-4" />;
  }

  return (
    <div className="h-[300px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 80, left: 20, bottom: 5 }}
          barSize={40}
        >
          <XAxis type="number" hide />
          <YAxis 
            dataKey="stage" 
            type="category" 
            axisLine={false} 
            tickLine={false}
            tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
            width={100}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
            ))}
            <LabelList 
              dataKey="value" 
              position="right" 
              formatter={(val: any) => typeof val === 'number' ? `$${val.toLocaleString()}` : val}
              style={{ fill: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 500 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
