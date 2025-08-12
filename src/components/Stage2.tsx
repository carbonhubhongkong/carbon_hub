'use client';

import React, { useState, useEffect } from 'react';
import * as toastModule from 'react-hot-toast';
const toast = toastModule.default || toastModule;

interface Stage2Props {
  onNext: () => void;
}

interface ReportingActivity {
  _id?: string;
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
  location: string;
  co2ePerUnit: number;
  emissionFactorUnit: string;
}

const Stage2: React.FC<Stage2Props> = ({ onNext }) => {
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

  const [activities, setActivities] = useState<ReportingActivity[]>([]);
  const [emissionFactors, setEmissionFactors] = useState<EmissionFactor[]>([]);
  const [filteredEmissionFactors, setFilteredEmissionFactors] = useState<EmissionFactor[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'fallback' | 'error'>('connected');

  // New state for dropdown options
  const [locationOptions, setLocationOptions] = useState<string[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);

  useEffect(() => {
    fetchActivities();
    fetchEmissionFactors();
  }, []);

  useEffect(() => {
    // Extract unique locations and categories from emission factors
    if (emissionFactors.length > 0) {
      const uniqueLocations = [...new Set(emissionFactors.map(f => f.location).filter(Boolean))].sort();
      const uniqueCategories = [...new Set(emissionFactors.map(f => f.category).filter(Boolean))].sort();
      
      setLocationOptions(uniqueLocations);
      setCategoryOptions(uniqueCategories);
    }
  }, [emissionFactors]);

  useEffect(() => {
    // Filter emission factors based on selected scope, location, and category
    let filtered = emissionFactors;
    
    if (formData.scope) {
      filtered = filtered.filter(factor => factor.scope === formData.scope);
    }
    
    if (formData.location) {
      filtered = filtered.filter(factor => factor.location === formData.location);
    }
    
    if (formData.category) {
      filtered = filtered.filter(factor => factor.category === formData.category);
    }
    
    setFilteredEmissionFactors(filtered);
    
    // Reset emission factor selection if current selection is not in filtered list
    if (!filtered.find(f => f._id === formData.emissionFactorId)) {
      setFormData(prev => ({ ...prev, emissionFactorId: '' }));
    }
  }, [formData.scope, formData.location, formData.category, formData.emissionFactorId, emissionFactors]);

  // Reset dependent fields when location or category changes
  useEffect(() => {
    if (formData.location && !locationOptions.includes(formData.location)) {
      setFormData(prev => ({ ...prev, location: '', emissionFactorId: '' }));
    }
  }, [locationOptions, formData.location]);

  useEffect(() => {
    if (formData.category && !categoryOptions.includes(formData.category)) {
      setFormData(prev => ({ ...prev, category: '', emissionFactorId: '' }));
    }
  }, [categoryOptions, formData.category]);

  const fetchActivities = async () => {
    try {
      setIsLoadingData(true);
      setConnectionStatus('connected');
      
      const response = await fetch('/api/reporting-activities');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      // Check if we're getting data from fallback storage (indicated by fallback_ prefixed IDs)
      const hasFallbackData = Array.isArray(data) && data.some(activity => 
        activity._id && activity._id.toString().startsWith('fallback_')
      );
      
      if (hasFallbackData) {
        setConnectionStatus('fallback');
        toast.success('Using local storage - MongoDB connection unavailable');
      }
      
      // Ensure data is always an array
      setActivities(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching activities:', error);
      setConnectionStatus('error');
      toast.error('Failed to fetch activities - using local storage');
      // Set empty array as fallback
      setActivities([]);
    } finally {
      setIsLoadingData(false);
    }
  };

  const fetchEmissionFactors = async () => {
    try {
      const response = await fetch('/api/emission-factors/factors');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      // Check if we're getting data from fallback storage
      const hasFallbackData = Array.isArray(data) && data.some(factor => 
        factor._id && factor._id.toString().startsWith('fallback_')
      );
      
      if (hasFallbackData) {
        toast.success('Using local storage for emission factors - MongoDB connection unavailable');
      }
      
      // Ensure data is always an array
      setEmissionFactors(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching emission factors:', error);
      toast.error('Failed to fetch emission factors - using local storage');
      // Set empty array as fallback
      setEmissionFactors([]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Reset dependent fields when location or category changes
    if (name === 'location' || name === 'category') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        emissionFactorId: '' // Reset emission factor when location or category changes
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'quantity' ? parseFloat(value) || 0 : value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = isEditing 
        ? `/api/reporting-activities/${editingId}`
        : '/api/reporting-activities';
      
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(isEditing ? 'Activity updated successfully!' : 'Activity saved successfully!');
        resetForm();
        fetchActivities();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save activity');
      }
    } catch (error) {
      console.error('Error saving activity:', error);
      toast.error('Failed to save activity');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (activity: ReportingActivity) => {
    setFormData(activity);
    setIsEditing(true);
    setEditingId(activity._id || null);
  };

  const resetForm = () => {
    setFormData({
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
    setIsEditing(false);
    setEditingId(null);
  };

  const getEmissionFactorDescription = (id: string) => {
    const factor = emissionFactors.find(f => f._id === id);
    return factor ? `${factor.description} (${factor.co2ePerUnit} ${factor.emissionFactorUnit})` : '';
  };

  return (
    <div className="stage">
      <h2 className="stage-title">Reporting Activity Data</h2>
      
      <form onSubmit={handleSubmit} className="activity-form">
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="reportingPeriodStart">Reporting Period Start Date *</label>
            <input
              type="date"
              id="reportingPeriodStart"
              name="reportingPeriodStart"
              value={formData.reportingPeriodStart}
              onChange={handleInputChange}
              required
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="reportingPeriodEnd">Reporting Period End Date *</label>
            <input
              type="date"
              id="reportingPeriodEnd"
              name="reportingPeriodEnd"
              value={formData.reportingPeriodEnd}
              onChange={handleInputChange}
              required
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="scope">Scope *</label>
            <select
              id="scope"
              name="scope"
              value={formData.scope}
              onChange={handleInputChange}
              required
              className="form-input"
            >
              <option value="">Select scope</option>
              <option value="Scope 1">Scope 1</option>
              <option value="Scope 2">Scope 2</option>
              <option value="Scope 3">Scope 3</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="category">Category *</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              required
              className="form-input"
            >
              <option value="">Select category</option>
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="activityName">Activity Name *</label>
            <input
              type="text"
              id="activityName"
              name="activityName"
              value={formData.activityName}
              onChange={handleInputChange}
              required
              className="form-input"
              placeholder="e.g., Office Electricity Consumption"
            />
          </div>
          <div className="form-group">
            <label htmlFor="location">Country/Region/Location *</label>
            <select
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              required
              className="form-input"
            >
              <option value="">Select location</option>
              {locationOptions.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="quantity">Quantity *</label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              value={formData.quantity}
              onChange={handleInputChange}
              step="0.01"
              required
              className="form-input"
              placeholder="e.g., 1000"
            />
          </div>
          <div className="form-group">
            <label htmlFor="emissionFactorId">Emission Factor *</label>
            <select
              id="emissionFactorId"
              name="emissionFactorId"
              value={formData.emissionFactorId}
              onChange={handleInputChange}
              required
              className="form-input"
              disabled={!formData.scope || !formData.location || !formData.category}
            >
              <option value="">Select an emission factor</option>
              {filteredEmissionFactors.map((factor) => (
                <option key={factor._id} value={factor._id}>
                  {factor.description} ({factor.co2ePerUnit} {factor.emissionFactorUnit})
                </option>
              ))}
            </select>
            {(!formData.scope || !formData.location || !formData.category) && (
              <small className="form-help">
                Please select scope, location, and category first to see available emission factors
              </small>
            )}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="remarks">Remarks</label>
          <textarea
            id="remarks"
            name="remarks"
            value={formData.remarks}
            onChange={handleInputChange}
            className="form-input"
            rows={3}
            placeholder="Additional notes or comments..."
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? 'Saving...' : (isEditing ? 'Update' : 'Save')}
          </button>
          {isEditing && (
            <button type="button" onClick={resetForm} className="btn btn-secondary">
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Data Table */}
      <div className="data-section">
        <h3 className="section-title">
          Saved Activities
          {connectionStatus === 'fallback' && (
            <span className="connection-status fallback">
              📱 Using Local Storage
            </span>
          )}
          {connectionStatus === 'error' && (
            <span className="connection-status error">
              ⚠️ Connection Error
            </span>
          )}
        </h3>
        
        {isLoadingData ? (
          <div className="loading-state">
            <p>Loading activities...</p>
          </div>
        ) : (
          <div className="table-container">
            {Array.isArray(activities) && activities.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Activity Name</th>
                    <th>Period</th>
                    <th>Scope</th>
                    <th>Category</th>
                    <th>Country/Region/Location</th>
                    <th>Quantity</th>
                    <th>Emission Factor</th>
                    <th>Calculated Emissions</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((activity) => (
                    <tr key={activity._id}>
                      <td>{activity.activityName}</td>
                      <td>{activity.reportingPeriodStart} to {activity.reportingPeriodEnd}</td>
                      <td>{activity.scope}</td>
                      <td>{activity.category}</td>
                      <td>{activity.location}</td>
                      <td>{activity.quantity}</td>
                      <td>{getEmissionFactorDescription(activity.emissionFactorId)}</td>
                      <td>
                        {activity.calculatedEmissions 
                          ? `${activity.calculatedEmissions.toFixed(2)} kg CO2e`
                          : 'N/A'
                        }
                      </td>
                      <td>
                        <button
                          onClick={() => handleEdit(activity)}
                          className="btn btn-small btn-secondary"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="no-data">
                <p>No activities added yet. Add your first activity above.</p>
                {connectionStatus === 'fallback' && (
                  <p className="fallback-note">
                    <small>Note: Data is stored locally. MongoDB connection is unavailable.</small>
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="stage-actions">
        <button onClick={onNext} className="btn btn-primary">
          Next: Report
        </button>
      </div>
    </div>
  );
};

export default Stage2; 