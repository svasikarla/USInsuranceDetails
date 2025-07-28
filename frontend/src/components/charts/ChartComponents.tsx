import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

interface ChartContainerProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

export function ChartContainer({ title, subtitle, children, className = "" }: ChartContainerProps) {
  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
      </div>
      <div className="h-80">
        {children}
      </div>
    </div>
  );
}

interface PieChartData {
  name: string;
  value: number;
  color: string;
  percentage?: number;
}

interface CustomPieChartProps {
  data: PieChartData[];
  showLegend?: boolean;
  showLabels?: boolean;
}

export function CustomPieChart({ data, showLegend = true, showLabels = true }: CustomPieChartProps) {
  const renderCustomLabel = (entry: any) => {
    if (!showLabels) return '';
    return `${entry.percentage || entry.value}%`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">
            Count: <span className="font-medium">{data.value}</span>
          </p>
          <p className="text-sm text-gray-600">
            Percentage: <span className="font-medium">{data.percentage || data.value}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomLabel}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        {showLegend && (
          <Legend 
            verticalAlign="bottom" 
            height={36}
            formatter={(value, entry: any) => (
              <span style={{ color: entry.color }}>{value}</span>
            )}
          />
        )}
      </PieChart>
    </ResponsiveContainer>
  );
}

interface BarChartData {
  name: string;
  value: number;
  color?: string;
}

interface CustomBarChartProps {
  data: BarChartData[];
  xAxisKey?: string;
  yAxisKey?: string;
  color?: string;
  showGrid?: boolean;
}

export function CustomBarChart({ 
  data, 
  xAxisKey = "name", 
  yAxisKey = "value", 
  color = "#3B82F6",
  showGrid = true 
}: CustomBarChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-sm text-gray-600">
            Value: <span className="font-medium">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" />}
        <XAxis dataKey={xAxisKey} />
        <YAxis />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey={yAxisKey} fill={color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

interface LineChartData {
  name: string;
  [key: string]: any;
}

interface CustomLineChartProps {
  data: LineChartData[];
  lines: Array<{
    key: string;
    color: string;
    name: string;
  }>;
  xAxisKey?: string;
  showGrid?: boolean;
}

export function CustomLineChart({ 
  data, 
  lines, 
  xAxisKey = "name",
  showGrid = true 
}: CustomLineChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm text-gray-600">
              {entry.name}: <span className="font-medium" style={{ color: entry.color }}>
                {entry.value}
              </span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" />}
        <XAxis dataKey={xAxisKey} />
        <YAxis />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        {lines.map((line) => (
          <Line
            key={line.key}
            type="monotone"
            dataKey={line.key}
            stroke={line.color}
            strokeWidth={2}
            name={line.name}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

interface AreaChartData {
  name: string;
  [key: string]: any;
}

interface CustomAreaChartProps {
  data: AreaChartData[];
  areas: Array<{
    key: string;
    color: string;
    name: string;
  }>;
  xAxisKey?: string;
  showGrid?: boolean;
  stacked?: boolean;
}

export function CustomAreaChart({ 
  data, 
  areas, 
  xAxisKey = "name",
  showGrid = true,
  stacked = false 
}: CustomAreaChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm text-gray-600">
              {entry.name}: <span className="font-medium" style={{ color: entry.color }}>
                {entry.value}
              </span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" />}
        <XAxis dataKey={xAxisKey} />
        <YAxis />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        {areas.map((area) => (
          <Area
            key={area.key}
            type="monotone"
            dataKey={area.key}
            stackId={stacked ? "1" : area.key}
            stroke={area.color}
            fill={area.color}
            fillOpacity={0.6}
            name={area.name}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray';
}

export function MetricCard({ 
  title, 
  value, 
  subtitle, 
  trend, 
  icon, 
  color = 'blue' 
}: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
    gray: 'bg-gray-50 text-gray-600'
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center mt-2">
              <span className={`text-sm font-medium ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
              </span>
              <span className="text-sm text-gray-500 ml-1">vs last period</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
