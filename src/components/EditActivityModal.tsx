'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import indexedDBService from '@/lib/indexedDB';
import type { ReportingActivity, EmissionFactor } from '@/lib/indexedDB';

interface EditActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: ReportingActivity | null;
  onUpdate: (updatedActivity: ReportingActivity) => Promise<void>;
  emissionFactors: EmissionFactor[];
}

const EditActivityModal: React.FC<EditActivityModalProps> = ({
  isOpen,
  onClose,
  activity,
  onUpdate,
  emissionFactors,
}) => {
  const [formData, setFormData] = useState<ReportingActivity>({
    reportingPeriodStart: '',
    reportingPeriodEnd: '',
    scope: '',
    category: '',
    activityName: '',
    location: '',
    quantity: 0,
    emissionFactorId: '',
    remarks: ''
  });
  const [filteredEmissionFactors, setFilteredEmissionFactors] = useState<EmissionFactor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Initialize form data when activity changes
  useEffect(() => {
    if (activity) {
      console.log('EditActivityModal: Initializing form with activity:', activity);
      console.log('EditActivityModal: Activity emissionFactorId:', activity.emissionFactorId, 'type:', typeof activity.emissionFactorId);
      console.log('EditActivityModal: Available emission factors:', emissionFactors);
      
      setFormData(activity);
      updateFilteredEmissionFactors(activity.scope, activity.location, activity.category);
      setFieldErrors({}); // Clear errors when opening modal
      
      // Verify the emission factor exists
      if (activity.emissionFactorId) {
        const factor = emissionFactors.find(f => String(f._id) === String(activity.emissionFactorId));
        console.log('EditActivityModal: Found emission factor for activity:', factor);
        if (!factor) {
          console.warn('EditActivityModal: WARNING - Activity has emission factor ID that does not exist:', activity.emissionFactorId);
        }
      }
    }
  }, [activity, emissionFactors]);

  // Update filtered emission factors when filter criteria change
  useEffect(() => {
    updateFilteredEmissionFactors(formData.scope, formData.location, formData.category);
  }, [formData.scope, formData.location, formData.category, emissionFactors]);

  const updateFilteredEmissionFactors = (scope: string, location: string, category: string) => {
    console.log('EditActivityModal: updateFilteredEmissionFactors called with:', { scope, location, category });
    console.log('EditActivityModal: Total emission factors available:', emissionFactors.length);
    
    let filtered = emissionFactors;
    
    if (scope) {
      filtered = filtered.filter(factor => factor.scope === scope);
      console.log('EditActivityModal: After scope filter:', filtered.length);
    }
    
    if (location) {
      filtered = filtered.filter(factor => factor.location === location);
      console.log('EditActivityModal: After location filter:', filtered.length);
    }
    
    if (category) {
      filtered = filtered.filter(factor => factor.category === category);
      console.log('EditActivityModal: After category filter:', filtered.length);
    }
    
    console.log('EditActivityModal: Final filtered emission factors:', filtered);
    setFilteredEmissionFactors(filtered);
    
    // Only reset emission factor if we have a selection and it's not in the filtered list
    // AND if we have all three filter criteria selected
    if (formData.emissionFactorId && 
        scope && 
        location && 
        category && 
        !filtered.find(f => String(f._id) === String(formData.emissionFactorId))) {
      console.log('EditActivityModal: Resetting emission factor because it\'s not in filtered list');
      setFormData(prev => ({ ...prev, emissionFactorId: '' }));
    }
  };

  // Real-time validation
  const validateField = (name: string, value: any): string => {
    switch (name) {
      case 'reportingPeriodStart':
        if (!value || value.trim() === '') {
          return 'Start date is required';
        }
        return '';
      case 'reportingPeriodEnd':
        if (!value || value.trim() === '') {
          return 'End date is required';
        }
        if (formData.reportingPeriodStart && new Date(value) <= new Date(formData.reportingPeriodStart)) {
          return 'End date must be after start date';
        }
        return '';
      case 'scope':
        if (!value || value.trim() === '') {
          return 'Scope is required';
        }
        return '';
      case 'category':
        if (!value || value.trim() === '') {
          return 'Category is required';
        }
        return '';
      case 'activityName':
        if (!value || value.trim() === '') {
          return 'Activity name is required';
        }
        return '';
      case 'location':
        if (!value || value.trim() === '') {
          return 'Location is required';
        }
        return '';
      case 'quantity':
        if (value === undefined || value === null || value === '' || isNaN(Number(value)) || Number(value) <= 0) {
          return 'Quantity must be a positive number';
        }
        return '';
      case 'emissionFactorId':
        if (!value || value.trim() === '') {
          return 'Emission factor is required';
        }
        return '';
      default:
        return '';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    console.log(`EditActivityModal: Input change - name: ${name}, value: ${value}, type: ${typeof value}`);
    
    // Reset dependent fields when location or category changes
    if (name === 'location' || name === 'category') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        emissionFactorId: '' // Reset emission factor when location or category changes
      }));
    } else if (name === 'emissionFactorId') {
      // Handle emission factor selection specifically
      console.log(`EditActivityModal: Selected emission factor ID: ${value}`);
      console.log(`EditActivityModal: Available emission factors:`, emissionFactors);
      console.log(`EditActivityModal: Filtered emission factors:`, filteredEmissionFactors);
      
      // Ensure consistent ID type handling - convert to string for form storage
      const processedValue = value === '' ? '' : String(value);
      console.log(`EditActivityModal: Processed emission factor ID: ${processedValue}`);
      
      // Verify the selected emission factor exists using string comparison
      const selectedFactor = emissionFactors.find(f => String(f._id) === processedValue);
      console.log(`EditActivityModal: Selected factor found:`, selectedFactor);
      
      if (!selectedFactor && processedValue !== '') {
        console.error(`EditActivityModal: ERROR - Emission factor with ID ${processedValue} not found!`);
        console.error(`EditActivityModal: Available IDs:`, emissionFactors.map(f => ({ id: f._id, type: typeof f._id })));
        console.error(`EditActivityModal: Looking for string ID: ${processedValue}`);
      }
      
      setFormData(prev => ({
        ...prev,
        emissionFactorId: processedValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'quantity' ? parseFloat(value) || 0 : value
      }));
    }

    // Clear error for this field when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFieldBlur = (fieldName: string) => {
    const value = formData[fieldName as keyof ReportingActivity];
    const error = validateField(fieldName, value);
    setFieldErrors(prev => ({
      ...prev,
      [fieldName]: error
    }));
  };

  const validateAllFields = (): boolean => {
    const errors: Record<string, string> = {};
    
    // Validate all required fields
    const requiredFields: (keyof ReportingActivity)[] = [
      'reportingPeriodStart', 'reportingPeriodEnd', 'scope', 'category', 
      'activityName', 'location', 'quantity', 'emissionFactorId'
    ];
    
    console.log('Validating fields with form data:', formData);
    
    requiredFields.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) {
        errors[field] = error;
        console.log(`Field ${field} has error:`, error);
      }
    });

    // Additional validation: ensure emission factor exists
    if (formData.emissionFactorId && !errors.emissionFactorId) {
      const factor = emissionFactors.find(f => String(f._id) === String(formData.emissionFactorId));
      if (!factor) {
        errors.emissionFactorId = 'Selected emission factor not found. Please select a valid emission factor.';
        console.error('EditActivityModal: Validation error - emission factor not found:', formData.emissionFactorId);
      }
    }

    console.log('Validation errors:', errors);
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields first
    if (!validateAllFields()) {
      toast.error('Please correct the errors before updating');
      return;
    }

    setIsLoading(true);
    try {
      console.log('EditActivityModal: Submitting updated activity:', formData);
      console.log('EditActivityModal: Activity ID being updated:', formData._id);
      console.log('EditActivityModal: Activity ID type:', typeof formData._id);
      console.log('EditActivityModal: Emission factor ID:', formData.emissionFactorId);
      console.log('EditActivityModal: Emission factor ID type:', typeof formData.emissionFactorId);
      console.log('EditActivityModal: Quantity:', formData.quantity);
      
      // Verify the emission factor exists before proceeding using string comparison
      const factor = emissionFactors.find(f => String(f._id) === String(formData.emissionFactorId));
      console.log('EditActivityModal: Found emission factor for calculation:', factor);
      
      if (!factor) {
        console.error('EditActivityModal: ERROR - Selected emission factor not found!');
        console.error('EditActivityModal: Selected ID:', formData.emissionFactorId);
        console.error('EditActivityModal: Available emission factors:', emissionFactors);
        console.error('EditActivityModal: Looking for string ID:', String(formData.emissionFactorId));
        toast.error(`Selected emission factor not found. Please select a valid emission factor.`);
        return;
      }
      
      // Store emission factor data directly instead of just the ID
      const emissionFactorData = {
        description: factor.description,
        co2ePerUnit: factor.co2ePerUnit,
        emissionFactorUnit: factor.emissionFactorUnit,
        unit: factor.unit
      };
      
      const calculatedEmissions = formData.quantity * factor.co2ePerUnit;
      console.log('EditActivityModal: Calculated emissions:', calculatedEmissions);
      
      // Update the form data with emission factor data
      const updatedFormData = {
        ...formData,
        calculatedEmissions,
        emissionFactorData
      };
      
      // Update activity in IndexedDB
      await indexedDBService.updateReportingActivity(updatedFormData);
      console.log('EditActivityModal: Activity updated successfully');
      
      // Call the onUpdate callback to refresh parent component
      await onUpdate(updatedFormData);
      
      // Add a small delay to ensure the update is processed
      setTimeout(() => {
        onClose();
        toast.success('Activity updated successfully!');
      }, 100);
    } catch (error) {
      console.error('EditActivityModal: Error updating activity:', error);
      // Don't close modal on error, let user see the error and try again
      toast.error(error instanceof Error ? error.message : 'Failed to update activity');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !activity) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Edit Reporting Activity</h3>
        </div>
        
        {/* Debug Information */}
        <div style={{ 
          background: '#f0f8ff', 
          padding: '10px', 
          margin: '10px', 
          borderRadius: '4px',
          fontSize: '11px',
          fontFamily: 'monospace',
          border: '1px solid #ccc'
        }}>
          <strong>Debug - Current Form Data:</strong><br/>
          Emission Factor ID: {formData.emissionFactorId} (type: {typeof formData.emissionFactorId})<br/>
          Scope: {formData.scope}<br/>
          Category: {formData.category}<br/>
          Location: {formData.location}<br/>
          Quantity: {formData.quantity}<br/>
          Available Emission Factors: {emissionFactors.length}<br/>
          Filtered Emission Factors: {filteredEmissionFactors.length}<br/>
          {filteredEmissionFactors.length > 0 && (
            <>
              First Filtered Factor ID: {filteredEmissionFactors[0]?._id} (type: {typeof filteredEmissionFactors[0]?._id})<br/>
            </>
          )}
          <br/>
          <button 
            onClick={() => {
              console.log('EditActivityModal: Manual verification clicked');
              console.log('EditActivityModal: Current form data:', formData);
              console.log('EditActivityModal: All emission factors:', emissionFactors);
              console.log('EditActivityModal: Filtered emission factors:', filteredEmissionFactors);
              console.log('EditActivityModal: Selected emission factor ID:', formData.emissionFactorId);
              const selectedFactor = emissionFactors.find(f => String(f._id) === String(formData.emissionFactorId));
              console.log('EditActivityModal: Selected factor found:', selectedFactor);
            }}
            className="btn btn-secondary"
            style={{ fontSize: '10px', padding: '4px 8px', marginRight: '5px' }}
          >
            Verify Selection
          </button>
          <button 
            onClick={() => {
              console.log('EditActivityModal: Available emission factors for current selection:');
              console.log('EditActivityModal: Scope:', formData.scope);
              console.log('EditActivityModal: Category:', formData.category);
              console.log('EditActivityModal: Location:', formData.location);
              
              const available = emissionFactors.filter(f => 
                f.scope === formData.scope && 
                f.category === formData.category && 
                f.location === formData.location
              );
              
              console.log('EditActivityModal: Available factors:', available);
              
              if (available.length === 0) {
                toast.error(`No emission factors found for Scope: ${formData.scope}, Category: ${formData.category}, Location: ${formData.location}`);
              } else {
                const factorList = available.map(f => `${f.description} (ID: ${f._id})`).join('\n');
                toast.success(`Found ${available.length} emission factors:\n${factorList}`, { duration: 5000 });
              }
            }}
            className="btn btn-secondary"
            style={{ fontSize: '10px', padding: '4px 8px', marginRight: '5px' }}
          >
            Show Available EF
          </button>
          <button 
            onClick={() => {
              if (filteredEmissionFactors.length > 0) {
                const firstFactor = filteredEmissionFactors[0];
                console.log('EditActivityModal: Setting emission factor to first available:', firstFactor);
                setFormData(prev => ({
                  ...prev,
                  emissionFactorId: String(firstFactor._id)
                }));
                toast.success(`Set emission factor to: ${firstFactor.description} (ID: ${firstFactor._id})`);
              } else {
                toast.error('No emission factors available for current selection');
              }
            }}
            className="btn btn-primary"
            style={{ fontSize: '10px', padding: '4px 8px' }}
          >
            Set First EF
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-section">
            <h4 className="section-title">Activity Information</h4>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="modal-activityName">Activity Name *</label>
                <input
                  type="text"
                  id="modal-activityName"
                  name="activityName"
                  value={formData.activityName}
                  onChange={handleInputChange}
                  onBlur={() => handleFieldBlur('activityName')}
                  required
                  className={`form-input ${fieldErrors.activityName ? 'form-input-error' : ''}`}
                  placeholder="e.g., Office Electricity Consumption"
                />
                {fieldErrors.activityName && (
                  <div className="form-error-message">{fieldErrors.activityName}</div>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="modal-reportingPeriodStart">Reporting Period Start Date *</label>
                <input
                  type="date"
                  id="modal-reportingPeriodStart"
                  name="reportingPeriodStart"
                  value={formData.reportingPeriodStart}
                  onChange={handleInputChange}
                  onBlur={() => handleFieldBlur('reportingPeriodStart')}
                  required
                  className={`form-input ${fieldErrors.reportingPeriodStart ? 'form-input-error' : ''}`}
                />
                {fieldErrors.reportingPeriodStart && (
                  <div className="form-error-message">{fieldErrors.reportingPeriodStart}</div>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="modal-reportingPeriodEnd">Reporting Period End Date *</label>
                <input
                  type="date"
                  id="modal-reportingPeriodEnd"
                  name="reportingPeriodEnd"
                  value={formData.reportingPeriodEnd}
                  onChange={handleInputChange}
                  onBlur={() => handleFieldBlur('reportingPeriodEnd')}
                  required
                  className={`form-input ${fieldErrors.reportingPeriodEnd ? 'form-input-error' : ''}`}
                />
                {fieldErrors.reportingPeriodEnd && (
                  <div className="form-error-message">{fieldErrors.reportingPeriodEnd}</div>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="modal-scope">Scope *</label>
                <select
                  id="modal-scope"
                  name="scope"
                  value={formData.scope}
                  onChange={handleInputChange}
                  onBlur={() => handleFieldBlur('scope')}
                  required
                  className={`form-input ${fieldErrors.scope ? 'form-input-error' : ''}`}
                >
                  <option value="">Select scope</option>
                  <option value="Scope 1">Scope 1</option>
                  <option value="Scope 2">Scope 2</option>
                  <option value="Scope 3">Scope 3</option>
                </select>
                {fieldErrors.scope && (
                  <div className="form-error-message">{fieldErrors.scope}</div>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="modal-category">Category *</label>
                <select
                  id="modal-category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  onBlur={() => handleFieldBlur('category')}
                  required
                  className={`form-input ${fieldErrors.category ? 'form-input-error' : ''}`}
                >
                  <option value="">Select category</option>
                  {Array.from(new Set(emissionFactors.map(f => f.category).filter(Boolean))).sort().map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                {fieldErrors.category && (
                  <div className="form-error-message">{fieldErrors.category}</div>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="modal-location">Country/Region/Location *</label>
                <select
                  id="modal-location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  onBlur={() => handleFieldBlur('location')}
                  required
                  className={`form-input ${fieldErrors.location ? 'form-input-error' : ''}`}
                >
                  <option value="">Select location</option>
                  {Array.from(new Set(emissionFactors.map(f => f.location).filter(Boolean))).sort().map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
                {fieldErrors.location && (
                  <div className="form-error-message">{fieldErrors.location}</div>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="modal-quantity">Quantity *</label>
                <input
                  type="number"
                  id="modal-quantity"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  onBlur={() => handleFieldBlur('quantity')}
                  step="0.01"
                  required
                  className={`form-input ${fieldErrors.quantity ? 'form-input-error' : ''}`}
                  placeholder="e.g., 1000"
                />
                {fieldErrors.quantity && (
                  <div className="form-error-message">{fieldErrors.quantity}</div>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="modal-emissionFactorId">Emission Factor *</label>
                <select
                  id="modal-emissionFactorId"
                  name="emissionFactorId"
                  value={formData.emissionFactorId}
                  onChange={handleInputChange}
                  onBlur={() => handleFieldBlur('emissionFactorId')}
                  required
                  className={`form-input ${fieldErrors.emissionFactorId ? 'form-input-error' : ''}`}
                  disabled={!formData.scope || !formData.location || !formData.category}
                >
                  <option value="">Select an emission factor</option>
                  {filteredEmissionFactors.map((factor) => {
                    const isSelected = String(factor._id) === String(formData.emissionFactorId);
                    console.log(`EditActivityModal: Rendering option for factor:`, factor);
                    console.log(`EditActivityModal: Factor ID: ${factor._id}, type: ${typeof factor._id}`);
                    console.log(`EditActivityModal: Form emissionFactorId: ${formData.emissionFactorId}, type: ${typeof formData.emissionFactorId}`);
                    console.log(`EditActivityModal: Is selected: ${isSelected}`);
                    return (
                      <option key={factor._id} value={factor._id}>
                        {factor.description} ({factor.co2ePerUnit} {factor.emissionFactorUnit})
                      </option>
                    );
                  })}
                </select>
                {(!formData.scope || !formData.location || !formData.category) && (
                  <small className="form-help">
                    Please select scope, location, and category first to see available emission factors
                  </small>
                )}
                {fieldErrors.emissionFactorId && (
                  <div className="form-error-message">{fieldErrors.emissionFactorId}</div>
                )}
                {formData.emissionFactorId && (
                  <small className="form-help">
                    Selected: {(() => {
                      const factor = emissionFactors.find(f => String(f._id) === String(formData.emissionFactorId));
                      return factor ? `${factor.description} (ID: ${factor._id})` : 'Emission factor not found';
                    })()}
                  </small>
                )}
              </div>
            </div>
          </div>

          <div className="form-section">
            <h4 className="section-title">Additional Information</h4>
            <div className="form-group">
              <label htmlFor="modal-remarks">Remarks</label>
              <textarea
                id="modal-remarks"
                name="remarks"
                value={formData.remarks || ''}
                onChange={handleInputChange}
                className="form-input"
                rows={3}
                placeholder="Additional notes or comments..."
              />
            </div>
          </div>
          
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
              className="btn btn-primary modal-btn"
              disabled={isLoading}
            >
              {isLoading ? 'Updating...' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditActivityModal;
