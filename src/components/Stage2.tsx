'use client';

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

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

  useEffect(() => {
    fetchActivities();
    fetchEmissionFactors();
  }, []);

  useEffect(() => {
    // Filter emission factors based on selected scope
    if (formData.scope) {
      const filtered = emissionFactors.filter(factor => factor.scope === formData.scope);
      setFilteredEmissionFactors(filtered);
      // Reset emission factor selection if current selection is not in filtered list
      if (!filtered.find(f => f._id === formData.emissionFactorId)) {
        setFormData(prev => ({ ...prev, emissionFactorId: '' }));
      }
    } else {
      setFilteredEmissionFactors([]);
      setFormData(prev => ({ ...prev, emissionFactorId: '' }));
    }
  }, [formData.scope, emissionFactors]);

  const fetchActivities = async () => {
    try {
      const response = await fetch('/api/reporting-activities');
      const data = await response.json();
      setActivities(data);
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast.error('Failed to fetch activities');
    }
  };

  const fetchEmissionFactors = async () => {
    try {
      const response = await fetch('/api/emission-factors/general');
      const data = await response.json();
      setEmissionFactors(data);
    } catch (error) {
      console.error('Error fetching emission factors:', error);
      toast.error('Failed to fetch emission factors');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' ? parseFloat(value) || 0 : value
    }));
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
            <input
              type="text"
              id="scope"
              name="scope"
              value={formData.scope}
              onChange={handleInputChange}
              required
              className="form-input"
              placeholder="e.g., Scope 1, Scope 2, Scope 3"
            />
          </div>
          <div className="form-group">
            <label htmlFor="category">Category *</label>
            <input
              type="text"
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              required
              className="form-input"
              placeholder="e.g., Energy, Transport, Waste"
            />
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
            <label htmlFor="location">Location *</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              required
              className="form-input"
              placeholder="e.g., New York Office"
            />
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
              disabled={!formData.scope}
            >
              <option value="">Select an emission factor</option>
              {filteredEmissionFactors.map((factor) => (
                <option key={factor._id} value={factor._id}>
                  {factor.description} ({factor.co2ePerUnit} {factor.emissionFactorUnit})
                </option>
              ))}
            </select>
            {!formData.scope && (
              <small className="form-help">Please select a scope first to see available emission factors</small>
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
        <h3 className="section-title">Saved Activities</h3>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Activity Name</th>
                <th>Period</th>
                <th>Scope</th>
                <th>Category</th>
                <th>Location</th>
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
                  <td>{activity.calculatedEmissions?.toFixed(2)} kg CO2e</td>
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
        </div>
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