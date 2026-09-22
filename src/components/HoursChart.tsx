"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

export function HoursChart({ data }: { data: { label: string; hours: number }[] }) {
  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#9494ab", fontSize: 11 }}
          />
          <Tooltip
            cursor={{ fill: "rgba(129,140,248,0.08)" }}
            contentStyle={{
              background: "#1a1a29",
              border: "1px solid #262638",
              borderRadius: 12,
              fontSize: 12,
            }}
            labelStyle={{ color: "#f4f4f8" }}
            formatter={(value) => [`${Number(value).toFixed(1)}h`, "logged"]}
          />
          <Bar dataKey="hours" radius={[6, 6, 6, 6]} fill="#818cf8" maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
