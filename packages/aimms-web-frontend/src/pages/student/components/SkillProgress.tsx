import React from "react"
import { Card, CardContent, Typography, Box, Chip } from "@mui/material"
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts"
import { Psychology as PsychologyIcon } from "@mui/icons-material"

interface SkillData {
  skill: string
  value: number
}

interface SkillProgressProps {
  skills: SkillData[]
}

export const SkillProgress: React.FC<SkillProgressProps> = ({ skills }) => (
  <Card
    sx={{
      background: "linear-gradient(to right, rgba(0, 51, 102, 0.02), rgba(171, 5, 32, 0.02))",
      position: "relative",
      overflow: "hidden",
      "&::before": {
        content: '""',
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "radial-gradient(circle at top right, rgba(171, 5, 32, 0.05), transparent 70%)",
        pointerEvents: "none",
      },
    }}>
    <CardContent>
      <Typography
        variant="h6"
        gutterBottom
        sx={{
          display: "flex",
          alignItems: "center",
          color: "#0C234B",
          borderBottom: "2px solid rgba(12, 35, 75, 0.1)",
          pb: 1,
          mb: 3,
        }}>
        <PsychologyIcon sx={{ mr: 1 }} />
        Clinical Competency Profile
      </Typography>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 3 }}>
        {skills.map((skill) => (
          <Chip
            key={skill.skill}
            label={`${skill.skill}: ${skill.value}%`}
            sx={{
              bgcolor:
                skill.value >= 80
                  ? "#1E5288" // Azurite
                  : skill.value >= 70
                    ? "#378DBD" // Oasis
                    : skill.value >= 60
                      ? "#A95C42" // Mesa
                      : "#AB0520", // Arizona Red
              color: "white",
              "& .MuiChip-label": {
                fontWeight: "medium",
              },
            }}
          />
        ))}
      </Box>

      <Box
        sx={{
          height: 400,
          position: "relative",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "radial-gradient(circle at center, rgba(30, 82, 136, 0.05), transparent)",
            borderRadius: "50%",
            pointerEvents: "none",
          },
        }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={skills}>
            <PolarGrid gridType="circle" stroke="#0C234B" strokeOpacity={0.1} />
            <PolarAngleAxis dataKey="skill" tick={{ fill: "#0C234B", fontSize: 12 }} />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={{ fill: "#0C234B" }}
              stroke="#0C234B"
              strokeOpacity={0.1}
            />
            <Radar
              name="Skills"
              dataKey="value"
              stroke="#1E5288"
              fill="#1E5288"
              fillOpacity={0.3}
            />
            <RechartsTooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload
                  return (
                    <Box
                      sx={{
                        bgcolor: "white",
                        p: 1.5,
                        border: "1px solid rgba(12, 35, 75, 0.1)",
                        borderRadius: 1,
                        boxShadow: 2,
                      }}>
                      <Typography variant="subtitle2" sx={{ color: "#0C234B" }}>
                        {data.skill}
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#1E5288", fontWeight: "bold" }}>
                        Proficiency:
                        {" "}
                        {data.value}
%
</Typography>
                    </Box>
                  )
                }
                return null
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </Box>

      <Box
        sx={{
          mt: 3,
          p: 2,
          bgcolor: "rgba(30, 82, 136, 0.05)",
          borderRadius: 2,
          border: "1px solid rgba(30, 82, 136, 0.1)",
        }}>
        <Typography variant="subtitle2" sx={{ color: "#0C234B", mb: 1 }}>
          Skill Insights
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Strongest Area:{" "}
          {skills.reduce((max, skill) => (skill.value > max.value ? skill : max)).skill}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Area for Improvement:{" "}
          {skills.reduce((min, skill) => (skill.value < min.value ? skill : min)).skill}
        </Typography>
      </Box>
    </CardContent>
  </Card>
)
