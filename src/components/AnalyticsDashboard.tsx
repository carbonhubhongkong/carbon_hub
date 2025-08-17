'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement, LineController } from 'chart.js';
import { toast } from 'react-hot-toast';
import { useTranslations } from 'next-intl';
import indexedDBService from '@/lib/indexedDB';
import type { ReportingActivity, EmissionFactor } from '@/lib/indexedDB';
import ChartBuilder from './ChartBuilder';
import ChartGrid from './ChartGrid';
import { ChartConfig } from '../types/analytics';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
  ArcElement, PointElement, LineElement, LineController
);

const AnalyticsDashboard: React.FC = () => {
  const t = useTranslations();
  const [activities, setActivities] = useState<ReportingActivity[]>([]);
  const [emissionFactors, setEmissionFactors] = useState<EmissionFactor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [charts, setCharts] = useState<ChartConfig[]>([]);
  const [showChartBuilder, setShowChartBuilder] = useState(false);
  const [editingChart, setEditingChart] = useState<ChartConfig | null>(null);
  const [filteredData, setFilteredData] = useState<ReportingActivity[]>([]);

  // Define all functions before they're used in useEffect
  const getDefaultCharts = useCallback((): ChartConfig[] => {
    return [
      {
        id: 'default-1',
        title: t('stage3.defaultCharts.emissionsByScope'),
        chartType: 'bar',
        xAxis: 'scope',
        yAxis: 'calculatedEmissions',
        aggregation: 'sum',
        xAxisLabel: t('stage2.formLabels.scope'),
        yAxisLabel: t('stage3.defaultCharts.emissionsYAxisLabel'),
        colors: ['#2E7D32', '#4CAF50', '#8BC34A', '#CDDC39'],
        isDefault: true
      }
    ];
  }, []);

  const loadSavedCharts = useCallback(() => {
    try {
      const savedCharts = localStorage.getItem('carbon-hub-charts');
      if (savedCharts) {
        const parsedCharts = JSON.parse(savedCharts);
        setCharts(parsedCharts);
      } else {
        // Load default recommended charts
        setCharts(getDefaultCharts());
      }
    } catch (error) {
      console.error('Error loading saved charts:', error);
      setCharts(getDefaultCharts());
    }
  }, [getDefaultCharts]);

  const saveCharts = useCallback((chartsToSave: ChartConfig[]) => {
    try {
      localStorage.setItem('carbon-hub-charts', JSON.stringify(chartsToSave));
      setCharts(chartsToSave);
    } catch (error) {
      console.error('Error saving charts:', error);
              toast.error(t('stage3.toast.saveChartConfigurationFailed'));
    }
  }, []);

  const fetchData = async () => {
    try {
      const [activitiesData, factorsData] = await Promise.all([
        indexedDBService.getAllReportingActivities(),
        indexedDBService.getAllEmissionFactors()
      ]);

      setActivities(activitiesData);
      setEmissionFactors(factorsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error(t('stage3.toast.fetchReportDataFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = useCallback(() => {
    // The globalFilters state was removed, so this function is no longer needed.
    // If specific filters are needed, they should be implemented here.
    
    setFilteredData([...activities]);
  }, [activities]);

  // Now use the functions in useEffect after they're defined
  useEffect(() => {
    fetchData();
    loadSavedCharts();
  }, [loadSavedCharts]);

  useEffect(() => {
    applyFilters();
  }, [activities, applyFilters]);

  const addChart = (chartConfig: ChartConfig) => {
    const newChart = {
      ...chartConfig,
      id: `chart-${Date.now()}`,
      isDefault: false
    };
    const updatedCharts = [...charts, newChart];
    saveCharts(updatedCharts);
    setShowChartBuilder(false);
    setEditingChart(null);
    toast.success(t('stage3.toast.chartAddedSuccessfully'));
  };

  const updateChart = (updatedChart: ChartConfig) => {
    const updatedCharts = charts.map(chart => 
      chart.id === updatedChart.id ? updatedChart : chart
    );
    saveCharts(updatedCharts);
    setShowChartBuilder(false);
    setEditingChart(null);
    toast.success(t('stage3.toast.chartUpdatedSuccessfully'));
  };

  const deleteChart = (chartId: string) => {
    const updatedCharts = charts.filter(chart => chart.id !== chartId);
    saveCharts(updatedCharts);
    toast.success(t('stage3.toast.chartDeletedSuccessfully'));
  };

  const duplicateChart = (chart: ChartConfig) => {
    const duplicatedChart = {
      ...chart,
      id: `chart-${Date.now()}`,
      title: `${chart.title} ${t('stage3.chartCopySuffix')}`,
      isDefault: false
    };
    const updatedCharts = [...charts, duplicatedChart];
    saveCharts(updatedCharts);
    toast.success(t('stage3.toast.chartDuplicatedSuccessfully'));
  };

  const editChart = (chart: ChartConfig) => {
    setEditingChart(chart);
    setShowChartBuilder(true);
  };

  const getEmissionFactorDescription = (emissionFactorId: string, activity?: ReportingActivity) => {
    // First check if the activity has emission factor data stored directly
    if (activity?.emissionFactorData) {
      return `${activity.emissionFactorData.description} (${activity.emissionFactorData.co2ePerUnit} ${activity.emissionFactorData.emissionFactorUnit})`;
    }
    
    // Fallback to looking up by ID
    const factor = emissionFactors.find(f => f._id === emissionFactorId);
    return factor ? `${factor.description} (${factor.co2ePerUnit} ${factor.emissionFactorUnit})` : '';
  };

  const generateCSV = useCallback((data: ReportingActivity[]): string => {
    const headers = [
      t('stage2.formLabels.activityName'),
      t('stage2.formLabels.reportingPeriodStart'),
      t('stage2.formLabels.reportingPeriodEnd'),
      t('stage2.formLabels.scope'),
      t('stage2.formLabels.category'),
      t('stage2.formLabels.location'),
      t('stage2.formLabels.quantity'),
      t('stage2.formLabels.emissionFactorId'),
      t('stage2.formLabels.remarks'),
      t('stage2.formLabels.calculatedEmissions')
    ];

    const csvData = data.map(activity => [
      activity.activityName,
      activity.reportingPeriodStart,
      activity.reportingPeriodEnd,
      activity.scope,
      activity.category,
      activity.location,
      activity.quantity,
      getEmissionFactorDescription(activity.emissionFactorId || '', activity),
      activity.remarks || '',
      activity.calculatedEmissions?.toFixed(2) || '0'
    ]);

    return [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  }, [emissionFactors]);

  const downloadCSV = useCallback((content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
          toast.success(t('stage3.toast.csvExportedSuccessfully'));
  }, []);

  if (isLoading) {
    return (
      <div className="stage">
        <h2 className="stage-title">{t('stage3.title')}</h2>
        <div className="loading">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="stage">
      <h2 className="stage-title">{t('stage3.title')}</h2>

      {/* Global Filters */}
      {/* The GlobalFilters component was removed, so this section is no longer needed. */}

      {/* Dashboard Actions */}
      <div className="dashboard-actions">
        <button 
          onClick={() => setShowChartBuilder(true)}
          className="btn btn-primary"
        >
          + {t('stage3.createNewChart')}
        </button>
        <button 
          onClick={() => {
            setCharts(getDefaultCharts());
            saveCharts(getDefaultCharts());
            toast.success(t('stage3.toast.resetToDefaultCharts'));
          }}
          className="btn btn-secondary"
        >
          {t('stage3.resetToDefaults')}
        </button>
      </div>

      {/* Chart Grid */}
      <ChartGrid
        charts={charts}
        data={activities}
        onEditChart={editChart}
        onDeleteChart={deleteChart}
        onDuplicateChart={duplicateChart}
      />

      {/* Chart Builder Modal */}
      {showChartBuilder && (
        <ChartBuilder
          chartConfig={editingChart}
          onSave={editingChart ? updateChart : addChart}
          onCancel={() => {
            setShowChartBuilder(false);
            setEditingChart(null);
          }}
        />
      )}

      {/* Data Export Section */}
      <div className="data-section">
        <div className="table-header">
          <h3 className="section-title">{t('stage3.detailedDataExport')}</h3>
          <button 
            onClick={() => {
              const csvContent = generateCSV(filteredData);
              downloadCSV(csvContent, 'emissions_analytics.csv');
            }}
            className="btn btn-secondary"
          >
            {t('stage3.exportFilteredData')}
          </button>
        </div>
        <div className="table-container">
          {filteredData.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('stage2.formLabels.activityName')}</th>
                  <th>{t('stage2.formLabels.reportingPeriodStart')}</th>
                  <th>{t('stage2.formLabels.reportingPeriodEnd')}</th>
                  <th>{t('stage2.formLabels.scope')}</th>
                  <th>{t('stage2.formLabels.category')}</th>
                  <th>{t('stage2.formLabels.location')}</th>
                  <th>{t('stage2.formLabels.quantity')}</th>
                  <th>{t('stage2.formLabels.emissionFactorId')}</th>
                  <th>{t('stage2.formLabels.remarks')}</th>
                  <th>{t('stage2.formLabels.calculatedEmissions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((activity) => (
                  <tr key={activity._id}>
                    <td>{activity.activityName}</td>
                    <td>{activity.reportingPeriodStart}</td>
                    <td>{activity.reportingPeriodEnd}</td>
                    <td>{activity.scope}</td>
                    <td>{activity.category}</td>
                    <td>{activity.location}</td>
                    <td>{activity.quantity}</td>
                    <td>{getEmissionFactorDescription(activity.emissionFactorId || '', activity)}</td>
                    <td>{activity.remarks || '-'}</td>
                    <td>{activity.calculatedEmissions?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="total-row">
                  <td colSpan={9}><strong>{t('stage3.totalEmissions')}</strong></td>
                  <td><strong>
                    {filteredData
                      .reduce((sum, activity) => sum + (activity.calculatedEmissions || 0), 0)
                      .toFixed(2)} kg CO2e
                  </strong></td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <div className="no-data">
              {/* The globalFilters.length > 0 check was removed, so this message is no longer relevant. */}
              {t('stage3.noActivitiesFound')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
