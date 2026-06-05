"use client"
import React, { useEffect, useRef, useState } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

interface GuestPieChartProps {
  title: string;
  data: { name: string; value: number; color: string }[];
  height?: number;
}

export function GuestPieChart({
  title,
  data,
  height = 300
}: GuestPieChartProps) {
  const [containerWidth, setContainerWidth] = useState(100);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    });

    resizeObserver.observe(containerRef.current);

    if (containerRef.current.clientWidth > 0) {
      setContainerWidth(containerRef.current.clientWidth);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="min-w-0">
        <div
          ref={containerRef}
          style={{
            width: '100%',
            height: `${height}px`
          }}
        >
          {containerWidth > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
