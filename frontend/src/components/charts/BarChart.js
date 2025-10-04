import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useTheme } from '../../contexts/ThemeContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function BarChart({ data, title, height = 300, horizontal = false }) {
  const { isDark } = useTheme();

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: horizontal ? 'y' : 'x',
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: isDark ? '#e2e8f0' : '#374151',
          font: {
            size: 12,
            weight: 500
          }
        }
      },
      title: {
        display: !!title,
        text: title,
        color: isDark ? '#f1f5f9' : '#1f2937',
        font: {
          size: 16,
          weight: 600
        }
      },
      tooltip: {
        backgroundColor: isDark ? '#1e293b' : '#ffffff',
        titleColor: isDark ? '#f1f5f9' : '#1f2937',
        bodyColor: isDark ? '#e2e8f0' : '#374151',
        borderColor: isDark ? '#475569' : '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true
      }
    },
    scales: {
      x: {
        grid: {
          color: isDark ? '#334155' : '#f3f4f6',
          lineWidth: 1
        },
        ticks: {
          color: isDark ? '#94a3b8' : '#6b7280',
          font: {
            size: 11
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: isDark ? '#334155' : '#f3f4f6',
          lineWidth: 1
        },
        ticks: {
          color: isDark ? '#94a3b8' : '#6b7280',
          font: {
            size: 11
          }
        }
      }
    },
    elements: {
      bar: {
        borderRadius: 4,
        borderWidth: 0
      }
    },
    animation: {
      duration: 750,
      easing: 'easeOutQuart'
    }
  };

  return (
    <div style={{ height: `${height}px` }} className="relative">
      <Bar data={data} options={options} />
    </div>
  );
}