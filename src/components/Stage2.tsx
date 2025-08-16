'use client';

import React, { useState, useEffect } from 'react';
import * as toastModule from 'react-hot-toast';
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
        console.log('Loading emission factors...');
        const factors = await indexedDBService.getAllEmissionFactors();
        setEmissionFactors(Array.isArray(factors) ? factors : []);
        console.log('Emission factors loaded:', factors.length);
        
        // Then load activities
        console.log('Loading activities...');
        const activitiesData = await indexedDBService.getAllReportingActivities();
        const activitiesArray = Array.isArray(activitiesData) ? activitiesData : [];
        setActivities(activitiesArray);
        console.log('Activities loaded:', activitiesArray.length);
        
        setConnectionStatus('connected');
      } catch (error) {
        console.error('Error loading data:', error);
        setConnectionStatus('error');
        toast.error('Failed to load data');
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
      console.log('Recalculating emissions for activities:', activities.length);
      console.log('Available emission factors:', emissionFactors.length);
      
      const updatedActivities = activities.map(activity => {
        console.log('Processing activity:', activity.activityName, 'with emissionFactorId:', activity.emissionFactorId);
        
        if (activity.calculatedEmissions === undefined || activity.calculatedEmissions === null) {
          const factor = emissionFactors.find(f => String(f._id) === String(activity.emissionFactorId));
          console.log('Found emission factor:', factor);
          
          if (factor && activity.quantity) {
            const calculatedEmissions = activity.quantity * factor.co2ePerUnit;
            console.log('Calculated emissions:', calculatedEmissions, 'for quantity:', activity.quantity, 'and factor:', factor.co2ePerUnit);
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
        console.log('Updating activities with calculated emissions');
        setActivities(updatedActivities);
        
        // Update activities in IndexedDB with calculated emissions
        updatedActivities.forEach(async (activity) => {
          if (activity.calculatedEmissions !== undefined && activity.calculatedEmissions !== null) {
            try {
              await indexedDBService.updateReportingActivity(activity);
              console.log('Updated activity in IndexedDB:', activity._id);
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
    
    console.log(`Stage2: Input change - name: ${name}, value: ${value}, type: ${typeof value}`);
    
    // Reset dependent fields when location or category changes
    if (name === 'location' || name === 'category') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        emissionFactorId: '' // Reset emission factor when location or category changes
      }));
    } else if (name === 'emissionFactorId') {
      // Handle emission factor selection specifically
      console.log(`Stage2: Selected emission factor ID: ${value}, type: ${typeof value}`);
      console.log(`Stage2: Available emission factors:`, emissionFactors);
      
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
        toast.error('Please select an emission factor');
        return;
      }
      
      console.log('Form submission - emissionFactorId:', formData.emissionFactorId, 'type:', typeof formData.emissionFactorId);
      console.log('Available emission factors:', emissionFactors);
      
      // Find the emission factor - handle both string and number ID types
      let factor = null;
      
      // Convert the selected ID to string for consistent comparison
      const selectedIdStr = String(formData.emissionFactorId);
      
      // Try to find the factor by converting all IDs to strings for comparison
      factor = emissionFactors.find(f => String(f._id) === selectedIdStr);
      
      if (factor) {
        console.log('Found emission factor using string comparison:', factor);
      } else {
        console.log('No emission factor found with ID:', selectedIdStr);
      }
      
      console.log('Form data quantity:', formData.quantity);
      
      if (!factor) {
        console.error('Emission factor not found after all conversion attempts');
        console.error('Selected ID:', formData.emissionFactorId, 'type:', typeof formData.emissionFactorId);
        console.error('Available emission factor IDs:', emissionFactors.map(f => ({ id: f._id, type: typeof f._id })));
        toast.error('Selected emission factor not found. Please select a valid emission factor.');
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
      console.log('Calculated emissions:', calculatedEmissions);
      
      const activityToSave = { 
        ...formData, 
        calculatedEmissions,
        emissionFactorData // Store the actual data, not just the ID
      };
      console.log('Saving activity with emission factor data:', activityToSave);
      
      const newId = await indexedDBService.addReportingActivity(activityToSave);
      console.log('Activity saved with ID:', newId);
      
      toast.success('Activity saved successfully!');
      resetForm();
      await refreshData();
    } catch (error) {
      console.error('Error saving activity:', error);
      toast.error('Failed to save activity');
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
      toast.success('Activity deleted successfully!');
      setShowDeleteModal(false);
      setDeletingActivity(null);
      await refreshData();
    } catch (error) {
      console.error('Error deleting activity:', error);
      toast.error('Failed to delete activity');
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
      console.log('Updating activity:', updatedActivity);
      console.log('Activity ID type:', typeof updatedActivity._id);
      console.log('Activity ID value:', updatedActivity._id);
      
      if (!updatedActivity._id) {
        throw new Error('Activity ID is missing');
      }

      // If we already have emission factor data, use it
      if (updatedActivity.emissionFactorData) {
        console.log('Using stored emission factor data for calculation');
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
      
      console.log('Update successful');
      // Refresh the data to show the updated activity
      await refreshData();
    } catch (error) {
      console.error('Error updating activity:', error);
      throw error;
    }
  };

  const createTestData = async () => {
    try {
      console.log('Creating test data...');
      
      // Create a test emission factor
      const testFactor = {
        description: 'Test Electricity Factor',
        scope: 'Scope 2',
        category: 'Electricity',
        location: 'Test Location',
        unit: 'kWh',
        dataSource: 'Test Source',
        methodType: 'Volume Based' as const,
        co2ePerUnit: 0.5,
        emissionFactorUnit: 'kg CO2e/kWh',
        ghgReportingStandard: 'GHG Protocol',
        sourceOrDisclosureRequirement: 'Test'
      };
      
      const factorId = await indexedDBService.addEmissionFactor(testFactor);
      console.log('Test emission factor created with ID:', factorId);
      
      // Create a test activity
      const testActivity = {
        reportingPeriodStart: '2024-01-01',
        reportingPeriodEnd: '2024-01-31',
        scope: 'Scope 2',
        category: 'Electricity',
        activityName: 'Test Activity',
        location: 'Test Location',
        quantity: 100,
        emissionFactorId: factorId,
        remarks: 'Test activity',
        calculatedEmissions: 50 // 100 * 0.5
      };
      
      const activityId = await indexedDBService.addReportingActivity(testActivity);
      console.log('Test activity created with ID:', activityId);
      
      toast.success('Test data created successfully!');
      
      // Refresh the data
      await refreshData();
    } catch (error) {
      console.error('Error creating test data:', error);
      toast.error('Failed to create test data');
    }
  };

  const repairBrokenReferences = async () => {
    try {
      console.log('Repairing broken emission factor references...');
      
      if (activities.length === 0) {
        toast.error('No activities to repair');
        return;
      }
      
      if (emissionFactors.length === 0) {
        toast.error('No emission factors available for repair');
        return;
      }
      
      const updatedActivities = activities.map(activity => {
        // Check if the emission factor exists
        const factor = emissionFactors.find(f => String(f._id) === String(activity.emissionFactorId));
        
        if (!factor) {
          console.log(`Activity ${activity.activityName} has broken reference to emission factor ID: ${activity.emissionFactorId}`);
          
          // Try to find a matching emission factor by scope, category, and location
          const matchingFactor = emissionFactors.find(f => 
            f.scope === activity.scope && 
            f.category === activity.category && 
            f.location === activity.location
          );
          
          if (matchingFactor && matchingFactor._id) {
            console.log(`Found matching emission factor: ${matchingFactor.description} (ID: ${matchingFactor._id})`);
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
            console.log(`No matching emission factor found for activity: ${activity.activityName}`);
            // Set calculated emissions to 0 and keep the broken reference for now
            return {
              ...activity,
              calculatedEmissions: 0
            };
          }
        }
        
        // If factor exists but no emission factor data, add it
        if (factor && !activity.emissionFactorData) {
          console.log(`Adding emission factor data for activity: ${activity.activityName}`);
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
          console.log('Updated activity in IndexedDB:', activity._id);
        } catch (error) {
          console.error('Failed to update calculated emissions for activity:', activity._id, error);
        }
      }
      
      // Update local state
      setActivities(updatedActivities);
      toast.success('Broken references repaired successfully!');
    } catch (error) {
      console.error('Error repairing broken references:', error);
      toast.error('Failed to repair broken references');
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
    
    console.log('Looking for emission factor with ID:', id);
    console.log('Available emission factors:', emissionFactors);
    
    const factor = emissionFactors.find(f => String(f._id) === String(id));
    console.log('Found factor:', factor);
    
    if (factor) {
      const description = `${factor.description} (${factor.co2ePerUnit} ${factor.emissionFactorUnit})`;
      console.log('Returning description:', description);
      return description;
    }
    
    console.log('No factor found, returning error message');
    return '⚠️ Emission factor not found (ID: ' + id + ')';
  };

  const calculateEmissions = (activity: ReportingActivity): number | null => {
    console.log('Calculating emissions for activity:', activity.activityName);
    console.log('Activity calculatedEmissions:', activity.calculatedEmissions);
    console.log('Activity emissionFactorId:', activity.emissionFactorId);
    console.log('Activity quantity:', activity.quantity);
    
    // First try to use stored calculated emissions
    if (activity.calculatedEmissions !== undefined && activity.calculatedEmissions !== null) {
      console.log('Using stored calculated emissions:', activity.calculatedEmissions);
      return activity.calculatedEmissions;
    }
    
    // If we have emission factor data stored directly, use that
    if (activity.emissionFactorData) {
      const calculated = activity.quantity * activity.emissionFactorData.co2ePerUnit;
      console.log('Calculated using stored emission factor data:', calculated);
      return calculated;
    }
    
    // Fallback to looking up emission factor by ID
    if (activity.emissionFactorId) {
      const factor = emissionFactors.find(f => String(f._id) === String(activity.emissionFactorId));
      console.log('Found emission factor for calculation:', factor);
      
      if (factor && activity.quantity) {
        const calculated = activity.quantity * factor.co2ePerUnit;
        console.log('Calculated emissions:', calculated);
        return calculated;
      }
    }
    
    if (!activity.emissionFactorId) {
      console.log('No emission factor ID provided');
    }
    
    if (!activity.quantity) {
      console.log('Activity quantity is missing or invalid:', activity.quantity);
    }
    
    console.log('Could not calculate emissions');
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
    
    console.log(`Available emission factors for activity "${activity.activityName}":`, availableFactors);
    
    if (availableFactors.length === 0) {
      toast.error(`No emission factors found for Scope: ${activity.scope}, Category: ${activity.category}, Location: ${activity.location}`);
    } else {
      const factorList = availableFactors.map(f => `${f.description} (ID: ${f._id})`).join('\n');
      toast.success(`Found ${availableFactors.length} emission factors:\n${factorList}`, { duration: 5000 });
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
      console.log('Created missing emission factor with ID:', factorId);
      
      // Update the activity to use the new emission factor
      const updatedActivity = {
        ...activity,
        emissionFactorId: factorId,
        calculatedEmissions: activity.quantity * newFactor.co2ePerUnit
      };
      
      await indexedDBService.updateReportingActivity(updatedActivity);
      console.log('Updated activity to use new emission factor');
      
      toast.success('Created missing emission factor and linked to activity!');
      
      // Refresh the data
      await refreshData();
    } catch (error) {
      console.error('Error creating missing emission factor:', error);
      toast.error('Failed to create missing emission factor');
    }
  };

  const recalculateAllEmissions = async () => {
    console.log('Manually recalculating emissions for all activities');
    
    if (emissionFactors.length === 0) {
      toast.error('No emission factors available for calculation');
      return;
    }
    
    if (activities.length === 0) {
      toast.error('No activities to recalculate');
      return;
    }
    
    try {
      const updatedActivities = activities.map(activity => {
        const factor = emissionFactors.find(f => String(f._id) === String(activity.emissionFactorId));
        if (factor && activity.quantity) {
          const calculatedEmissions = activity.quantity * factor.co2ePerUnit;
          console.log(`Recalculated for ${activity.activityName}: ${activity.quantity} × ${factor.co2ePerUnit} = ${calculatedEmissions}`);
          return {
            ...activity,
            calculatedEmissions
          };
        } else {
          console.log(`Could not calculate for ${activity.activityName}: factor=${!!factor}, quantity=${activity.quantity}`);
          return activity;
        }
      });
      
      // Update activities in IndexedDB
      for (const activity of updatedActivities) {
        if (activity.calculatedEmissions !== undefined && activity.calculatedEmissions !== null) {
          try {
            await indexedDBService.updateReportingActivity(activity);
            console.log('Updated activity in IndexedDB:', activity._id);
          } catch (error) {
            console.error('Failed to update calculated emissions for activity:', activity._id, error);
          }
        }
      }
      
      // Update local state
      setActivities(updatedActivities);
      toast.success('Emissions recalculated successfully!');
    } catch (error) {
      console.error('Error recalculating emissions:', error);
      toast.error('Failed to recalculate emissions');
    }
  };

  const refreshData = async () => {
    try {
      setIsLoadingData(true);
      
      // Load emission factors first
      console.log('Refreshing emission factors...');
      const factors = await indexedDBService.getAllEmissionFactors();
      setEmissionFactors(Array.isArray(factors) ? factors : []);
      console.log('Emission factors refreshed:', factors.length);
      
      // Then load activities
      console.log('Refreshing activities...');
      const activitiesData = await indexedDBService.getAllReportingActivities();
      const activitiesArray = Array.isArray(activitiesData) ? activitiesData : [];
      setActivities(activitiesArray);
      console.log('Activities refreshed:', activitiesArray.length);
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('Failed to refresh data');
    } finally {
      setIsLoadingData(false);
    }
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
              {filteredEmissionFactors.map((factor) => {
                console.log(`Stage2: Rendering option for factor:`, factor);
                console.log(`Stage2: Factor ID: ${factor._id}, type: ${typeof factor._id}`);
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
            {isLoading ? 'Saving...' : 'Save'}
          </button>
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
                    <th>Remarks</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((activity) => {
                    console.log('Rendering activity row:', activity);
                    const emissions = calculateEmissions(activity);
                    const unit = getEmissionFactorUnit(activity.emissionFactorId);
                    console.log('Calculated emissions for row:', emissions, 'unit:', unit);
                    
                    // Check if emission factor exists
                    const factorExists = emissionFactors.some(f => String(f._id) === String(activity.emissionFactorId));
                    
                    return (
                      <tr key={activity._id} style={!factorExists ? { backgroundColor: '#fff3cd' } : {}}>
                        <td>{activity.activityName}</td>
                        <td>{activity.reportingPeriodStart} to {activity.reportingPeriodEnd}</td>
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
                              return `${emissions.toFixed(2)} ${unit || 'kg CO2e'}`;
                            }
                            if (!factorExists && !activity.emissionFactorData) {
                              return <span style={{ color: '#dc3545' }}>Cannot calculate - EF missing</span>;
                            }
                            return 'N/A';
                          })()}
                        </td>
                        <td>
                          {activity.remarks || '-'}
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              onClick={() => handleEdit(activity)}
                              className="btn btn-small btn-secondary"
                              title="Edit activity"
                            >
                              <FaEdit /> Edit
                            </button>
                            <button
                              onClick={() => handleDelete(activity)}
                              className="btn btn-small btn-danger"
                              title="Delete activity"
                              disabled={isDeleting}
                            >
                              <FaTrash /> Delete
                            </button>
                            {!factorExists && (
                              <button
                                onClick={() => createMissingEmissionFactor(activity)}
                                className="btn btn-small btn-primary"
                                style={{ fontSize: '10px', padding: '2px 4px' }}
                                title="Create missing emission factor"
                              >
                                Create EF
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
        title="Delete Activity"
        message={`Are you sure you want to delete "${deletingActivity?.activityName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
};

export default Stage2; 