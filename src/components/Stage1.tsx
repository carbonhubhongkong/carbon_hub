'use client';

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface Stage1Props {
  onNext: () => void;
}

interface EmissionFactorData {
  _id?: string;
  // General fields
  description: string;
  scope: string;
  category: string;
  location: string;
  unit: string;
  dataSource: string;
  // Calculation method
  methodType: 'Volume Based' | 'Spend Based';
  // Emission factor fields
  co2ePerUnit: number;
  emissionFactorUnit: string;
}

const Stage1: React.FC<Stage1Props> = ({ onNext }) => {
  const [formData, setFormData] = useState<EmissionFactorData>({
    description: '',
    scope: '',
    category: '',
    location: '',
    unit: '',
    dataSource: '',
    methodType: 'Volume Based',
    co2ePerUnit: 0,
    emissionFactorUnit: ''
  });

  const [emissionFactors, setEmissionFactors] = useState<EmissionFactorData[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchEmissionFactors();
  }, []);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'co2ePerUnit' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = isEditing 
        ? `/api/emission-factors/general/${editingId}`
        : '/api/emission-factors/general';
      
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(isEditing ? 'Emission factor updated successfully!' : 'Emission factor saved successfully!');
        resetForm();
        fetchEmissionFactors();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save emission factor');
      }
    } catch (error) {
      console.error('Error saving emission factor:', error);
      toast.error('Failed to save emission factor');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (factor: EmissionFactorData) => {
    setFormData(factor);
    setIsEditing(true);
    setEditingId(factor._id || null);
  };

  const resetForm = () => {
    setFormData({
      description: '',
      scope: '',
      category: '',
      location: '',
      unit: '',
      dataSource: '',
      methodType: 'Volume Based',
      co2ePerUnit: 0,
      emissionFactorUnit: ''
    });
    setIsEditing(false);
    setEditingId(null);
  };

  return (
    <div className="stage">
      <h2 className="stage-title">Input Emission Factors</h2>
      
      <form onSubmit={handleSubmit} className="emission-form">
        {/* General Section */}
        <div className="form-section">
          <h3 className="section-title">General Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <input
                type="text"
                id="description"
                name="description"
                value={formData.description}
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
              />
            </div>
            <div className="form-group">
              <label htmlFor="location">Country/Region/Location *</label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                required
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="unit">Unit on Quantity *</label>
              <input
                type="text"
                id="unit"
                name="unit"
                value={formData.unit}
                onChange={handleInputChange}
                required
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="dataSource">Data Source/Collection Method *</label>
              <input
                type="text"
                id="dataSource"
                name="dataSource"
                value={formData.dataSource}
                onChange={handleInputChange}
                required
                className="form-input"
              />
            </div>
          </div>
        </div>

        {/* Calculation Methods Section */}
        <div className="form-section">
          <h3 className="section-title">Calculation Methods</h3>
          <div className="form-group">
            <label htmlFor="methodType">Method Type *</label>
            <select
              id="methodType"
              name="methodType"
              value={formData.methodType}
              onChange={handleInputChange}
              required
              className="form-input"
            >
              <option value="Volume Based">Volume Based</option>
              <option value="Spend Based">Spend Based</option>
            </select>
          </div>
        </div>

        {/* Emission Factors Section */}
        <div className="form-section">
          <h3 className="section-title">Emission Factors</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="co2ePerUnit">CO2e per Unit *</label>
              <input
                type="number"
                id="co2ePerUnit"
                name="co2ePerUnit"
                value={formData.co2ePerUnit}
                onChange={handleInputChange}
                step="0.01"
                required
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="emissionFactorUnit">Emission Factor Unit *</label>
              <input
                type="text"
                id="emissionFactorUnit"
                name="emissionFactorUnit"
                value={formData.emissionFactorUnit}
                onChange={handleInputChange}
                required
                className="form-input"
              />
            </div>
          </div>
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
        <h3 className="section-title">Saved Emission Factors</h3>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Scope</th>
                <th>Category</th>
                <th>Location</th>
                <th>Method</th>
                <th>CO2e/Unit</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {emissionFactors.map((factor) => (
                <tr key={factor._id}>
                  <td>{factor.description}</td>
                  <td>{factor.scope}</td>
                  <td>{factor.category}</td>
                  <td>{factor.location}</td>
                  <td>{factor.methodType}</td>
                  <td>{factor.co2ePerUnit} {factor.emissionFactorUnit}</td>
                  <td>
                    <button
                      onClick={() => handleEdit(factor)}
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
          Next: Reporting Activity Data
        </button>
      </div>
    </div>
  );
};

export default Stage1; 