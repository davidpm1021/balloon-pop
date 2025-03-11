import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const formatAsDollars = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value * 100);
};

export function StatsChart({ gameHistory }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');

    // Prepare data
    const rounds = gameHistory.map((_, index) => `Round ${index + 1}`);
    const bankedClicks = gameHistory.map(round => round.bankedClicks);
    const poppedClicks = gameHistory.map(round => round.poppedClicks);

    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: rounds,
        datasets: [
          {
            label: 'Banked Amount',
            data: bankedClicks,
            backgroundColor: 'rgba(34, 197, 94, 0.5)', // green-500
            borderColor: 'rgb(34, 197, 94)',
            borderWidth: 1,
          },
          {
            label: 'Lost Amount',
            data: poppedClicks,
            backgroundColor: 'rgba(239, 68, 68, 0.5)', // red-500
            borderColor: 'rgb(239, 68, 68)',
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Performance by Round',
            color: 'rgba(255, 255, 255, 0.8)',
            font: {
              size: 16,
              weight: 'bold',
            },
          },
          legend: {
            labels: {
              color: 'rgba(255, 255, 255, 0.8)',
            },
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.raw;
                return `${context.dataset.label}: ${formatAsDollars(value)}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              color: 'rgba(255, 255, 255, 0.1)',
            },
            ticks: {
              color: 'rgba(255, 255, 255, 0.8)',
            },
          },
          y: {
            grid: {
              color: 'rgba(255, 255, 255, 0.1)',
            },
            ticks: {
              color: 'rgba(255, 255, 255, 0.8)',
              callback: function(value) {
                return formatAsDollars(value);
              }
            },
            beginAtZero: true,
          },
        },
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [gameHistory]);

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
      <div className="w-full h-64">
        <canvas ref={chartRef} />
      </div>
    </div>
  );
} 