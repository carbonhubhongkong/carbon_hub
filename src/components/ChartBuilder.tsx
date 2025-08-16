'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import type { ChartConfig, ChartType, AggregationType, DataField, ChartValidationError, ChartSuggestion } from '../types/analytics';

interface ChartBuilderProps {
  chartConfig?: ChartConfig | null;
  onSave: (config: ChartConfig) => void;
  onCancel: () => void;
}

const ChartBuilder: React.FC<ChartBuilderProps> = ({ chartConfig, onSave, onCancel }) => {
  const [config, setConfig] = useState<ChartConfig>({
    id: '',
    title: '',
    chartType: 'bar',
    xAxis: '',
    yAxis: '',
    aggregation: 'sum',
    xAxisLabel: '',
    yAxisLabel: '',
    colors: ['#2E7D32', '#4CAF50', '#8BC34A', '#CDDC39'],
    description: ''
  });
  const [errors, setErrors] = useState<ChartValidationError[]>([]);
  const [suggestions, setSuggestions] = useState<ChartSuggestion[]>([]);

  // Define data fields and options first
  const dataFields: DataField[] = useMemo(() => [
    { key: 'activityName', label: 'Activity Name', type: 'string', chartCompatible: true, description: 'Name of the activity' },
    { key: 'reportingPeriodStart', label: 'Period Start Date', type: 'date', chartCompatible: true, description: 'Start date of reporting period' },
    { key: 'reportingPeriodEnd', label: 'Period End Date', type: 'date', chartCompatible: true, description: 'End date of reporting period' },
    { key: 'scope', label: 'Scope', type: 'string', chartCompatible: true, description: 'GHG scope classification' },
    { key: 'category', label: 'Category', type: 'string', chartCompatible: true, description: 'Activity category' },
    { key: 'location', label: 'Country/Region/Location', type: 'string', chartCompatible: true, description: 'Geographic location' },
    { key: 'quantity', label: 'Quantity', type: 'number', chartCompatible: true, description: 'Activity quantity' },
    { key: 'emissionFactorId', label: 'Emission Factor', type: 'string', chartCompatible: true, description: 'Emission factor identifier' },
    { key: 'calculatedEmissions', label: 'Calculated Emissions', type: 'number', chartCompatible: true, description: 'Calculated CO2e emissions' }
  ], []);

  const chartTypes: { value: ChartType; label: string; description: string }[] = useMemo(() => [
    { value: 'bar', label: 'Bar Chart', description: 'Best for comparing categories or showing trends over time' },
    { value: 'line', label: 'Line Chart', description: 'Ideal for showing trends and changes over time' },
    { value: 'pie', label: 'Pie Chart', description: 'Great for showing parts of a whole' },
    { value: 'donut', label: 'Donut Chart', description: 'Similar to pie chart but with center space' }
  ], []);

  const aggregationTypes: { value: AggregationType; label: string; description: string }[] = useMemo(() => [
    { value: 'sum', label: 'Sum', description: 'Add up all values' },
    { value: 'average', label: 'Average', description: 'Calculate mean value' },
    { value: 'count', label: 'Count', description: 'Count number of records' },
    { value: 'min', label: 'Minimum', description: 'Find lowest value' },
    { value: 'max', label: 'Maximum', description: 'Find highest value' }
  ], []);

  const colorPalettes = useMemo(() => [
    ['#2E7D32', '#4CAF50', '#8BC34A', '#CDDC39'],
    ['#FF9800', '#FF5722', '#9C27B0', '#3F51B5'],
    ['#2196F3', '#03A9F4', '#00BCD4', '#009688'],
    ['#795548', '#9E9E9E', '#607D8B', '#FFC107']
  ], []);

  // Define all functions before they're used in useEffect
  const validateChart = useCallback(() => {
    const newErrors: ChartValidationError[] = [];

    if (!config.title.trim()) {
      newErrors.push({ field: 'title', message: 'Chart title is required', severity: 'error' });
    }

    if (!config.xAxis) {
      newErrors.push({ field: 'xAxis', message: 'X-axis field is required', severity: 'error' });
    }

    if (!config.yAxis) {
      newErrors.push({ field: 'yAxis', message: 'Y-axis field is required', severity: 'error' });
    }

    if (config.xAxis === config.yAxis) {
      newErrors.push({ field: 'yAxis', message: 'X and Y axes must be different', severity: 'error' });
    }

    // Validate chart type compatibility
    const xField = dataFields.find(f => f.key === config.xAxis);
    const yField = dataFields.find(f => f.key === config.yAxis);

    if (config.chartType === 'pie' || config.chartType === 'donut') {
      if (xField?.type === 'number' || yField?.type === 'date') {
        newErrors.push({ 
          field: 'chartType', 
          message: 'Pie/Donut charts work best with categorical data', 
          severity: 'warning' 
        });
      }
    }

    if (config.chartType === 'line') {
      if (xField?.type !== 'date' && xField?.type !== 'string') {
        newErrors.push({ 
          field: 'xAxis', 
          message: 'Line charts work best with date or sequential data', 
          severity: 'warning' 
        });
      }
    }

    setErrors(newErrors);
  }, [config, dataFields]);

  const generateSuggestions = useCallback(() => {
    const newSuggestions: ChartSuggestion[] = [];

    // Suggestion 1: Emissions by Scope
    if (config.xAxis !== 'scope' || config.yAxis !== 'calculatedEmissions') {
      newSuggestions.push({
        title: 'Emissions by Scope',
        description: 'Compare emissions across different GHG scopes',
        chartType: 'bar',
        xAxis: 'scope',
        yAxis: 'calculatedEmissions',
        aggregation: 'sum',
        reason: 'Scope is a categorical field perfect for bar charts'
      });
    }

    // Suggestion 2: Emissions by Category
    if (config.xAxis !== 'category' || config.yAxis !== 'calculatedEmissions') {
      newSuggestions.push({
        title: 'Emissions by Category',
        description: 'Show emissions distribution across activity categories',
        chartType: 'pie',
        xAxis: 'category',
        yAxis: 'calculatedEmissions',
        aggregation: 'sum',
        reason: 'Category breakdown works well with pie charts'
      });
    }

    // Suggestion 3: Emissions Over Time
    if (config.xAxis !== 'reportingPeriodStart' || config.yAxis !== 'calculatedEmissions') {
      newSuggestions.push({
        title: 'Emissions Over Time',
        description: 'Track emissions trends across reporting periods',
        chartType: 'line',
        xAxis: 'reportingPeriodStart',
        yAxis: 'calculatedEmissions',
        aggregation: 'sum',
        reason: 'Time series data is perfect for line charts'
      });
    }

    setSuggestions(newSuggestions);
  }, [config]);

  // Now use the functions in useEffect after they're defined
  useEffect(() => {
    if (chartConfig) {
      setConfig(chartConfig);
    }
  }, [chartConfig]);

  // Separate useEffect for validation to prevent infinite loops
  useEffect(() => {
    // Only validate if we have a config with required fields
    if (config.title || config.xAxis || config.yAxis) {
      validateChart();
    }
  }, [config.title, config.xAxis, config.yAxis, config.chartType, validateChart]);

  // Separate useEffect for suggestions to prevent infinite loops
  useEffect(() => {
    // Only generate suggestions if we have a config
    if (config.xAxis || config.yAxis) {
      generateSuggestions();
    }
  }, [config.xAxis, config.yAxis, generateSuggestions]);

  const applySuggestion = (suggestion: ChartSuggestion) => {
    setConfig({
      ...config,
      title: suggestion.title,
      chartType: suggestion.chartType,
      xAxis: suggestion.xAxis,
      yAxis: suggestion.yAxis,
      aggregation: suggestion.aggregation,
      xAxisLabel: dataFields.find(f => f.key === suggestion.xAxis)?.label || '',
      yAxisLabel: dataFields.find(f => f.key === suggestion.yAxis)?.label || ''
    });
    toast.success('Suggestion applied!');
  };

  const handleSave = () => {
    if (errors.some(e => e.severity === 'error')) {
      toast.error('Please fix the errors before saving');
      return;
    }

    const finalConfig = {
      ...config,
      id: chartConfig?.id || `chart-${Date.now()}`,
      xAxisLabel: config.xAxisLabel || dataFields.find(f => f.key === config.xAxis)?.label || '',
      yAxisLabel: config.yAxisLabel || dataFields.find(f => f.key === config.yAxis)?.label || ''
    };

    onSave(finalConfig);
  };

  const isFormValid = () => {
    return config.title.trim() && config.xAxis && config.yAxis && 
           !errors.some(e => e.severity === 'error');
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content chart-builder-modal">
        <div className="modal-header">
          <h3 className="modal-title">
            {chartConfig ? 'Edit Chart' : 'Create New Chart'}
          </h3>
          <button onClick={onCancel} className="btn-close">×</button>
        </div>

        <div className="modal-body">
          <div className="chart-builder-form">
            {/* Chart Title */}
            <div className="form-group">
              <label htmlFor="chartTitle">Chart Title *</label>
              <input
                id="chartTitle"
                type="text"
                className={`form-input ${errors.find(e => e.field === 'title') ? 'form-input-error' : ''}`}
                value={config.title}
                onChange={(e) => setConfig({ ...config, title: e.target.value })}
                placeholder="Enter chart title"
              />
              {errors.find(e => e.field === 'title') && (
                <div className="form-error-message">
                  {errors.find(e => e.field === 'title')?.message}
                </div>
              )}
            </div>

            {/* Chart Type */}
            <div className="form-group">
              <label htmlFor="chartType">Chart Type *</label>
              <div className="chart-type-options">
                {chartTypes.map(type => (
                  <label key={type.value} className="chart-type-option">
                    <input
                      type="radio"
                      name="chartType"
                      value={type.value}
                      checked={config.chartType === type.value}
                      onChange={(e) => setConfig({ ...config, chartType: e.target.value as ChartType })}
                    />
                    <div className="chart-type-info">
                      <span className="chart-type-label">{type.label}</span>
                      <span className="chart-type-description">{type.description}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* X and Y Axis Selection */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="xAxis">X-Axis Field *</label>
                <select
                  id="xAxis"
                  className={`form-input ${errors.find(e => e.field === 'xAxis') ? 'form-input-error' : ''}`}
                  value={config.xAxis}
                  onChange={(e) => setConfig({ ...config, xAxis: e.target.value })}
                >
                  <option value="">Select X-axis field</option>
                  {dataFields.map(field => (
                    <option key={field.key} value={field.key}>
                      {field.label} ({field.type})
                    </option>
                  ))}
                </select>
                {errors.find(e => e.field === 'xAxis') && (
                  <div className="form-error-message">
                    {errors.find(e => e.field === 'xAxis')?.message}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="yAxis">Y-Axis Field *</label>
                <select
                  id="yAxis"
                  className={`form-input ${errors.find(e => e.field === 'yAxis') ? 'form-input-error' : ''}`}
                  value={config.yAxis}
                  onChange={(e) => setConfig({ ...config, yAxis: e.target.value })}
                >
                  <option value="">Select Y-axis field</option>
                  {dataFields.map(field => (
                    <option key={field.key} value={field.key}>
                      {field.label} ({field.type})
                    </option>
                  ))}
                </select>
                {errors.find(e => e.field === 'yAxis') && (
                  <div className="form-error-message">
                    {errors.find(e => e.field === 'yAxis')?.message}
                  </div>
                )}
              </div>
            </div>

            {/* Aggregation */}
            <div className="form-group">
              <label htmlFor="aggregation">Aggregation Method *</label>
              <select
                id="aggregation"
                className="form-input"
                value={config.aggregation}
                onChange={(e) => setConfig({ ...config, aggregation: e.target.value as AggregationType })}
              >
                {aggregationTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label} - {type.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Axis Labels */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="xAxisLabel">X-Axis Label</label>
                <input
                  id="xAxisLabel"
                  type="text"
                  className="form-input"
                  value={config.xAxisLabel}
                  onChange={(e) => setConfig({ ...config, xAxisLabel: e.target.value })}
                  placeholder="Leave empty to use field name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="yAxisLabel">Y-Axis Label</label>
                <input
                  id="yAxisLabel"
                  type="text"
                  className="form-input"
                  value={config.yAxisLabel}
                  onChange={(e) => setConfig({ ...config, yAxisLabel: e.target.value })}
                  placeholder="Leave empty to use field name"
                />
              </div>
            </div>

            {/* Color Palette */}
            <div className="form-group">
              <label>Color Palette</label>
              <div className="color-palette-options">
                {colorPalettes.map((palette, index) => (
                  <label key={index} className="color-palette-option">
                    <input
                      type="radio"
                      name="colorPalette"
                      checked={JSON.stringify(config.colors) === JSON.stringify(palette)}
                      onChange={() => setConfig({ ...config, colors: palette })}
                    />
                    <div className="color-swatches">
                      {palette.map((color, colorIndex) => (
                        <div
                          key={colorIndex}
                          className="color-swatch"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Chart Suggestions */}
            {suggestions.length > 0 && (
              <div className="form-group">
                <label>Chart Suggestions</label>
                <div className="chart-suggestions">
                  {suggestions.map((suggestion, index) => (
                    <div key={index} className="chart-suggestion">
                      <div className="suggestion-content">
                        <h4>{suggestion.title}</h4>
                        <p>{suggestion.description}</p>
                        <small className="suggestion-reason">{suggestion.reason}</small>
                      </div>
                      <button
                        onClick={() => applySuggestion(suggestion)}
                        className="btn btn-secondary btn-small"
                      >
                        Apply
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings */}
            {errors.some(e => e.severity === 'warning') && (
              <div className="form-warnings">
                <h4>Warnings</h4>
                {errors.filter(e => e.severity === 'warning').map((error, index) => (
                  <div key={index} className="warning-message">
                    ⚠️ {error.message}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="modal-actions">
          <button onClick={onCancel} className="btn btn-secondary">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="btn btn-primary"
            disabled={!isFormValid()}
          >
            {chartConfig ? 'Update Chart' : 'Create Chart'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChartBuilder;
