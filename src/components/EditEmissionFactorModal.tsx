'use client';

import React, { useState, useEffect } from 'react';
import { emissionFactorFields, EmissionFactorData } from '../config/emissionFactorSchema';

interface EditEmissionFactorModalProps {
  isOpen: boolean;
  onClose: () => void;
  factor: EmissionFactorData | null;
  onUpdate: (updatedFactor: EmissionFactorData) => Promise<void>;
  ghgStandards: string[];
}

const EditEmissionFactorModal: React.FC<EditEmissionFactorModalProps> = ({
  isOpen,
  onClose,
  factor,
  onUpdate,
  ghgStandards,
}) => {
  const [formData, setFormData] = useState<EmissionFactorData>({
    description: '',
    scope: '',
    category: '',
    location: '',
    unit: '',
    dataSource: '',
    methodType: 'Volume Based',
    co2ePerUnit: 0,
    emissionFactorUnit: '',
    ghgReportingStandard: '',
    sourceOrDisclosureRequirement: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>({});
  const [showTooltips, setShowTooltips] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Initialize form data when factor changes
  useEffect(() => {
    if (factor) {
      console.log('EditEmissionFactorModal: Initializing with factor data:', factor);
      console.log('EditEmissionFactorModal: co2ePerUnit type:', typeof factor.co2ePerUnit, 'value:', factor.co2ePerUnit);
      
      // Check if all required fields are present
      emissionFactorFields.forEach(field => {
        const value = factor[field.key as keyof EmissionFactorData];
        console.log(`EditEmissionFactorModal: Field ${field.key}:`, { value, type: typeof value, required: field.required });
      });
      
      setFormData(factor);
      setFieldErrors({});
    }
  }, [factor]);

  // Real-time validation
  const validateField = (key: string, value: string | number): string | null => {
    const field = emissionFactorFields.find(f => f.key === key);
    if (!field) return null;

    if (field.required) {
      // Handle different types of "empty" values
      if (field.type === 'number') {
        // For numbers, check if it's undefined, null, or NaN
        if (value === undefined || value === null || (typeof value === 'number' && isNaN(value))) {
          return `${field.label} is required`;
        }
      } else {
        // For strings, check if it's undefined, null, or empty string
        // But allow empty strings if the field allows it (for CSV imports)
        if (value === undefined || value === null || 
            (typeof value === 'string' && value.trim() === '' && !field.allowEmpty)) {
          return `${field.label} is required`;
        }
      }
    }

    if (field.validation) {
      if (field.validation.min !== undefined && typeof value === 'number' && value < field.validation.min) {
        return `${field.label} must be at least ${field.validation.min}`;
      }
      if (field.validation.max !== undefined && typeof value === 'number' && value > field.validation.max) {
        return `${field.label} must be at most ${field.validation.max}`;
      }
      if (field.validation.regex && typeof value === 'string' && !new RegExp(field.validation.regex).test(value)) {
        return field.validation.customError || `${field.label} format is invalid`;
      }
      if (field.validation.enumOptions && typeof value === 'string' && !field.validation.enumOptions.includes(value)) {
        return `${field.label} must be one of: ${field.validation.enumOptions.join(', ')}`;
      }
    }

    return null;
  };

  const handleInputChange = (name: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleFieldFocus = (fieldName: string) => {
    setShowTooltips(prev => ({ ...prev, [fieldName]: true }));
  };

  const handleFieldBlur = (fieldName: string) => {
    setShowTooltips(prev => ({ ...prev, [fieldName]: false }));
    
    // Validate field on blur
    const value = formData[fieldName as keyof EmissionFactorData];
    if (value !== undefined) {
      const error = validateField(fieldName, value);
      setFieldErrors(prev => ({ ...prev, [fieldName]: error }));
    }
  };

  const getTooltipContent = (fieldName: string) => {
    const field = emissionFactorFields.find(f => f.key === fieldName);
    if (!field) return '';
    
    return (
      <div>
        <strong>{field.label}</strong>
        <br />
        Example: {field.example}
      </div>
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('EditEmissionFactorModal: Submitting form data:', formData);
    
    // Validate all fields
    const errors: Record<string, string | null> = {};
    emissionFactorFields.forEach(field => {
      const value = formData[field.key as keyof EmissionFactorData];
      console.log(`EditEmissionFactorModal: Validating ${field.key}:`, { value, type: typeof value, required: field.required });
      if (value !== undefined) {
        const error = validateField(field.key, value);
        if (error) {
          errors[field.key] = error;
          console.log(`EditEmissionFactorModal: Validation error for ${field.key}:`, error);
        }
      }
    });
    
    console.log('EditEmissionFactorModal: Validation errors:', errors);
    
    if (Object.keys(errors).some(key => errors[key] !== null)) {
      setFieldErrors(errors);
      return;
    }
    
    setIsLoading(true);
    try {
      await onUpdate(formData);
      onClose();
    } catch (error) {
      console.error('Error updating emission factor:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !factor) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Edit Emission Factor</h3>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-body">
          {/* General Section */}
          <div className="form-section">
            <h4 className="section-title">General Information</h4>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="modal-description">Description *</label>
                <input
                  type="text"
                  id="modal-description"
                  name="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  onFocus={() => handleFieldFocus('description')}
                  onBlur={() => handleFieldBlur('description')}
                  required
                  className={`form-input ${fieldErrors.description ? 'form-input-error' : ''}`}
                />
                {showTooltips.description && (
                  <div className="form-tooltip">
                    {getTooltipContent('description')}
                  </div>
                )}
                {fieldErrors.description && (
                  <div className="form-error-message">{fieldErrors.description}</div>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="modal-scope">Scope *</label>
                <select
                  id="modal-scope"
                  name="scope"
                  value={formData.scope}
                  onChange={(e) => handleInputChange('scope', e.target.value)}
                  onFocus={() => handleFieldFocus('scope')}
                  onBlur={() => handleFieldBlur('scope')}
                  required
                  className={`form-input ${fieldErrors.scope ? 'form-input-error' : ''}`}
                >
                  <option value="">Select scope</option>
                  {emissionFactorFields.find(f => f.key === 'scope')?.validation?.enumOptions?.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                {showTooltips.scope && (
                  <div className="form-tooltip">
                    {getTooltipContent('scope')}
                  </div>
                )}
                {fieldErrors.scope && (
                  <div className="form-error-message">{fieldErrors.scope}</div>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="modal-category">Category *</label>
                <input
                  type="text"
                  id="modal-category"
                  name="category"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  onFocus={() => handleFieldFocus('category')}
                  onBlur={() => handleFieldBlur('category')}
                  required
                  className={`form-input ${fieldErrors.category ? 'form-input-error' : ''}`}
                />
                {showTooltips.category && (
                  <div className="form-tooltip">
                    {getTooltipContent('category')}
                  </div>
                )}
                {fieldErrors.category && (
                  <div className="form-error-message">{fieldErrors.category}</div>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="modal-location">Country/Region/Location *</label>
                <input
                  type="text"
                  id="modal-location"
                  name="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  onFocus={() => handleFieldFocus('location')}
                  onBlur={() => handleFieldBlur('location')}
                  required
                  className={`form-input ${fieldErrors.location ? 'form-input-error' : ''}`}
                />
                {showTooltips.location && (
                  <div className="form-tooltip">
                    {getTooltipContent('location')}
                  </div>
                )}
                {fieldErrors.location && (
                  <div className="form-error-message">{fieldErrors.location}</div>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="modal-unit">Unit on Quantity *</label>
                <input
                  type="text"
                  id="modal-unit"
                  name="unit"
                  value={formData.unit}
                  onChange={(e) => handleInputChange('unit', e.target.value)}
                  onFocus={() => handleFieldFocus('unit')}
                  onBlur={() => handleFieldBlur('unit')}
                  required
                  className={`form-input ${fieldErrors.unit ? 'form-input-error' : ''}`}
                />
                {showTooltips.unit && (
                  <div className="form-tooltip">
                    {getTooltipContent('unit')}
                  </div>
                )}
                {fieldErrors.unit && (
                  <div className="form-error-message">{fieldErrors.unit}</div>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="modal-dataSource">Data Source/Collection Method *</label>
                <input
                  type="text"
                  id="modal-dataSource"
                  name="dataSource"
                  value={formData.dataSource}
                  onChange={(e) => handleInputChange('dataSource', e.target.value)}
                  onFocus={() => handleFieldFocus('dataSource')}
                  onBlur={() => handleFieldBlur('dataSource')}
                  required
                  className={`form-input ${fieldErrors.dataSource ? 'form-input-error' : ''}`}
                />
                {showTooltips.dataSource && (
                  <div className="form-tooltip">
                    {getTooltipContent('dataSource')}
                  </div>
                )}
                {fieldErrors.dataSource && (
                  <div className="form-error-message">{fieldErrors.dataSource}</div>
                )}
              </div>
            </div>
          </div>

          {/* Calculation Method Section */}
          <div className="form-section">
            <h4 className="section-title">Calculation Method</h4>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="modal-methodType">Method Type *</label>
                <select
                  id="modal-methodType"
                  name="methodType"
                  value={formData.methodType}
                  onChange={(e) => handleInputChange('methodType', e.target.value)}
                  onFocus={() => handleFieldFocus('methodType')}
                  onBlur={() => handleFieldBlur('methodType')}
                  required
                  className={`form-input ${fieldErrors.methodType ? 'form-input-error' : ''}`}
                >
                  {emissionFactorFields.find(f => f.key === 'methodType')?.validation?.enumOptions?.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                {showTooltips.methodType && (
                  <div className="form-tooltip">
                    {getTooltipContent('methodType')}
                  </div>
                )}
                {fieldErrors.methodType && (
                  <div className="form-error-message">{fieldErrors.methodType}</div>
                )}
              </div>
            </div>
          </div>

          {/* Emission Factor Section */}
          <div className="form-section">
            <h4 className="section-title">Emission Factor & Reference</h4>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="modal-co2ePerUnit">CO2e per Unit *</label>
                <input
                  type="number"
                  id="modal-co2ePerUnit"
                  name="co2ePerUnit"
                  value={formData.co2ePerUnit}
                  onChange={(e) => handleInputChange('co2ePerUnit', parseFloat(e.target.value) || 0)}
                  onFocus={() => handleFieldFocus('co2ePerUnit')}
                  onBlur={() => handleFieldBlur('co2ePerUnit')}
                  step="0.01"
                  min="0"
                  required
                  className={`form-input ${fieldErrors.co2ePerUnit ? 'form-input-error' : ''}`}
                />
                {showTooltips.co2ePerUnit && (
                  <div className="form-tooltip">
                    {getTooltipContent('co2ePerUnit')}
                  </div>
                )}
                {fieldErrors.co2ePerUnit && (
                  <div className="form-error-message">{fieldErrors.co2ePerUnit}</div>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="modal-emissionFactorUnit">Emission Factor Unit *</label>
                <input
                  type="text"
                  id="modal-emissionFactorUnit"
                  name="emissionFactorUnit"
                  value={formData.emissionFactorUnit}
                  onChange={(e) => handleInputChange('emissionFactorUnit', e.target.value)}
                  onFocus={() => handleFieldFocus('emissionFactorUnit')}
                  onBlur={() => handleFieldBlur('emissionFactorUnit')}
                  required
                  className={`form-input ${fieldErrors.emissionFactorUnit ? 'form-input-error' : ''}`}
                />
                {showTooltips.emissionFactorUnit && (
                  <div className="form-tooltip">
                    {getTooltipContent('emissionFactorUnit')}
                  </div>
                )}
                {fieldErrors.emissionFactorUnit && (
                  <div className="form-error-message">{fieldErrors.emissionFactorUnit}</div>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="modal-ghgReportingStandard">GHG Reporting Standard *</label>
                <select
                  id="modal-ghgReportingStandard"
                  name="ghgReportingStandard"
                  value={formData.ghgReportingStandard}
                  onChange={(e) => handleInputChange('ghgReportingStandard', e.target.value)}
                  onFocus={() => handleFieldFocus('ghgReportingStandard')}
                  onBlur={() => handleFieldBlur('ghgReportingStandard')}
                  required
                  className={`form-input ${fieldErrors.ghgReportingStandard ? 'form-input-error' : ''}`}
                >
                  <option value="">Select a standard</option>
                  {ghgStandards.map((standard) => (
                    <option key={standard} value={standard}>{standard}</option>
                  ))}
                </select>
                {showTooltips.ghgReportingStandard && (
                  <div className="form-tooltip">
                    {getTooltipContent('ghgReportingStandard')}
                  </div>
                )}
                {fieldErrors.ghgReportingStandard && (
                  <div className="form-error-message">{fieldErrors.ghgReportingStandard}</div>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="modal-sourceOrDisclosureRequirement">Source or Disclosure Requirement *</label>
                <input
                  type="text"
                  id="modal-sourceOrDisclosureRequirement"
                  name="sourceOrDisclosureRequirement"
                  value={formData.sourceOrDisclosureRequirement}
                  onChange={(e) => handleInputChange('sourceOrDisclosureRequirement', e.target.value)}
                  onFocus={() => handleFieldFocus('sourceOrDisclosureRequirement')}
                  onBlur={() => handleFieldBlur('sourceOrDisclosureRequirement')}
                  required
                  className={`form-input ${fieldErrors.sourceOrDisclosureRequirement ? 'form-input-error' : ''}`}
                  placeholder="Enter a weblink or remarks"
                />
                {showTooltips.sourceOrDisclosureRequirement && (
                  <div className="form-tooltip">
                    {getTooltipContent('sourceOrDisclosureRequirement')}
                  </div>
                )}
                {fieldErrors.sourceOrDisclosureRequirement && (
                  <div className="form-error-message">{fieldErrors.sourceOrDisclosureRequirement}</div>
                )}
              </div>
            </div>
          </div>
        </form>
        
        <div className="modal-actions">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary modal-btn"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="btn btn-primary modal-btn"
            disabled={isLoading}
          >
            {isLoading ? 'Updating...' : 'Update'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditEmissionFactorModal;
