import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
  LineChart, Line,
} from 'recharts';
import { apiClient, queryKeys } from '../api/client';
import { ChartSkeleton } from '../components/ChartSkeleton';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
interface GrowthPoint    { label: string; count: number }
interface DistPoint      { role: string;  count: number }
interface ActivityPoint  { date: string;  count: number }

// ─────────────────────────────────────────────────────────────
// Color palette (consistent across charts)
// ─────────────────────────────────────────────────────────────
// sage-600, cadet-600, purple-taupe, pewter
const PIE_COLORS = ['#7a8a6b', '#516a78', '#50404d', '#8b8f94'];

function ChartCard({ title, description, children }: {
  title:       string;
  description: string;
  children:    React.ReactNode;
}) {
  return (
    <div className="card p-6">
      <div className="mb-5">
        <h3 className="text-base font-semibold text-charcoal">{title}</h3>
        <p className="text-xs text-pewter mt-0.5">{description}</p>
      </div>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────
export function AnalyticsPage() {
  const { data: growthData, isLoading: growthLoading } = useQuery({
    queryKey: queryKeys.analytics.userGrowth(),
    queryFn:  async () => {
      const res = await apiClient.get<{ data: GrowthPoint[] }>('/analytics/user-growth');
      return res.data.data;
    },
  });

  const { data: distData, isLoading: distLoading } = useQuery({
    queryKey: queryKeys.analytics.roleDistribution(),
    queryFn:  async () => {
      const res = await apiClient.get<{ data: DistPoint[] }>('/analytics/role-distribution');
      return res.data.data;
    },
  });

  const { data: activityData, isLoading: activityLoading } = useQuery({
    queryKey: queryKeys.analytics.loginActivity(),
    queryFn:  async () => {
      const res = await apiClient.get<{ data: ActivityPoint[] }>('/analytics/login-activity');
      return res.data.data;
    },
  });

  // Transform for Recharts PieChart
  const pieData = (distData ?? []).map(d => ({
    name:  d.role,
    value: Number(d.count),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-charcoal">Analytics</h1>
        <p className="text-sm text-pewter mt-0.5">
          Workspace growth trends, role breakdown, and login activity.
        </p>
      </div>

      {/* Row 1: User Growth (full width) */}
      <ChartCard
        title="User Growth"
        description="Monthly cumulative user registrations over all time"
      >
        {growthLoading ? (
          <ChartSkeleton height={260} />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={growthData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#7a8a6b" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#7a8a6b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#d5d8dc" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#8b8f94' }}
                tickLine={false}
                axisLine={{ stroke: '#d5d8dc' }}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: '#8b8f94' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{ background: '#fff', border: '1px solid #d5d8dc', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ fontWeight: 600, color: '#2d3142' }}
              />
              <Area
                type="monotone"
                dataKey="count"
                name="New Users"
                stroke="#7a8a6b"
                strokeWidth={2}
                fill="url(#growthGrad)"
                dot={{ r: 3, fill: '#7a8a6b' }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* Row 2: Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Role Distribution */}
        <ChartCard
          title="Role Distribution"
          description="Number of users assigned to each role"
        >
          {distLoading ? (
            <ChartSkeleton height={240} />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieData.map((_entry, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={value => (
                    <span style={{ fontSize: 12, color: '#8b8f94', textTransform: 'capitalize' }}>
                      {value}
                    </span>
                  )}
                />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Login Activity */}
        <ChartCard
          title="Login Activity"
          description="Daily login events over the last 30 days"
        >
          {activityLoading ? (
            <ChartSkeleton height={240} />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={activityData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d5d8dc" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: '#8b8f94' }}
                  tickLine={false}
                  axisLine={{ stroke: '#d5d8dc' }}
                  tickFormatter={v => {
                    const d = new Date(v + 'T00:00');
                    return isNaN(d.getTime())
                      ? v.slice(5)
                      : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#8b8f94' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #d5d8dc', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ fontWeight: 600, color: '#2d3142' }}
                  labelFormatter={(_label, payload) => {
                    const raw = (payload?.[0]?.payload as { date?: string })?.date;
                    if (!raw) return _label as string;
                    const d = new Date(raw + 'T00:00');
                    return isNaN(d.getTime())
                      ? raw
                      : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Logins"
                  stroke="#516a78"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#516a78' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
