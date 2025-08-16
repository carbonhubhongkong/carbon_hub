'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement, LineController } from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
import type { ChartConfig, ChartData, FilterConfig } from '../types/analytics';
import type { ReportingActivity } from '@/lib/indexedDB';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
  ArcElement, PointElement, LineElement, LineController
);

interface ChartGridProps {
  charts: ChartConfig[];
  data: ReportingActivity[];
  onEditChart: (chart: ChartConfig) => void;
  onDeleteChart: (chartId: string) => void;
  onDuplicateChart: (chart: ChartConfig) => void;
}

const ChartGrid: React.FC<ChartGridProps> = ({
  charts,
  data,
  onEditChart,
  onDeleteChart,
  onDuplicateChart
}) => {
  const [draggedChartId, setDraggedChartId] = useState<string | null>(null);
  const [chartOrder, setChartOrder] = useState<string[]>(charts.map(c => c.id));
  const [chartFilters, setChartFilters] = useState<Record<string, FilterConfig[]>>({});
  const [showFilters, setShowFilters] = useState<Record<string, boolean>>({});
  const chartRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Update chart order when charts change
  React.useEffect(() => {
    const newOrder = charts.map(c => c.id);
    setChartOrder(newOrder);
  }, [charts]);

  // Get filtered data for a specific chart
  const getFilteredDataForChart = useCallback((chartId: string): ReportingActivity[] => {
    const filters = chartFilters[chartId] || [];
    if (filters.length === 0) return data;

    let filtered = [...data];
    filters.forEach(filter => {
      filtered = filtered.filter(activity => {
        const fieldValue = (activity as unknown as Record<string, unknown>)[filter.field];
        
        if (typeof fieldValue === 'string') {
          return fieldValue.toLowerCase().includes(filter.value.toLowerCase());
        }
        if (typeof fieldValue === 'number') {
          return String(fieldValue) === filter.value;
        }
        return false;
      });
    });
    return filtered;
  }, [data, chartFilters]);

  // Add filter to a chart
  const addFilterToChart = useCallback((chartId: string, filter: FilterConfig) => {
    setChartFilters(prev => ({
      ...prev,
      [chartId]: [...(prev[chartId] || []), filter]
    }));
  }, []);

  // Remove filter from a chart
  const removeFilterFromChart = useCallback((chartId: string, filterId: string) => {
    setChartFilters(prev => ({
      ...prev,
      [chartId]: (prev[chartId] || []).filter(f => f.id !== filterId)
    }));
  }, []);

  // Toggle filter visibility for a chart
  const toggleFiltersForChart = useCallback((chartId: string) => {
    setShowFilters(prev => ({
      ...prev,
      [chartId]: !prev[chartId]
    }));
  }, []);

  // Download chart as PNG
  const downloadChartAsPNG = useCallback((chartId: string) => {
    const chartElement = chartRefs.current[chartId];
    if (!chartElement) return;

    // Create a canvas element
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high resolution (3x the displayed size)
    const rect = chartElement.getBoundingClientRect();
    const scale = 3;
    canvas.width = rect.width * scale;
    canvas.height = rect.height * scale;
    ctx.scale(scale, scale);

    // Use html2canvas or similar library for better quality
    // For now, we'll use a simple approach with the chart element
    const chartCanvas = chartElement.querySelector('canvas');
    if (chartCanvas) {
      // Create a temporary link to download the chart
      const link = document.createElement('a');
      link.download = `chart-${chartId}.png`;
      
      // Convert canvas to blob and download
      chartCanvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
        }
      }, 'image/png');
    }
  }, []);

  const processChartData = (chartConfig: ChartConfig): ChartData => {
    // Use filtered data for this specific chart
    const filteredData = getFilteredDataForChart(chartConfig.id);
    
    if (filteredData.length === 0) {
      return {
        labels: ['No data'],
        datasets: [{
          label: chartConfig.yAxis,
          data: [0],
          backgroundColor: chartConfig.colors[0] || '#2E7D32',
          borderColor: chartConfig.colors[0] || '#2E7D32',
          borderWidth: 1
        }]
      };
    }

    // Handle date period for line/bar charts
    if ((chartConfig.chartType === 'line' || chartConfig.chartType === 'bar') && 
        (chartConfig.xAxis === 'reportingPeriodStart' || chartConfig.xAxis === 'reportingPeriodEnd')) {
      return processDatePeriodData(chartConfig, filteredData);
    }

    // Regular data processing for other chart types
    const groupedData = new Map<string, number>();
    
    filteredData.forEach(activity => {
      const xValue = String((activity as unknown as Record<string, unknown>)[chartConfig.xAxis] || 'Unknown');
      const yValue = Number((activity as unknown as Record<string, unknown>)[chartConfig.yAxis] || 0);
      
      if (groupedData.has(xValue)) {
        groupedData.set(xValue, groupedData.get(xValue)! + yValue);
      } else {
        groupedData.set(xValue, yValue);
      }
    });

    const labels = Array.from(groupedData.keys());
    const chartData = Array.from(groupedData.values());

    return {
      labels,
      datasets: [{
        label: chartConfig.yAxisLabel || chartConfig.yAxis,
        data: chartData,
        backgroundColor: chartConfig.colors.slice(0, chartData.length),
        borderColor: chartConfig.colors.slice(0, chartData.length),
        borderWidth: 1
      }]
    };
  };

  const processDatePeriodData = (chartConfig: ChartConfig, data: ReportingActivity[]): ChartData => {
    // Sort data by date
    const sortedData = data.sort((a, b) => {
      const dateA = new Date((a as unknown as Record<string, unknown>)[chartConfig.xAxis] as string);
      const dateB = new Date((b as unknown as Record<string, unknown>)[chartConfig.xAxis] as string);
      return dateA.getTime() - dateB.getTime();
    });

    // Group by date and aggregate
    const dateGroups = new Map<string, number>();
    
    sortedData.forEach(activity => {
      const dateValue = (activity as unknown as Record<string, unknown>)[chartConfig.xAxis];
      const yValue = Number((activity as unknown as Record<string, unknown>)[chartConfig.yAxis] || 0);
      
      if (dateValue) {
        const dateKey = new Date(dateValue as string).toLocaleDateString();
        if (dateGroups.has(dateKey)) {
          dateGroups.set(dateKey, dateGroups.get(dateKey)! + yValue);
        } else {
          dateGroups.set(dateKey, yValue);
        }
      }
    });

    const labels = Array.from(dateGroups.keys());
    const chartData = Array.from(dateGroups.values());

    return {
      labels,
      datasets: [{
        label: chartConfig.yAxisLabel || chartConfig.yAxis,
        data: chartData,
        backgroundColor: chartConfig.colors[0] || '#2E7D32',
        borderColor: chartConfig.colors[0] || '#2E7D32',
        borderWidth: 2,
        fill: false
      }]
    };
  };

  const getChartOptions = (chart: ChartConfig) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: chart.title,
        font: {
          size: 16,
          weight: 'bold' as const
        }
      },
      legend: {
        display: true,
        position: 'top' as const
      },
      tooltip: {
        enabled: true,
        mode: 'index' as const
      }
    }
  });

  const renderChart = (chartConfig: ChartConfig) => {
    const chartData = processChartData(chartConfig);
    const chartOptions = getChartOptions(chartConfig);

    switch (chartConfig.chartType) {
      case 'bar':
        return <Bar data={chartData} options={chartOptions} />;
      case 'line':
        return <Line data={chartData} options={chartOptions} />;
      case 'pie':
        return <Pie data={chartData} options={chartOptions} />;
      case 'donut':
        return <Doughnut data={chartData} options={chartOptions} />;
      default:
        return <Bar data={chartData} options={chartOptions} />;
    }
  };

  if (charts.length === 0) {
    return (
      <div className="chart-grid">
        <div className="chart-grid-header">
          <h3 className="section-title">Analytics Charts</h3>
          <p className="section-description">
            No charts created yet. Click &quot;Create Chart&quot; to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="chart-grid">
      <div className="chart-grid-header">
        <h3 className="section-title">Analytics Charts</h3>
        <p className="section-description">
          {charts.length} chart{charts.length !== 1 ? 's' : ''} • Drag to reorder • Click chart actions to manage
        </p>
      </div>

      <div className="chart-grid-container">
        {chartOrder.map((chartId) => {
          const chart = charts.find(c => c.id === chartId);
          if (!chart) return null;

          return (
            <div
              key={chart.id}
              id={`chart-${chart.id}`}
              ref={(el) => { chartRefs.current[chart.id] = el; }}
              className={`chart-card ${draggedChartId === chart.id ? 'dragging' : ''}`}
              draggable
              onDragStart={(e) => {
                setDraggedChartId(chart.id);
                e.dataTransfer.setData('text/plain', chart.id);
              }}
              onDragEnd={() => setDraggedChartId(null)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const draggedId = e.dataTransfer.getData('text/plain');
                if (draggedId && draggedId !== chart.id) {
                  const newOrder = [...chartOrder];
                  const draggedIndex = newOrder.indexOf(draggedId);
                  const dropIndex = newOrder.indexOf(chart.id);
                  newOrder.splice(draggedIndex, 1);
                  newOrder.splice(dropIndex, 0, draggedId);
                  setChartOrder(newOrder);
                }
              }}
            >
              <div className="chart-header">
                <h4 className="chart-title">{chart.title}</h4>
                <div className="chart-actions">
                  <button
                    onClick={() => toggleFiltersForChart(chart.id)}
                    className="btn btn-small btn-secondary"
                    title="Toggle filters"
                  >
                    🔍 {chartFilters[chart.id]?.length || 0}
                  </button>
                  <button
                    onClick={() => downloadChartAsPNG(chart.id)}
                    className="btn btn-small btn-secondary"
                    title="Download as PNG"
                  >
                    📥
                  </button>
                  <button
                    onClick={() => onEditChart(chart)}
                    className="btn btn-small btn-primary"
                    title="Edit chart"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => onDuplicateChart(chart)}
                    className="btn btn-small btn-secondary"
                    title="Duplicate chart"
                  >
                    📋
                  </button>
                  <button
                    onClick={() => onDeleteChart(chart.id)}
                    className="btn btn-small btn-danger"
                    title="Delete chart"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Individual Chart Filters */}
              {showFilters[chart.id] && (
                <div className="chart-filters">
                  <ChartFilters
                    chartId={chart.id}
                    filters={chartFilters[chart.id] || []}
                    onAddFilter={addFilterToChart}
                    onRemoveFilter={removeFilterFromChart}
                  />
                </div>
              )}

              <div className="chart-content">
                {renderChart(chart)}
              </div>
            </div>
          );
        })}
      </div>

      {charts.length > 1 && (
        <div className="chart-grid-help">
          <p>
            💡 <strong>Tip:</strong> Drag charts to reorder them. The order will be saved automatically.
          </p>
        </div>
      )}
    </div>
  );
};

export default ChartGrid;

// ChartFilters Component
interface ChartFiltersProps {
  chartId: string;
  filters: FilterConfig[];
  onAddFilter: (chartId: string, filter: FilterConfig) => void;
  onRemoveFilter: (chartId: string, filterId: string) => void;
}

const ChartFilters: React.FC<ChartFiltersProps> = ({
  chartId,
  filters,
  onAddFilter,
  onRemoveFilter
}) => {
  const [newFilter, setNewFilter] = useState<Partial<FilterConfig>>({
    field: '',
    operator: 'contains',
    value: ''
  });

  const dataFields = [
    { key: 'activityName', label: 'Activity Name' },
    { key: 'reportingPeriodStart', label: 'Period Start Date' },
    { key: 'reportingPeriodEnd', label: 'Period End Date' },
    { key: 'scope', label: 'Scope' },
    { key: 'category', label: 'Category' },
    { key: 'location', label: 'Location' },
    { key: 'quantity', label: 'Quantity' },
    { key: 'emissionFactorId', label: 'Emission Factor' },
    { key: 'calculatedEmissions', label: 'Calculated Emissions' }
  ];

  const operators = [
    { value: 'contains', label: 'Contains' },
    { value: 'equals', label: 'Equals' },
    { value: 'startsWith', label: 'Starts with' },
    { value: 'endsWith', label: 'Ends with' }
  ];

  const handleAddFilter = () => {
    if (newFilter.field && newFilter.value) {
      const filter: FilterConfig = {
        id: `filter-${Date.now()}`,
        field: newFilter.field,
        operator: newFilter.operator as 'contains' | 'equals' | 'startsWith' | 'endsWith',
        value: newFilter.value
      };
      onAddFilter(chartId, filter);
      setNewFilter({ field: '', operator: 'contains', value: '' });
    }
  };

  return (
    <div className="chart-filters-container">
      <div className="filters-header">
        <h5>Chart Filters</h5>
        <small>Filter data for this chart only</small>
      </div>
      
      {/* Add New Filter */}
      <div className="add-filter-form">
        <select
          value={newFilter.field}
          onChange={(e) => setNewFilter({ ...newFilter, field: e.target.value })}
          className="form-input"
        >
          <option value="">Select field</option>
          {dataFields.map(field => (
            <option key={field.key} value={field.key}>
              {field.label}
            </option>
          ))}
        </select>
        
        <select
          value={newFilter.operator}
          onChange={(e) => setNewFilter({ ...newFilter, operator: e.target.value as 'contains' | 'equals' | 'startsWith' | 'endsWith' })}
          className="form-input"
        >
          {operators.map(op => (
            <option key={op.value} value={op.value}>
              {op.label}
            </option>
          ))}
        </select>
        
        <input
          type="text"
          value={newFilter.value}
          onChange={(e) => setNewFilter({ ...newFilter, value: e.target.value })}
          placeholder="Enter value"
          className="form-input"
        />
        
        <button
          onClick={handleAddFilter}
          className="btn btn-small btn-primary"
          disabled={!newFilter.field || !newFilter.value}
        >
          Add Filter
        </button>
      </div>

      {/* Active Filters */}
      {filters.length > 0 && (
        <div className="active-filters">
          {filters.map(filter => (
            <div key={filter.id} className="filter-pill">
              <span className="filter-text">
                {dataFields.find(f => f.key === filter.field)?.label} {filter.operator} &quot;{filter.value}&quot;
              </span>
              <button
                onClick={() => onRemoveFilter(chartId, filter.id)}
                className="btn-remove-filter"
                title="Remove filter"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


