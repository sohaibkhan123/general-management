import React, { useMemo } from 'react';
import { Project } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  AreaChart, Area
} from 'recharts';

interface DashboardChartsProps {
  project: Project;
  selectedDateColumn?: string; // Optional: Chart specific date column trend
}

export const DashboardCharts: React.FC<DashboardChartsProps> = ({ project, selectedDateColumn }) => {
  const dateFields = project.fields.filter(f => f.type === 'date');
  const numberFields = project.fields.filter(f => f.type === 'number');

  // 1. Comparison of all Date Columns (How many items have a date for each column)
  const statusData = useMemo(() => {
    return dateFields.map(field => {
      let completed = 0;
      project.items.forEach(item => {
        if (item[field.name]) completed++;
      });
      return {
        name: field.name,
        Count: completed,
        Remaining: Math.max(0, project.items.length - completed)
      };
    });
  }, [project, dateFields]);

  // 2. Timeline Data (Cumulative)
  const timelineData = useMemo(() => {
    // Collect all dates
    const allDates = new Set<string>();
    project.items.forEach(item => {
        dateFields.forEach(df => {
            if (item[df.name]) allDates.add(item[df.name]);
        });
    });
    const uniqueDates = Array.from(allDates).sort();
    if (uniqueDates.length === 0) return [];

    let runningTotals: Record<string, number> = {};
    dateFields.forEach(df => runningTotals[df.name] = 0);

    return uniqueDates.map(date => {
        dateFields.forEach(df => {
            const countOnDate = project.items.filter(i => i[df.name] === date).length;
            runningTotals[df.name] += countOnDate;
        });
        return {
            date,
            ...runningTotals
        };
    });
  }, [project, dateFields]);

  // Colors
  const colors = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#ec4899", "#6366f1"];

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Overall Status */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Workflow Progress (Count)</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={statusData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Legend />
              <Bar dataKey="Count" stackId="a" fill="#3b82f6" name="Completed" radius={[0, 0, 4, 4]} />
              <Bar dataKey="Remaining" stackId="a" fill="#e2e8f0" name="Remaining" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

       {/* Cumulative Timeline */}
       {timelineData.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Cumulative Progress Over Time</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={timelineData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                    dataKey="date" 
                    stroke="#64748b" 
                    fontSize={12} 
                    tickFormatter={(str) => {
                        const d = new Date(str);
                        return `${d.getDate()}/${d.getMonth()+1}`;
                    }}
                />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    labelFormatter={(label) => new Date(label).toLocaleDateString()}
                />
                <Legend />
                {dateFields.map((field, index) => (
                  <Area 
                    key={field.name}
                    type="monotone" 
                    dataKey={field.name} 
                    stackId="1" 
                    stroke={colors[index % colors.length]} 
                    fill={colors[index % colors.length]} 
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};