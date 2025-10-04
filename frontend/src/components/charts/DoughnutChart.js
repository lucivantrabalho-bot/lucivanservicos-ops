import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { useTheme } from '../../contexts/ThemeContext';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function DoughnutChart({ data, title, height = 300 }) {
  const { isDark } = useTheme();

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: isDark ? '#e2e8f0' : '#374151',
          font: {
            size: 12,
            weight: 500
          },
          padding: 20,
          usePointStyle: true
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
        displayColors: true,
        callbacks: {
          label: function(context) {
            const dataset = context.dataset;
            const currentValue = dataset.data[context.dataIndex];
            const total = dataset.data.reduce((acc, val) => acc + val, 0);
            const percentage = ((currentValue / total) * 100).toFixed(1);
            return `${context.label}: ${currentValue} (${percentage}%)`;
          }
        }
      }
    },
    cutout: '60%',
    elements: {
      arc: {
        borderWidth: 2,
        borderColor: isDark ? '#1e293b' : '#ffffff'
      }
    },
    animation: {
      duration: 750,
      easing: 'easeOutQuart'
    }
  };

  return (
    <div style={{ height: `${height}px` }} className="relative">
      <Doughnut data={data} options={options} />
    </div>
  );
}