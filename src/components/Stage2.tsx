'use client';

import React, { useState, useEffect } from 'react';
import * as toastModule from 'react-hot-toast';
import { useTranslations } from 'next-intl';
import EditActivityModal from './EditActivityModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import { FaEdit, FaTrash } from 'react-icons/fa';
import indexedDBService from '@/lib/indexedDB';
import type { ReportingActivity, EmissionFactor } from '@/lib/indexedDB';
const toast = toastModule.default || toastModule;

interface Stage2Props {
  onNext: () => void;
}

// Using types from IndexedDB service

const Stage2: React.FC<Stage2Props> = ({ onNext }) => {
  const t = useTranslations();
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
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'fallback' | 'error'>('connected');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ReportingActivity | null>(null);

  // Delete functionality state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingActivity, setDeletingActivity] = useState<ReportingActivity | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // New state for dropdown options
  const [locationOptions, setLocationOptions] = useState<string[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingData(true);
        
        // Load emission factors first
        const factors = await indexedDBService.getAllEmissionFactors();
        setEmissionFactors(Array.isArray(factors) ? factors : []);
        
        // Then load activities
        const activitiesData = await indexedDBService.getAllReportingActivities();
        const activitiesArray = Array.isArray(activitiesData) ? activitiesData : [];
        setActivities(activitiesArray);
        
        setConnectionStatus('connected');
      } catch (error) {
        console.error('Error loading data:', error);
        setConnectionStatus('error');
        toast.error(t('stage2.toast.loadDataFailed'));
        setEmissionFactors([]);
        setActivities([]);
      } finally {
        setIsLoadingData(false);
      }
    };
    
    loadData();
  }, []);

  // Recalculate emissions for existing activities when emission factors are loaded
  useEffect(() => {
    if (emissionFactors.length > 0 && activities.length > 0) {
      const updatedActivities = activities.map(activity => {
        if (activity.calculatedEmissions === undefined || activity.calculatedEmissions === null) {
          const factor = emissionFactors.find(f => String(f._id) === String(activity.emissionFactorId));
          
          if (factor && activity.quantity) {
            const calculatedEmissions = activity.quantity * factor.co2ePerUnit;
            return {
              ...activity,
              calculatedEmissions
            };
          }
        }
        return activity;
      });
      
      // Only update if there are changes
      if (JSON.stringify(updatedActivities) !== JSON.stringify(activities)) {
        setActivities(updatedActivities);
        
        // Update activities in IndexedDB with calculated emissions
        updatedActivities.forEach(async (activity) => {
          if (activity.calculatedEmissions !== undefined && activity.calculatedEmissions !== null) {
            try {
              await indexedDBService.updateReportingActivity(activity);
            } catch (error) {
              console.error('Failed to update calculated emissions for activity:', activity._id, error);
            }
          }
        });
      }
    }
  }, [emissionFactors, activities.length]);

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
    
    // Only reset emission factor if we have a selection and it's not in the filtered list
    // AND if we have all three filter criteria selected
    if (formData.emissionFactorId && 
        formData.scope && 
        formData.location && 
        formData.category && 
        !filtered.find(f => String(f._id) === String(formData.emissionFactorId))) {
      setFormData(prev => ({ ...prev, emissionFactorId: '' }));
    }
  }, [formData.scope, formData.location, formData.category, emissionFactors]);

  // Reset dependent fields when location or category options change
  useEffect(() => {
    if (formData.location && !locationOptions.includes(formData.location)) {
      setFormData(prev => ({ ...prev, location: '', emissionFactorId: '' }));
    }
  }, [locationOptions]);

  useEffect(() => {
    if (formData.category && !categoryOptions.includes(formData.category)) {
      setFormData(prev => ({ ...prev, category: '', emissionFactorId: '' }));
    }
  }, [categoryOptions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Reset dependent fields when location or category changes
    if (name === 'location' || name === 'category') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        emissionFactorId: '' // Reset emission factor when location or category changes
      }));
    } else if (name === 'emissionFactorId') {
      // Handle emission factor selection specifically
      setFormData(prev => ({
        ...prev,
        emissionFactorId: value
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
      // Validate emission factor selection
      if (!formData.emissionFactorId) {
        toast.error(t('stage2.validation.emissionFactorRequired'));
        return;
      }
      
      // Find the emission factor - handle both string and number ID types
      let factor = null;
      
      // Convert the selected ID to string for consistent comparison
      const selectedIdStr = String(formData.emissionFactorId);
      
      // Try to find the factor by converting all IDs to strings for comparison
      factor = emissionFactors.find(f => String(f._id) === selectedIdStr);
      
      if (!factor) {
        toast.error(t('stage2.validation.emissionFactorNotFound'));
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
      
      const activityToSave = { 
        ...formData, 
        calculatedEmissions,
        emissionFactorData // Store the actual data, not just the ID
      };
      
      const newId = await indexedDBService.addReportingActivity(activityToSave);
      
      toast.success(t('stage2.toast.savedSuccessfully'));
      resetForm();
      await refreshData();
    } catch (error) {
      console.error('Error saving activity:', error);
      toast.error(t('stage2.toast.saveFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (activity: ReportingActivity) => {
    setEditingActivity(activity);
    setIsEditModalOpen(true);
  };

  const handleDelete = (activity: ReportingActivity) => {
    setDeletingActivity(activity);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingActivity || !deletingActivity._id) return;

    setIsDeleting(true);
    try {
      await indexedDBService.deleteReportingActivity(deletingActivity._id);
      toast.success(t('stage2.toast.deletedSuccessfully'));
      setShowDeleteModal(false);
      setDeletingActivity(null);
      await refreshData();
    } catch (error) {
      console.error('Error deleting activity:', error);
      toast.error(t('stage2.toast.deleteFailed'));
    } finally {
      setIsDeleting(false);
    }
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
  };

  const handleUpdateActivity = async (updatedActivity: ReportingActivity) => {
    try {
      if (!updatedActivity._id) {
        throw new Error('Activity ID is missing');
      }

      // If we already have emission factor data, use it
      if (updatedActivity.emissionFactorData) {
        const calculatedEmissions = updatedActivity.quantity * updatedActivity.emissionFactorData.co2ePerUnit;
        const activityToUpdate = { ...updatedActivity, calculatedEmissions };
        await indexedDBService.updateReportingActivity(activityToUpdate);
      } else {
        // Fallback to looking up emission factor by ID using string comparison
        const factor = emissionFactors.find(f => String(f._id) === String(updatedActivity.emissionFactorId));
        const calculatedEmissions = factor ? updatedActivity.quantity * factor.co2ePerUnit : 0;
        
        const activityToUpdate = { ...updatedActivity, calculatedEmissions };
        await indexedDBService.updateReportingActivity(activityToUpdate);
      }
      
      // Refresh the data to show the updated activity
      await refreshData();
    } catch (error) {
      console.error('Error updating activity:', error);
      throw error;
    }
  };

  // Test data creation function removed for production

  const repairBrokenReferences = async () => {
    try {
      if (activities.length === 0) {
        toast.error(t('stage2.toast.noActivitiesToRepair'));
        return;
      }
      
      if (emissionFactors.length === 0) {
        toast.error(t('stage2.toast.noEmissionFactorsForRepair'));
        return;
      }
      
      const updatedActivities = activities.map(activity => {
        // Check if the emission factor exists
        const factor = emissionFactors.find(f => String(f._id) === String(activity.emissionFactorId));
        
        if (!factor) {
          // Try to find a matching emission factor by scope, category, and location
          const matchingFactor = emissionFactors.find(f => 
            f.scope === activity.scope && 
            f.category === activity.category && 
            f.location === activity.location
          );
          
          if (matchingFactor && matchingFactor._id) {
            const calculatedEmissions = activity.quantity * matchingFactor.co2ePerUnit;
            
            // Store emission factor data directly
            const emissionFactorData = {
              description: matchingFactor.description,
              co2ePerUnit: matchingFactor.co2ePerUnit,
              emissionFactorUnit: matchingFactor.emissionFactorUnit,
              unit: matchingFactor.unit
            };
            
            return {
              ...activity,
              emissionFactorId: matchingFactor._id,
              calculatedEmissions,
              emissionFactorData
            };
          } else {
            // Set calculated emissions to 0 and keep the broken reference for now
            return {
              ...activity,
              calculatedEmissions: 0
            };
          }
        }
        
        // If factor exists but no emission factor data, add it
        if (factor && !activity.emissionFactorData) {
          const emissionFactorData = {
            description: factor.description,
            co2ePerUnit: factor.co2ePerUnit,
            emissionFactorUnit: factor.emissionFactorUnit,
            unit: factor.unit
          };
          
          return {
            ...activity,
            emissionFactorData
          };
        }
        
        return activity;
      });
      
      // Update activities in IndexedDB
      for (const activity of updatedActivities) {
        try {
          await indexedDBService.updateReportingActivity(activity);
        } catch (error) {
          console.error('Failed to update calculated emissions for activity:', activity._id, error);
        }
      }
      
      // Update local state
      setActivities(updatedActivities);
      toast.success(t('stage2.toast.brokenReferencesRepairedSuccessfully'));
    } catch (error) {
      console.error('Error repairing broken references:', error);
      toast.error(t('stage2.toast.repairBrokenReferencesFailed'));
    }
  };

  const getEmissionFactorDescription = (id?: string, activity?: ReportingActivity) => {
    // First check if the activity has emission factor data stored directly
    if (activity?.emissionFactorData) {
      return `${activity.emissionFactorData.description} (${activity.emissionFactorData.co2ePerUnit} ${activity.emissionFactorData.emissionFactorUnit})`;
    }
    
    if (!id) {
      return 'No emission factor selected';
    }
    
    const factor = emissionFactors.find(f => String(f._id) === String(id));
    
    if (factor) {
      const description = `${factor.description} (${factor.co2ePerUnit} ${factor.emissionFactorUnit})`;
      return description;
    }
    
    return '⚠️ Emission factor not found (ID: ' + id + ')';
  };

  const calculateEmissions = (activity: ReportingActivity): number | null => {
    // First try to use stored calculated emissions
    if (activity.calculatedEmissions !== undefined && activity.calculatedEmissions !== null) {
      return activity.calculatedEmissions;
    }
    
    // If we have emission factor data stored directly, use that
    if (activity.emissionFactorData) {
      const calculated = activity.quantity * activity.emissionFactorData.co2ePerUnit;
      return calculated;
    }
    
    // Fallback to looking up emission factor by ID
    if (activity.emissionFactorId) {
      const factor = emissionFactors.find(f => String(f._id) === String(activity.emissionFactorId));
      
      if (factor && activity.quantity) {
        const calculated = activity.quantity * factor.co2ePerUnit;
        return calculated;
      }
    }
    
    return null;
  };

  const getEmissionFactorUnit = (id?: string): string => {
    if (!id) {
      return '';
    }
    
    const factor = emissionFactors.find(f => String(f._id) === String(id));
    return factor ? factor.emissionFactorUnit : '';
  };

  const analyzeDataIntegrity = () => {
    if (activities.length === 0 || emissionFactors.length === 0) {
      return 'No data to analyze';
    }
    
    const brokenReferences = activities.filter(activity => {
      const factor = emissionFactors.find(f => String(f._id) === String(activity.emissionFactorId));
      return !factor;
    });
    
    const validReferences = activities.filter(activity => {
      const factor = emissionFactors.find(f => String(f._id) === String(activity.emissionFactorId));
      return factor;
    });
    
    return {
      totalActivities: activities.length,
      validReferences: validReferences.length,
      brokenReferences: brokenReferences.length,
      brokenActivities: brokenReferences.map(a => ({
        name: a.activityName,
        id: a._id,
        emissionFactorId: a.emissionFactorId
      }))
    };
  };

  const showAvailableEmissionFactors = (activity: ReportingActivity) => {
    const availableFactors = emissionFactors.filter(f => 
      f.scope === activity.scope && 
      f.category === activity.category && 
      f.location === activity.location
    );
    
          if (availableFactors.length === 0) {
      toast.error(t('stage2.toast.noEmissionFactorsFound', { scope: activity.scope, category: activity.category, location: activity.location }));
    } else {
      const factorList = availableFactors.map(f => `${f.description} (ID: ${f._id})`).join('\n');
      toast.success(t('stage2.toast.foundEmissionFactors', { count: availableFactors.length, factorList }), { duration: 5000 });
    }
  };

  const createMissingEmissionFactor = async (activity: ReportingActivity) => {
    try {
      // Create a basic emission factor based on the activity
      const newFactor = {
        description: `Auto-generated for ${activity.activityName}`,
        scope: activity.scope,
        category: activity.category,
        location: activity.location,
        unit: 'kWh', // Default unit
        dataSource: 'Auto-generated',
        methodType: 'Volume Based' as const,
        co2ePerUnit: 0.5, // Default value - user should update this
        emissionFactorUnit: 'kg CO2e/kWh',
        ghgReportingStandard: 'GHG Protocol',
        sourceOrDisclosureRequirement: 'Auto-generated - please update with actual values'
      };
      
      const factorId = await indexedDBService.addEmissionFactor(newFactor);
      
      // Update the activity to use the new emission factor
      const updatedActivity = {
        ...activity,
        emissionFactorId: factorId,
        calculatedEmissions: activity.quantity * newFactor.co2ePerUnit
      };
      
      await indexedDBService.updateReportingActivity(updatedActivity);
      
      toast.success(t('stage2.toast.createdMissingEmissionFactorSuccessfully'));
      
      // Refresh the data
      await refreshData();
    } catch (error) {
      console.error('Error creating missing emission factor:', error);
      toast.error(t('stage2.toast.createMissingEmissionFactorFailed'));
    }
  };

  const recalculateAllEmissions = async () => {
    if (emissionFactors.length === 0) {
      toast.error(t('stage2.toast.noEmissionFactorsForCalculation'));
      return;
    }
    
    if (activities.length === 0) {
      toast.error(t('stage2.toast.noActivitiesToRecalculate'));
      return;
    }
    
    try {
      const updatedActivities = activities.map(activity => {
        const factor = emissionFactors.find(f => String(f._id) === String(activity.emissionFactorId));
        if (factor && activity.quantity) {
          const calculatedEmissions = activity.quantity * factor.co2ePerUnit;
          return {
            ...activity,
            calculatedEmissions
          };
        } else {
          return activity;
        }
      });
      
      // Update activities in IndexedDB
      for (const activity of updatedActivities) {
        if (activity.calculatedEmissions !== undefined && activity.calculatedEmissions !== null) {
          try {
            await indexedDBService.updateReportingActivity(activity);
          } catch (error) {
            console.error('Failed to update calculated emissions for activity:', activity._id, error);
          }
        }
      }
      
      // Update local state
      setActivities(updatedActivities);
      toast.success(t('stage2.toast.emissionsRecalculatedSuccessfully'));
    } catch (error) {
      console.error('Error recalculating emissions:', error);
      toast.error(t('stage2.toast.recalculateEmissionsFailed'));
    }
  };

  const refreshData = async () => {
    try {
      setIsLoadingData(true);
      
      // Load emission factors first
      const factors = await indexedDBService.getAllEmissionFactors();
      setEmissionFactors(Array.isArray(factors) ? factors : []);
      
      // Then load activities
      const activitiesData = await indexedDBService.getAllReportingActivities();
      const activitiesArray = Array.isArray(activitiesData) ? activitiesData : [];
      setActivities(activitiesArray);
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error(t('stage2.toast.refreshDataFailed'));
    } finally {
      setIsLoadingData(false);
    }
  };

  return (
    <div className="stage">
      <h2 className="stage-title">{t('stage2.title')}</h2>
      
      <form onSubmit={handleSubmit} className="activity-form">
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="reportingPeriodStart">{t('stage2.formLabels.reportingPeriodStart')} *</label>
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
            <label htmlFor="reportingPeriodEnd">{t('stage2.formLabels.reportingPeriodEnd')} *</label>
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
            <label htmlFor="scope">{t('stage2.formLabels.scope')} *</label>
            <select
              id="scope"
              name="scope"
              value={formData.scope}
              onChange={handleInputChange}
              required
              className="form-input"
            >
              <option value="">{t('stage2.placeholders.scope')}</option>
              <option value="Scope 1">Scope 1</option>
              <option value="Scope 2">Scope 2</option>
              <option value="Scope 3">Scope 3</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="category">{t('stage2.formLabels.category')} *</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              required
              className="form-input"
            >
              <option value="">{t('stage2.placeholders.category')}</option>
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="activityName">{t('stage2.formLabels.activityName')} *</label>
            <input
              type="text"
              id="activityName"
              name="activityName"
              value={formData.activityName}
              onChange={handleInputChange}
              required
              className="form-input"
              placeholder={t('stage2.placeholders.activityName')}
            />
          </div>
          <div className="form-group">
            <label htmlFor="location">{t('stage2.formLabels.location')} *</label>
            <select
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              required
              className="form-input"
            >
              <option value="">{t('stage2.placeholders.location')}</option>
              {locationOptions.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="quantity">{t('stage2.formLabels.quantity')} *</label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              value={formData.quantity}
              onChange={handleInputChange}
              step="0.01"
              required
              className="form-input"
              placeholder={t('stage2.placeholders.quantity')}
            />
          </div>
          <div className="form-group">
            <label htmlFor="emissionFactorId">{t('stage2.formLabels.emissionFactorId')} *</label>
            <select
              id="emissionFactorId"
              name="emissionFactorId"
              value={formData.emissionFactorId}
              onChange={handleInputChange}
              required
              className="form-input"
              disabled={!formData.scope || !formData.location || !formData.category}
            >
              <option value="">{t('stage2.placeholders.emissionFactorId')}</option>
              {filteredEmissionFactors.map((factor) => (
                <option key={factor._id} value={factor._id}>
                  {factor.description} ({factor.co2ePerUnit} {factor.emissionFactorUnit})
                </option>
              ))}
            </select>
            {(!formData.scope || !formData.location || !formData.category) && (
              <small className="form-help">
                {t('stage2.validation.selectScopeLocationCategory')}
              </small>
            )}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="remarks">{t('stage2.formLabels.remarks')}</label>
          <textarea
            id="remarks"
            name="remarks"
            value={formData.remarks}
            onChange={handleInputChange}
            className="form-input"
            rows={3}
                          placeholder={t('stage2.placeholders.remarks')}
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? t('stage2.saving') : t('stage2.save')}
          </button>
        </div>
      </form>

      {/* Data Table */}
      <div className="data-section">
        <h3 className="section-title">
          {t('stage2.savedActivities')}
          {connectionStatus === 'fallback' && (
            <span className="connection-status fallback">
              📱 {t('stage2.connectionStatus.fallback')}
            </span>
          )}
          {connectionStatus === 'error' && (
            <span className="connection-status error">
              ⚠️ {t('stage2.connectionStatus.error')}
            </span>
          )}
        </h3>
        
        {isLoadingData ? (
          <div className="loading-state">
            <p>{t('common.loading')}</p>
          </div>
        ) : (
          <div className="table-container">
            {Array.isArray(activities) && activities.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('stage2.formLabels.activityName')}</th>
                    <th>{t('stage2.formLabels.reportingPeriod')}</th>
                    <th>{t('stage2.formLabels.scope')}</th>
                    <th>{t('stage2.formLabels.category')}</th>
                    <th>{t('stage2.formLabels.location')}</th>
                    <th>{t('stage2.formLabels.quantity')}</th>
                    <th>{t('stage2.formLabels.emissionFactorId')}</th>
                    <th>{t('stage2.formLabels.calculatedEmissions')}</th>
                    <th>{t('stage2.formLabels.remarks')}</th>
                    <th>{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((activity) => {
                    const emissions = calculateEmissions(activity);
                    const unit = getEmissionFactorUnit(activity.emissionFactorId);
                    
                    // Check if emission factor exists
                    const factorExists = emissionFactors.some(f => String(f._id) === String(activity.emissionFactorId));
                    
                    return (
                      <tr key={activity._id} style={!factorExists ? { backgroundColor: '#fff3cd' } : {}}>
                        <td>{activity.activityName}</td>
                        <td>{activity.reportingPeriodStart} {t('stage2.dateRangeSeparator')} {activity.reportingPeriodEnd}</td>
                        <td>{activity.scope}</td>
                        <td>{activity.category}</td>
                        <td>{activity.location}</td>
                        <td>{activity.quantity}</td>
                        <td>
                          {(() => {
                            // First try to use stored emission factor data
                            if (activity.emissionFactorData) {
                              return `${activity.emissionFactorData.description} (${activity.emissionFactorData.co2ePerUnit} ${activity.emissionFactorData.emissionFactorUnit})`;
                            }
                            
                            // Fallback to looking up by ID
                            if (factorExists) {
                              return getEmissionFactorDescription(activity.emissionFactorId, activity);
                            }
                            
                            return (
                              <span style={{ color: '#dc3545', fontWeight: 'bold' }}>
                                ⚠️ Emission factor not found (ID: {activity.emissionFactorId})
                              </span>
                            );
                          })()}
                        </td>
                        <td>
                          {(() => {
                            if (emissions !== null) {
                              // Use stored emission factor data for unit if available
                              const unit = activity.emissionFactorData?.emissionFactorUnit || getEmissionFactorUnit(activity.emissionFactorId);
                              return `${emissions.toFixed(2)} ${unit || t('stage2.defaultUnit')}`;
                            }
                            if (!factorExists && !activity.emissionFactorData) {
                              return <span style={{ color: '#dc3545' }}>{t('stage2.cannotCalculateEFMissing')}</span>;
                            }
                            return t('common.noData');
                          })()}
                        </td>
                        <td>
                          {activity.remarks || t('common.noData')}
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              onClick={() => handleEdit(activity)}
                              className="btn btn-small btn-secondary"
                              title={t('common.edit')}
                            >
                              <FaEdit /> {t('common.edit')}
                            </button>
                            <button
                              onClick={() => handleDelete(activity)}
                              className="btn btn-small btn-danger"
                              title={t('common.delete')}
                              disabled={isDeleting}
                            >
                              <FaTrash /> {t('common.delete')}
                            </button>
                            {!factorExists && (
                              <button
                                onClick={() => createMissingEmissionFactor(activity)}
                                className="btn btn-small btn-primary"
                                style={{ fontSize: '10px', padding: '2px 4px' }}
                                title={t('stage2.createMissingEmissionFactor')}
                              >
                                {t('stage2.createMissingEmissionFactor')}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="no-data">
                <p>{t('stage2.noActivitiesMessage')}</p>
                {connectionStatus === 'fallback' && (
                  <p className="fallback-note">
                    <small>{t('stage2.connectionStatus.fallback')}</small>
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="stage-actions">
        <button onClick={onNext} className="btn btn-primary">
          {t('stage2.nextButton')}
        </button>
      </div>

      {/* Edit Activity Modal */}
      <EditActivityModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingActivity(null);
        }}
        activity={editingActivity}
        onUpdate={handleUpdateActivity}
        emissionFactors={emissionFactors}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingActivity(null);
        }}
        onConfirm={confirmDelete}
        title={t('stage2.deleteModal.title')}
        message={t('stage2.deleteModal.message', { activityName: deletingActivity?.activityName || '' })}
        confirmText={t('stage2.deleteModal.confirmText')}
        cancelText={t('stage2.deleteModal.cancelText')}
      />
    </div>
  );
};

export default Stage2; 