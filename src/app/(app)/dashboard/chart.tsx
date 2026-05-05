'use client';

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

export function DashboardChart({ data }: { data: { term: string; Invoiced: number; Collected: number }[] }) {
  return (
    <div style={{ width: '100%', height: 280 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 10, right: 12, bottom: 0, left: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="term" tick={{ fill: '#64748b', fontSize: 12 }} stroke="#cbd5e1" />
          <YAxis tick={{ fill: '#64748b', fontSize: 12 }} stroke="#cbd5e1" tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
          <Tooltip
            contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }}
            formatter={(v: number | string) => `$${Number(v).toLocaleString()}`}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="Invoiced"  fill="#94a3b8" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Collected" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
