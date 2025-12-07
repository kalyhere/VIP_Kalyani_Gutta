import React from "react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { Paper, Typography, Box, useTheme } from "@mui/material"

// Helper function to get chart colors from theme
const getChartColors = (theme: any) => [
  theme.palette.primary.light,
  theme.palette.secondary.main,
  theme.palette.secondary.light,
  theme.palette.primary.main,
  theme.palette.success.main,
  theme.palette.warning.main,
]

interface ChartWrapperProps {
  title: string
  children: React.ReactNode
  height?: number
}

const ChartWrapper: React.FC<ChartWrapperProps> = ({ title, children, height = 300 }) => {
  const theme = useTheme()

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        height: "100%",
      }}>
      <Typography
        variant="h6"
        sx={{
          fontWeight: 600,
          color: theme.palette.primary.light,
          mb: 2,
        }}>
        {title}
      </Typography>
      <Box sx={{ width: "100%", height }}>{children}</Box>
    </Paper>
  )
}

interface UserActivityChartProps {
  data: { hour: number; count: number }[]
}

const UserActivityChart: React.FC<UserActivityChartProps> = ({ data }) => {
  const theme = useTheme()
  const formattedData = data.map((d) => ({
    ...d,
    hour: `${d.hour}:00`,
  }))

  return (
    <ChartWrapper title="User Activity by Hour">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formattedData}>
          <defs>
            <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={theme.palette.secondary.main} stopOpacity={0.8} />
              <stop offset="95%" stopColor={theme.palette.secondary.main} stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis dataKey="hour" stroke={theme.palette.text.secondary} />
          <YAxis stroke={theme.palette.text.secondary} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: `1px solid ${theme.palette.secondary.main}`,
              borderRadius: 4,
            }}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke={theme.palette.secondary.main}
            fillOpacity={1}
            fill="url(#activityGradient)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartWrapper>
  )
}

interface RoleDistributionChartProps {
  data: { role: string; count: number }[]
}

const RoleDistributionChart: React.FC<RoleDistributionChartProps> = ({ data }) => {
  const theme = useTheme()
  const chartColors = getChartColors(theme)
  const total = data.reduce((sum, item) => sum + item.count, 0)
  const formattedData = data.map((item) => ({
    ...item,
    percentage: ((item.count / total) * 100).toFixed(1),
  }))

  return (
    <ChartWrapper title="User Distribution" height={250}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={formattedData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={(entry) => `${entry.role}: ${entry.percentage}%`}
            outerRadius={80}
            fill={theme.palette.primary.light}
            dataKey="count">
            {formattedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: `1px solid ${theme.palette.primary.light}`,
              borderRadius: 4,
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartWrapper>
  )
}

interface CasePopularityChartProps {
  data: { title: string; uses: number }[]
}

const CasePopularityChart: React.FC<CasePopularityChartProps> = ({ data }) => {
  const theme = useTheme()
  const chartColors = getChartColors(theme)

  return (
    <ChartWrapper title="Popular Medical Cases">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="horizontal"
          margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis type="number" stroke={theme.palette.text.secondary} />
          <YAxis
            type="category"
            dataKey="title"
            stroke={theme.palette.text.secondary}
            width={90}
            tick={{ fontSize: 11 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: `1px solid ${theme.palette.primary.light}`,
              borderRadius: 4,
            }}
          />
          <Bar dataKey="uses" fill={theme.palette.secondary.light}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  )
}

interface LoginTrendsChartProps {
  data: number[]
  labels?: string[]
}

const LoginTrendsChart: React.FC<LoginTrendsChartProps> = ({ data, labels }) => {
  const theme = useTheme()
  const days = labels || ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  const formattedData = data.map((value, index) => ({
    day: days[index],
    logins: value,
  }))

  return (
    <ChartWrapper title="Weekly Login Trends">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis dataKey="day" stroke={theme.palette.text.secondary} />
          <YAxis stroke={theme.palette.text.secondary} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: `1px solid ${theme.palette.primary.light}`,
              borderRadius: 4,
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="logins"
            stroke={theme.palette.primary.main}
            strokeWidth={2}
            dot={{ fill: theme.palette.primary.main, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartWrapper>
  )
}

interface PerformanceRadarChartProps {
  data: {
    metric: string
    value: number
    fullMark: number
  }[]
}

const PerformanceRadarChart: React.FC<PerformanceRadarChartProps> = ({ data }) => {
  const theme = useTheme()

  return (
    <ChartWrapper title="Platform Performance Metrics" height={350}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid stroke="#e0e0e0" />
          <PolarAngleAxis dataKey="metric" stroke={theme.palette.text.secondary} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} stroke={theme.palette.text.secondary} />
          <Radar
            name="Current"
            dataKey="value"
            stroke={theme.palette.secondary.main}
            fill={theme.palette.secondary.main}
            fillOpacity={0.6}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: `1px solid ${theme.palette.secondary.main}`,
              borderRadius: 4,
            }}
          />
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  )
}

interface SessionTimelineChartProps {
  data: {
    time: string
    virtual_patient: number
    mcc: number
    aimhei: number
    suture: number
  }[]
}

const SessionTimelineChart: React.FC<SessionTimelineChartProps> = ({ data }) => {
  const theme = useTheme()

  return (
    <ChartWrapper title="Active Sessions Timeline">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis dataKey="time" stroke={theme.palette.text.secondary} />
          <YAxis stroke={theme.palette.text.secondary} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: `1px solid ${theme.palette.primary.light}`,
              borderRadius: 4,
            }}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="virtual_patient"
            stackId="1"
            stroke={theme.palette.primary.light}
            fill={theme.palette.primary.light}
            name="Virtual Patient"
          />
          <Area
            type="monotone"
            dataKey="mcc"
            stackId="1"
            stroke={theme.palette.secondary.main}
            fill={theme.palette.secondary.main}
            name="MCC"
          />
          <Area
            type="monotone"
            dataKey="aimhei"
            stackId="1"
            stroke={theme.palette.secondary.light}
            fill={theme.palette.secondary.light}
            name="AIMHEI"
          />
          <Area
            type="monotone"
            dataKey="suture"
            stackId="1"
            stroke={theme.palette.success.main}
            fill={theme.palette.success.main}
            name="Suture"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartWrapper>
  )
}

export {
  UserActivityChart,
  RoleDistributionChart,
  CasePopularityChart,
  LoginTrendsChart,
  PerformanceRadarChart,
  SessionTimelineChart,
}
