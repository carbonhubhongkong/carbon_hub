'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import type { FilterConfig } from '../types/analytics';
import type { ReportingActivity } from '@/lib/indexedDB';

interface GlobalFiltersProps {
  data: ReportingActivity[];
  filters: FilterConfig[];
  onFiltersChange: (filters: FilterConfig[]) => void;
}

const GlobalFilters: React.FC<GlobalFiltersProps> = ({ data, filters, onFiltersChange }) => {
  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState<FilterConfig[]>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const dataFields = [
    { key: 'activityName', label: 'Activity Name', type: 'string' },
    { key: 'reportingPeriodStart', label: 'Period Start Date', type: 'date' },
    { key: 'reportingPeriodEnd', label: 'Period End Date', type: 'date' },
    { key: 'scope', label: 'Scope', type: 'string' },
    { key: 'category', label: 'Category', type: 'string' },
    { key: 'location', label: 'Location', type: 'string' },
    { key: 'quantity', label: 'Quantity', type: 'number' },
    { key: 'emissionFactorId', label: 'Emission Factor', type: 'string' },
    { key: 'calculatedEmissions', label: 'Calculated Emissions', type: 'number' }
  ];

  const operators = [
    { value: 'contains', label: 'Contains', description: 'Field contains the value' },
    { value: 'equals', label: 'Equals', description: 'Field exactly matches the value' },
    { value: 'startsWith', label: 'Starts with', description: 'Field starts with the value' },
    { value: 'endsWith', label: 'Ends with', description: 'Field ends with the value' }
  ];

  const getUniqueValues = (field: string): string[] => {
    const values = data.map(item => item[field as keyof ReportingActivity]);
    const uniqueValues = [...new Set(values)].filter(v => v !== undefined && v !== null);
    return uniqueValues.map(v => String(v)).sort();
  };

  const addFilter = () => {
    const newFilter: FilterConfig = {
      id: `filter-${Date.now()}`,
      field: '',
      value: '',
      operator: 'contains'
    };
    const updatedFilters = [...localFilters, newFilter];
    setLocalFilters(updatedFilters);
  };

  const updateFilter = (id: string, updates: Partial<FilterConfig>) => {
    const updatedFilters = localFilters.map(filter =>
      filter.id === id ? { ...filter, ...updates } : filter
    );
    setLocalFilters(updatedFilters);
  };

  const removeFilter = (id: string) => {
    const updatedFilters = localFilters.filter(filter => filter.id !== id);
    setLocalFilters(updatedFilters);
  };

  const clearAllFilters = () => {
    setLocalFilters([]);
    onFiltersChange([]);
    toast.success('All filters cleared');
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
    setShowFilters(false);
    toast.success(`${localFilters.length} filter${localFilters.length !== 1 ? 's' : ''} applied`);
  };

  const getFilteredDataCount = () => {
    let filtered = [...data];
    
    localFilters.forEach(filter => {
      if (filter.value && filter.value !== '') {
        filtered = filtered.filter(activity => {
          const fieldValue = activity[filter.field as keyof ReportingActivity];
          if (fieldValue === undefined || fieldValue === null) return false;
          
          const fieldStr = String(fieldValue).toLowerCase();
          const filterStr = filter.value.toLowerCase();
          
          switch (filter.operator) {
            case 'contains':
              return fieldStr.includes(filterStr);
            case 'equals':
              return fieldStr === filterStr;
            case 'startsWith':
              return fieldStr.startsWith(filterStr);
            case 'endsWith':
              return fieldStr.endsWith(filterStr);
            default:
              return true;
          }
        });
      }
    });
    
    return filtered.length;
  };

  const activeFiltersCount = localFilters.filter(f => f.value && f.value !== '').length;
  const totalDataCount = data.length;
  const filteredDataCount = getFilteredDataCount();

  return (
    <div className="global-filters">
      <div className="filters-header">
        <div className="filters-summary">
          <h3 className="section-title">Data Filters</h3>
          <div className="filters-stats">
            <span className="filter-stat">
              {activeFiltersCount} active filter{activeFiltersCount !== 1 ? 's' : ''}
            </span>
            <span className="filter-stat">
              {filteredDataCount} of {totalDataCount} records
            </span>
          </div>
        </div>
        
        <div className="filters-actions">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn ${showFilters ? 'btn-secondary' : 'btn-primary'}`}
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
          
          {activeFiltersCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="btn btn-secondary"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {showFilters && (
        <div className="filters-panel">
          <div className="filters-content">
            {localFilters.length === 0 ? (
              <div className="no-filters">
                <p>No filters configured. Add a filter to narrow down your data.</p>
                <button onClick={addFilter} className="btn btn-primary">
                  + Add First Filter
                </button>
              </div>
            ) : (
              <>
                {localFilters.map((filter) => (
                  <div key={filter.id} className="filter-row">
                    <div className="filter-field">
                      <label>Field</label>
                      <select
                        value={filter.field}
                        onChange={(e) => updateFilter(filter.id, { field: e.target.value })}
                        className="form-input"
                      >
                        <option value="">Select field</option>
                        {dataFields.map(field => (
                          <option key={field.key} value={field.key}>
                            {field.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="filter-operator">
                      <label>Operator</label>
                      <select
                        value={filter.operator}
                        onChange={(e) => updateFilter(filter.id, { operator: e.target.value as 'contains' | 'equals' | 'startsWith' | 'endsWith' })}
                        className="form-input"
                      >
                        {operators.map(op => (
                          <option key={op.value} value={op.value}>
                            {op.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="filter-value">
                      <label>Value</label>
                      {filter.field && (
                        <div className="filter-value-input">
                          <input
                            type="text"
                            value={filter.value}
                            onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                            className="form-input"
                            placeholder="Enter filter value"
                            list={`values-${filter.field}`}
                          />
                          <datalist id={`values-${filter.field}`}>
                            {getUniqueValues(filter.field).slice(0, 20).map(value => (
                              <option key={value} value={value} />
                            ))}
                          </datalist>
                        </div>
                      )}
                    </div>

                    <div className="filter-actions">
                      <button
                        onClick={() => removeFilter(filter.id)}
                        className="btn btn-danger btn-small"
                        title="Remove filter"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}

                <div className="filters-footer">
                  <button onClick={addFilter} className="btn btn-secondary">
                    + Add Another Filter
                  </button>
                  
                  <div className="filters-apply">
                    <button
                      onClick={applyFilters}
                      className="btn btn-primary"
                      disabled={activeFiltersCount === 0}
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Filter Help */}
          <div className="filters-help">
            <h4>💡 Filter Tips</h4>
            <ul>
              <li>Use multiple filters to narrow down your data</li>
              <li>Filters apply to all charts simultaneously</li>
              <li>Date fields work with partial date strings</li>
              <li>Number fields support numeric comparisons</li>
            </ul>
          </div>
        </div>
      )}

      {/* Quick Filter Pills */}
      {activeFiltersCount > 0 && (
        <div className="active-filters">
          {localFilters
            .filter(f => f.value && f.value !== '')
            .map(filter => {
              const fieldLabel = dataFields.find(f => f.key === filter.field)?.label || filter.field;
              return (
                <span key={filter.id} className="filter-pill">
                  <span className="filter-pill-label">{fieldLabel}</span>
                  <span className="filter-pill-operator">{filter.operator}</span>
                  <span className="filter-pill-value">{filter.value}</span>
                  <button
                    onClick={() => removeFilter(filter.id)}
                    className="filter-pill-remove"
                    title="Remove filter"
                  >
                    ×
                  </button>
                </span>
              );
            })}
        </div>
      )}
    </div>
  );
};

export default GlobalFilters;
