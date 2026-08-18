'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useTheme } from 'next-themes';
import {
  ArcElement,
  Chart,
  DoughnutController,
  Tooltip,
  type ChartConfiguration,
} from 'chart.js';
import Typography from '@/components/ui/typography';
import type { StatSlice } from '@/lib/actions/stats';

Chart.register(DoughnutController, ArcElement, Tooltip);

const OTHER = 'Other';

// Categorical palettes derived from the app's theme hues, snapped to a
// colorblind-safe, contrast-checked set (see the dataviz validator). Three named
// hues + a neutral "Other"; a donut never shows more than these four slices.
const PALETTES = {
  light: {
    surface: '#f4e8d3', // parchment — the 2px gap between arcs
    hues: ['#c0304c', '#b9871f', '#2f6fc0'], // crimson · gold · blue
    other: '#9a8f7e',
    tooltipBg: '#1c0f0f',
    tooltipText: '#f4e8d3',
  },
  dark: {
    surface: '#131a24',
    hues: ['#4189d0', '#c28430', '#c2688f'], // blue · amber · rose
    other: '#5b6472',
    tooltipBg: '#0b1018',
    tooltipText: '#d9dee8',
  },
} as const;

// Sequential rust "heat" ramp for the spice donut — milder (index 0) to hottest.
// Validated with the dataviz --ordinal check. Slices must arrive in level order
// so position i maps to ramp[i]; zero-count levels are dropped from the legend.
const RAMP = {
  light: ['#cf7a44', '#bd5f30', '#a5461f', '#843415', '#62230d'],
  dark: ['#7a3a22', '#9a4a2a', '#bd6038', '#d97a4c', '#e89a68'],
} as const;

export function CategoryDonut({
  data,
  title,
  emptyLabel,
  variant = 'categorical',
}: {
  data: StatSlice[];
  // Used to build the canvas accessible label, e.g. "Genres read: …".
  title: string;
  emptyLabel: string;
  // 'categorical' → theme hues by identity; 'sequential' → rust ramp by
  // position (for the ordinal spice levels).
  variant?: 'categorical' | 'sequential';
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart<'doughnut'> | null>(null);
  const { resolvedTheme } = useTheme();
  const mode = resolvedTheme === 'dark' ? 'dark' : 'light';

  const total = useMemo(
    () => data.reduce((sum, d) => sum + d.value, 0),
    [data]
  );

  // The color each slice gets. Sequential → the rust ramp by position; else
  // named hues by identity (gray for Other). Shared by the canvas and the
  // legend so they always agree.
  const colors = useMemo(() => {
    if (variant === 'sequential') return data.map((_, i) => RAMP[mode][i]);
    const p = PALETTES[mode];
    return data.map((d, i) => (d.label === OTHER ? p.other : p.hues[i]));
  }, [data, mode, variant]);

  useEffect(() => {
    if (!canvasRef.current || total === 0) return;
    const p = PALETTES[mode];

    const config: ChartConfiguration<'doughnut'> = {
      type: 'doughnut',
      data: {
        labels: data.map((d) => d.label),
        datasets: [
          {
            data: data.map((d) => d.value),
            backgroundColor: colors,
            borderColor: p.surface,
            borderWidth: 2,
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '64%',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: p.tooltipBg,
            titleColor: p.tooltipText,
            bodyColor: p.tooltipText,
            padding: 10,
            displayColors: false,
            callbacks: {
              label: (ctx) => {
                const value = ctx.parsed;
                const pct = total ? Math.round((value / total) * 100) : 0;
                return `${value} book${value === 1 ? '' : 's'} · ${pct}%`;
              },
            },
          },
        },
      },
    };

    chartRef.current = new Chart(canvasRef.current, config);

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [data, colors, mode, total]);

  if (total === 0) {
    return (
      <Typography
        variant='p2'
        color='muted'
        classNames='py-md'
      >
        {emptyLabel}
      </Typography>
    );
  }

  return (
    <div className='flex flex-col items-center gap-sm'>
      <div className='relative h-40 w-40 shrink-0'>
        <canvas
          ref={canvasRef}
          role='img'
          aria-label={`${title}: ${data
            .filter((d) => d.value > 0)
            .map((d) => `${d.label} ${d.value}`)
            .join(', ')}`}
        />
        {/* Total sits in the donut hole. */}
        <div className='pointer-events-none absolute inset-0 flex flex-col items-center justify-center'>
          <Typography
            variant='h4'
            display
            classNames='!mb-0 text-foreground leading-none'
          >
            {total}
          </Typography>
          <Typography
            variant='caption'
            color='muted'
            classNames='text-[11px]'
          >
            {total === 1 ? 'book' : 'books'}
          </Typography>
        </div>
      </div>

      {/* Legend doubles as the table view — every slice named with its count,
          so identity never rests on color alone. */}
      <ul className='flex w-full flex-col gap-1.5'>
        {data.map((d, i) => {
          if (d.value === 0) return null; // e.g. an unused spice level
          const pct = total ? Math.round((d.value / total) * 100) : 0;
          return (
            <li
              key={d.label}
              className='flex items-center gap-2 text-sm'
            >
              <span
                className='size-3 shrink-0 rounded-[3px]'
                style={{ backgroundColor: colors[i] }}
                aria-hidden
              />
              <span className='flex-1 truncate text-foreground'>{d.label}</span>
              <span className='shrink-0 text-muted-foreground tabular-nums'>
                {d.value} · {pct}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
