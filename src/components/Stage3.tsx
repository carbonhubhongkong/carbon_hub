'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { toast } from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface ReportingActivity {
  _id: string;
  reportingPeriodStart: string;
  reportingPeriodEnd: string;
  scope: string;
  category: string;
  activityName: string;
  location: string;
  quantity: number;
  emissionFactorId: string;
  remarks?: string;
  calculatedEmissions?: number;
}

interface EmissionFactor {
  _id: string;
  description: string;
  scope: string;
  category: string;
  co2ePerUnit: number;
  emissionFactorUnit: string;
}

const Stage3: React.FC = () => {
  const [activities, setActivities] = useState<ReportingActivity[]>([]);
  const [emissionFactors, setEmissionFactors] = useState<EmissionFactor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const chartRef = useRef<ChartJS<'bar'> | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [activitiesResponse, factorsResponse] = await Promise.all([
        fetch('/api/reporting-activities'),
        fetch('/api/emission-factors/general')
      ]);

      const activitiesData = await activitiesResponse.json();
      const factorsData = await factorsResponse.json();

      setActivities(activitiesData);
      setEmissionFactors(factorsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch report data');
    } finally {
      setIsLoading(false);
    }
  };

  const getEmissionFactorDescription = (id: string) => {
    const factor = emissionFactors.find(f => f._id === id);
    return factor ? `${factor.description} (${factor.co2ePerUnit} ${factor.emissionFactorUnit})` : '';
  };

  const exportToCSV = () => {
    if (activities.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = [
      'Activity Name',
      'Reporting Period Start',
      'Reporting Period End',
      'Scope',
      'Category',
      'Location',
      'Quantity',
      'Emission Factor',
      'Calculated Emissions (kg CO2e)',
      'Remarks'
    ];

    const csvData = activities.map(activity => [
      activity.activityName,
      activity.reportingPeriodStart,
      activity.reportingPeriodEnd,
      activity.scope,
      activity.category,
      activity.location,
      activity.quantity,
      getEmissionFactorDescription(activity.emissionFactorId),
      activity.calculatedEmissions?.toFixed(2) || '0',
      activity.remarks || ''
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `emissions_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV exported successfully!');
  };

  const downloadChart = () => {
    if (chartRef.current) {
      const canvas = chartRef.current.canvas;
      const link = document.createElement('a');
      link.download = `emissions_chart_${new Date().toISOString().split('T')[0]}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.8);
      link.click();
      toast.success('Chart downloaded successfully!');
    }
  };

  // Prepare chart data
  const prepareChartData = () => {
    const scopes = [...new Set(activities.map(a => a.scope))];
    const periods = [...new Set(activities.map(a => `${a.reportingPeriodStart} to ${a.reportingPeriodEnd}`))];

    const datasets = scopes.map((scope, index) => {
      const colors = ['#2E7D32', '#4CAF50', '#8BC34A', '#CDDC39'];
      return {
        label: scope,
        data: periods.map(period => {
          const periodActivities = activities.filter(a => 
            a.scope === scope && 
            `${a.reportingPeriodStart} to ${a.reportingPeriodEnd}` === period
          );
          return periodActivities.reduce((sum, activity) => sum + (activity.calculatedEmissions || 0), 0);
        }),
        backgroundColor: colors[index % colors.length],
        borderColor: colors[index % colors.length],
        borderWidth: 1
      };
    });

    return {
      labels: periods,
      datasets
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Emissions by Scope and Reporting Period',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Emissions (kg CO2e)'
        }
      }
    }
  };

  if (isLoading) {
    return (
      <div className="stage">
        <h2 className="stage-title">Report</h2>
        <div className="loading">Loading report data...</div>
      </div>
    );
  }

  return (
    <div className="stage">
      <h2 className="stage-title">Report</h2>

      {/* Chart Section */}
      <div className="chart-section">
        <div className="chart-header">
          <h3 className="section-title">Emissions Overview</h3>
          <button onClick={downloadChart} className="btn btn-secondary">
            Download Chart
          </button>
        </div>
        <div className="chart-container">
          {activities.length > 0 ? (
            <Bar ref={chartRef} data={prepareChartData()} options={chartOptions} />
          ) : (
            <div className="no-data">No data available for chart</div>
          )}
        </div>
      </div>

      {/* Table Section */}
      <div className="data-section">
        <div className="table-header">
          <h3 className="section-title">Detailed Emissions Report</h3>
          <button onClick={exportToCSV} className="btn btn-secondary">
            Export CSV
          </button>
        </div>
        <div className="table-container">
          {activities.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Activity Name</th>
                  <th>Reporting Period</th>
                  <th>Scope</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Quantity</th>
                  <th>Emission Factor</th>
                  <th>Calculated Emissions (kg CO2e)</th>
                </tr>
              </thead>
              <tbody>
                {activities
                  .sort((a, b) => {
                    // Sort by scope first, then by reporting period
                    if (a.scope !== b.scope) return a.scope.localeCompare(b.scope);
                    return a.reportingPeriodStart.localeCompare(b.reportingPeriodStart);
                  })
                  .map((activity) => (
                    <tr key={activity._id}>
                      <td>{activity.activityName}</td>
                      <td>{activity.reportingPeriodStart} to {activity.reportingPeriodEnd}</td>
                      <td>{activity.scope}</td>
                      <td>{activity.category}</td>
                      <td>{activity.location}</td>
                      <td>{activity.quantity}</td>
                      <td>{getEmissionFactorDescription(activity.emissionFactorId)}</td>
                      <td>{activity.calculatedEmissions?.toFixed(2)}</td>
                    </tr>
                  ))}
              </tbody>
              <tfoot>
                <tr className="total-row">
                  <td colSpan={7}><strong>Total Emissions</strong></td>
                  <td><strong>
                    {activities
                      .reduce((sum, activity) => sum + (activity.calculatedEmissions || 0), 0)
                      .toFixed(2)} kg CO2e
                  </strong></td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <div className="no-data">No activities found. Please add some activities in Stage 2.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Stage3; 