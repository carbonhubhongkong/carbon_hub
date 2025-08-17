'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { useTranslations } from 'next-intl';
import type { ChartConfig, ChartType, AggregationType, DataField, ChartValidationError, ChartSuggestion } from '../types/analytics';

interface ChartBuilderProps {
  chartConfig?: ChartConfig | null;
  onSave: (config: ChartConfig) => void;
  onCancel: () => void;
}

const ChartBuilder: React.FC<ChartBuilderProps> = ({ chartConfig, onSave, onCancel }) => {
  const t = useTranslations();
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
    { key: 'activityName', label: t('stage2.formLabels.activityName'), type: 'string', chartCompatible: true, description: t('stage3.chartBuilder.fieldDescriptions.activityName') },
    { key: 'reportingPeriodStart', label: t('stage2.formLabels.reportingPeriodStart'), type: 'date', chartCompatible: true, description: t('stage3.chartBuilder.fieldDescriptions.reportingPeriodStart') },
    { key: 'reportingPeriodEnd', label: t('stage2.formLabels.reportingPeriodEnd'), type: 'date', chartCompatible: true, description: t('stage3.chartBuilder.fieldDescriptions.reportingPeriodEnd') },
    { key: 'scope', label: t('stage2.formLabels.scope'), type: 'string', chartCompatible: true, description: t('stage3.chartBuilder.fieldDescriptions.scope') },
    { key: 'category', label: t('stage2.formLabels.category'), type: 'string', chartCompatible: true, description: t('stage3.chartBuilder.fieldDescriptions.category') },
    { key: 'location', label: t('stage2.formLabels.location'), type: 'string', chartCompatible: true, description: t('stage3.chartBuilder.fieldDescriptions.location') },
    { key: 'quantity', label: t('stage2.formLabels.quantity'), type: 'number', chartCompatible: true, description: t('stage3.chartBuilder.fieldDescriptions.quantity') },
    { key: 'emissionFactorId', label: t('stage2.formLabels.emissionFactorId'), type: 'string', chartCompatible: true, description: t('stage3.chartBuilder.fieldDescriptions.emissionFactorId') },
    { key: 'calculatedEmissions', label: t('stage2.formLabels.calculatedEmissions'), type: 'number', chartCompatible: true, description: t('stage3.chartBuilder.fieldDescriptions.calculatedEmissions') }
  ], [t]);

  const chartTypes: { value: ChartType; label: string; description: string }[] = useMemo(() => [
    { value: 'bar', label: t('stage3.chartBuilder.chartTypes.bar'), description: t('stage3.chartBuilder.chartTypeDescriptions.bar') },
    { value: 'line', label: t('stage3.chartBuilder.chartTypes.line'), description: t('stage3.chartBuilder.chartTypeDescriptions.line') },
    { value: 'pie', label: t('stage3.chartBuilder.chartTypes.pie'), description: t('stage3.chartBuilder.chartTypeDescriptions.pie') },
    { value: 'donut', label: t('stage3.chartBuilder.chartTypes.donut'), description: t('stage3.chartBuilder.chartTypeDescriptions.donut') }
  ], [t]);

  const aggregationTypes: { value: AggregationType; label: string; description: string }[] = useMemo(() => [
    { value: 'sum', label: t('stage3.chartBuilder.aggregationTypes.sum'), description: t('stage3.chartBuilder.aggregationTypeDescriptions.sum') },
    { value: 'average', label: t('stage3.chartBuilder.aggregationTypes.average'), description: t('stage3.chartBuilder.aggregationTypeDescriptions.average') },
    { value: 'count', label: t('stage3.chartBuilder.aggregationTypes.count'), description: t('stage3.chartBuilder.aggregationTypeDescriptions.count') },
    { value: 'min', label: t('stage3.chartBuilder.aggregationTypes.min'), description: t('stage3.chartBuilder.aggregationTypeDescriptions.min') },
    { value: 'max', label: t('stage3.chartBuilder.aggregationTypes.max'), description: t('stage3.chartBuilder.aggregationTypeDescriptions.max') }
  ], [t]);

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
      newErrors.push({ field: 'title', message: t('stage3.chartBuilder.validation.chartTitleRequired'), severity: 'error' });
    }

    if (!config.xAxis) {
      newErrors.push({ field: 'xAxis', message: t('stage3.chartBuilder.validation.xAxisRequired'), severity: 'error' });
    }

    if (!config.yAxis) {
      newErrors.push({ field: 'yAxis', message: t('stage3.chartBuilder.validation.yAxisRequired'), severity: 'error' });
    }

    if (config.xAxis === config.yAxis) {
      newErrors.push({ field: 'yAxis', message: t('stage3.chartBuilder.validation.axesMustBeDifferent'), severity: 'error' });
    }

    // Validate chart type compatibility
    const xField = dataFields.find(f => f.key === config.xAxis);
    const yField = dataFields.find(f => f.key === config.yAxis);

    if (config.chartType === 'pie' || config.chartType === 'donut') {
      if (xField?.type === 'number' || yField?.type === 'date') {
        newErrors.push({ 
          field: 'chartType', 
          message: t('stage3.chartBuilder.validation.pieDonutCategoricalWarning'), 
          severity: 'warning' 
        });
      }
    }

    if (config.chartType === 'line') {
      if (xField?.type !== 'date' && xField?.type !== 'string') {
        newErrors.push({ 
          field: 'xAxis', 
          message: t('stage3.chartBuilder.validation.lineChartWarning'), 
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
        title: t('stage3.chartBuilder.suggestions.emissionsByScope.title'),
        description: t('stage3.chartBuilder.suggestions.emissionsByScope.description'),
        chartType: 'bar',
        xAxis: 'scope',
        yAxis: 'calculatedEmissions',
        aggregation: 'sum',
        reason: t('stage3.chartBuilder.suggestions.emissionsByScope.reason')
      });
    }

    // Suggestion 2: Emissions by Category
    if (config.xAxis !== 'category' || config.yAxis !== 'calculatedEmissions') {
      newSuggestions.push({
        title: t('stage3.chartBuilder.suggestions.emissionsByCategory.title'),
        description: t('stage3.chartBuilder.suggestions.emissionsByCategory.description'),
        chartType: 'pie',
        xAxis: 'category',
        yAxis: 'calculatedEmissions',
        aggregation: 'sum',
        reason: t('stage3.chartBuilder.suggestions.emissionsByCategory.reason')
      });
    }

    // Suggestion 3: Emissions Over Time
    if (config.xAxis !== 'reportingPeriodStart' || config.yAxis !== 'calculatedEmissions') {
      newSuggestions.push({
        title: t('stage3.chartBuilder.suggestions.emissionsOverTime.title'),
        description: t('stage3.chartBuilder.suggestions.emissionsOverTime.description'),
        chartType: 'line',
        xAxis: 'reportingPeriodStart',
        yAxis: 'calculatedEmissions',
        aggregation: 'sum',
        reason: t('stage3.chartBuilder.suggestions.emissionsOverTime.reason')
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
    toast.success(t('stage3.chartBuilder.toast.suggestionApplied'));
  };

  const handleSave = () => {
    if (errors.some(e => e.severity === 'error')) {
      toast.error(t('stage3.chartBuilder.toast.fixErrorsBeforeSaving'));
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
            {chartConfig ? t('stage3.chartBuilder.editChart') : t('stage3.chartBuilder.createNewChart')}
          </h3>
          <button onClick={onCancel} className="btn-close">×</button>
        </div>

        <div className="modal-body">
          <div className="chart-builder-form">
            {/* Chart Title */}
            <div className="form-group">
              <label htmlFor="chartTitle">{t('stage3.chartBuilder.formLabels.chartTitle')} *</label>
              <input
                id="chartTitle"
                type="text"
                className={`form-input ${errors.find(e => e.field === 'title') ? 'form-input-error' : ''}`}
                value={config.title}
                onChange={(e) => setConfig({ ...config, title: e.target.value })}
                                  placeholder={t('stage3.chartBuilder.placeholders.enterChartTitle')}
              />
              {errors.find(e => e.field === 'title') && (
                <div className="form-error-message">
                  {errors.find(e => e.field === 'title')?.message}
                </div>
              )}
            </div>

            {/* Chart Type */}
            <div className="form-group">
              <label htmlFor="chartType">{t('stage3.chartBuilder.formLabels.chartType')} *</label>
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
                <label htmlFor="xAxis">{t('stage3.chartBuilder.formLabels.xAxisField')} *</label>
                <select
                  id="xAxis"
                  className={`form-input ${errors.find(e => e.field === 'xAxis') ? 'form-input-error' : ''}`}
                  value={config.xAxis}
                  onChange={(e) => setConfig({ ...config, xAxis: e.target.value })}
                >
                  <option value="">{t('stage3.chartBuilder.placeholders.selectXAxisField')}</option>
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
                <label htmlFor="yAxis">{t('stage3.chartBuilder.formLabels.yAxisField')} *</label>
                <select
                  id="yAxis"
                  className={`form-input ${errors.find(e => e.field === 'yAxis') ? 'form-input-error' : ''}`}
                  value={config.yAxis}
                  onChange={(e) => setConfig({ ...config, yAxis: e.target.value })}
                >
                  <option value="">{t('stage3.chartBuilder.placeholders.selectYAxisField')}</option>
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
              <label htmlFor="aggregation">{t('stage3.chartBuilder.formLabels.aggregationMethod')} *</label>
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
                <label htmlFor="xAxisLabel">{t('stage3.chartBuilder.formLabels.xAxisLabel')}</label>
                <input
                  id="xAxisLabel"
                  type="text"
                  className="form-input"
                  value={config.xAxisLabel}
                  onChange={(e) => setConfig({ ...config, xAxisLabel: e.target.value })}
                  placeholder={t('stage3.chartBuilder.placeholders.leaveEmptyForFieldName')}
                />
              </div>

              <div className="form-group">
                <label htmlFor="yAxisLabel">{t('stage3.chartBuilder.formLabels.yAxisLabel')}</label>
                <input
                  id="yAxisLabel"
                  type="text"
                  className="form-input"
                  value={config.yAxisLabel}
                  onChange={(e) => setConfig({ ...config, yAxisLabel: e.target.value })}
                  placeholder={t('stage3.chartBuilder.placeholders.leaveEmptyForFieldName')}
                />
              </div>
            </div>

            {/* Color Palette */}
            <div className="form-group">
              <label>{t('stage3.chartBuilder.formLabels.colorPalette')}</label>
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
                <label>{t('stage3.chartBuilder.formLabels.chartSuggestions')}</label>
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
                        {t('stage3.chartBuilder.apply')}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings */}
            {errors.some(e => e.severity === 'warning') && (
              <div className="form-warnings">
                <h4>{t('stage3.chartBuilder.warnings')}</h4>
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
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSave}
            className="btn btn-primary"
            disabled={!isFormValid()}
          >
            {chartConfig ? t('stage3.chartBuilder.updateChart') : t('stage3.chartBuilder.createChart')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChartBuilder;
