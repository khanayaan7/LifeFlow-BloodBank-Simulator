import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const COLORS = ["#af101a", "#7c7c7c", "#27AE60", "#F39C12", "#2196F3"];

export default function TemperatureChart({ data, lines }) {
  return (
    <div className="w-full h-80">
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e7e1ec" />
          <XAxis dataKey="time" stroke="#49454f" />
          <YAxis domain={[0, 14]} stroke="#49454f" />
          <Tooltip 
            contentStyle={{
              backgroundColor: "#fffbfe",
              border: "1px solid #e7e1ec",
              borderRadius: "8px"
            }}
          />
          <Legend />
          {lines.map((line, idx) => (
            <Line 
              key={line} 
              type="monotone" 
              dataKey={line} 
              stroke={COLORS[idx % COLORS.length]} 
              dot={false}
              strokeWidth={2}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
