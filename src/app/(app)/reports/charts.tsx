'use client';

import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
  PieChart, Pie, Cell,
} from 'recharts';

const PIE_COLORS = ['#1d4ed8', '#15803d', '#b45309', '#7c3aed', '#dc2626', '#0d9488', '#db2777', '#16a34a'];

type AttendancePoint = { day: string; Present: number; Absent: number };
type AssetSlice = { name: string; value: number };

type Props =
  | { type: 'attendance'; data: AttendancePoint[] }
  | { type: 'assets';     data: AssetSlice[] };

export function ReportsCharts(props: Props) {
  if (props.type === 'attendance') {
    return (
      <div style={{ width: '100%', height: 280 }}>
        <ResponsiveContainer>
          <LineChart data={props.data} margin={{ top: 8, right: 8, bottom: 0, left: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 12 }} stroke="#cbd5e1" />
            <YAxis tick={{ fill: '#64748b', fontSize: 12 }} stroke="#cbd5e1" />
            <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="Present" stroke="#15803d" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="Absent"  stroke="#dc2626" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }
  return (
    <div style={{ width: '100%', height: 240 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie data={props.data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={2}>
            {props.data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
          </Pie>
          <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 11 }} layout="vertical" align="right" verticalAlign="middle" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
