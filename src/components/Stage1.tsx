'use client';

import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { useTranslations } from 'next-intl';
import { useI18n } from '../i18n/provider';
import EmissionFactorCSVManager from './EmissionFactorCSVManager';
import EditEmissionFactorModal from './EditEmissionFactorModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import EmissionFactorTable from './EmissionFactorTable';
import { emissionFactorFields, EmissionFactorData } from '../config/emissionFactorSchema';
import indexedDBService from '@/lib/indexedDB';
import type { EmissionFactor } from '@/lib/indexedDB';

interface Stage1Props {
  onNext: () => void;
}

const Stage1: React.FC<Stage1Props> = ({ onNext }) => {
  const t = useTranslations();
  const { locale } = useI18n();
  
  // Force re-render when locale changes to ensure immediate translation updates
  const [forceUpdate, setForceUpdate] = useState(0);
  
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

  const [emissionFactors, setEmissionFactors] = useState<EmissionFactorData[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingFactor, setEditingFactor] = useState<EmissionFactorData | null>(null);
  
  // Delete functionality state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingFactor, setDeletingFactor] = useState<EmissionFactorData | null>(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [selectedFactors, setSelectedFactors] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Add state for standards dropdown
  const [ghgStandards, setGhgStandards] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showTooltips, setShowTooltips] = useState<Record<string, boolean>>({});

  // Add refs for auto-scrolling
  const importSectionRef = useRef<HTMLDivElement>(null);
  const savedFactorsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchEmissionFactors();
    fetchGhgStandards();
  }, []);

  // Force re-render when locale changes to ensure immediate translation updates
  useEffect(() => {
    setForceUpdate(prev => prev + 1);
  }, [locale]);

  // Update validation errors when language changes
  useEffect(() => {
    if (Object.keys(fieldErrors).length > 0) {
      // Re-validate all fields with current language
      const updatedErrors: Record<string, string> = {};
      Object.keys(fieldErrors).forEach(fieldName => {
        const value = formData[fieldName as keyof EmissionFactorData];
        const error = validateField(fieldName, value);
        if (error) {
          updatedErrors[fieldName] = error;
        }
      });
      setFieldErrors(updatedErrors);
    }
  }, [locale, t]); // Dependency on both locale and translation function

  const fetchEmissionFactors = async () => {
    try {
      const data = await indexedDBService.getAllEmissionFactors();
      // Ensure data is always an array
      setEmissionFactors(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching emission factors:', error);
      toast.error(t('stage1.toast.fetchEmissionFactorsFailed'));
      // Set empty array as fallback
      setEmissionFactors([]);
    }
  };

  const fetchGhgStandards = async () => {
    try {
      const data = await indexedDBService.getAllGhgReportingStandards();
      const standards = data.map(standard => standard.name);
      // Ensure data is always an array
      setGhgStandards(Array.isArray(standards) ? standards : []);
    } catch (error) {
      console.error('Error fetching GHG Reporting Standards:', error);
      toast.error(t('stage1.toast.fetchGhgStandardsFailed'));
      // Set empty array as fallback
      setGhgStandards([]);
    }
  };

  // Real-time validation
  const validateField = (name: string, value: string | number | undefined) => {
    const field = emissionFactorFields.find(f => f.key === name);
    if (!field || !field.required) return '';
    
    // Only validate if user has started typing or field has been touched
    if (field.type === 'number') {
      if (value === undefined || value === null || isNaN(Number(value))) {
        return t('stage1.validation.invalidNumber');
      }
    } else {
      // For strings, check if it's undefined, null, or empty string
      // But allow empty strings if the field allows it (for CSV imports)
      if (value === undefined || value === null || 
          (typeof value === 'string' && value.trim() === '' && !field.allowEmpty)) {
        return t('stage1.validation.required');
      }
    }
    
    // Additional validation for specific field types
    if (field.validation) {
      if (field.validation.enumOptions && typeof value === 'string' && !field.validation.enumOptions.includes(value)) {
        return t('stage1.validation.enumError', { options: field.validation.enumOptions.join(', ') });
      }
    }
    
    return '';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'co2ePerUnit' ? parseFloat(value) || 0 : value
    }));
    
    // Only validate if user has actually typed something or field has been touched
    const error = validateField(name, value);
    setFieldErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const handleFieldFocus = (fieldName: string) => {
    setShowTooltips(prev => ({ ...prev, [fieldName]: true }));
  };

  const handleFieldBlur = (fieldName: string) => {
    setShowTooltips(prev => ({ ...prev, [fieldName]: false }));
    // Validate on blur to show errors for empty required fields
    const value = formData[fieldName as keyof EmissionFactorData];
    const error = validateField(fieldName, value);
    setFieldErrors(prev => ({
      ...prev,
      [fieldName]: error
    }));
  };

  // Get tooltip content for a field
  const getTooltipContent = (fieldName: string) => {
    const field = emissionFactorFields.find(f => f.key === fieldName);
    if (!field) return '';
    
    switch (fieldName) {
      case 'description':
        return t('stage1.tooltips.description');
      case 'scope':
        return t('stage1.tooltips.scope');
      case 'category':
        return t('stage1.tooltips.category');
      case 'location':
        return t('stage1.tooltips.location');
      case 'unit':
        return t('stage1.tooltips.unit');
      case 'dataSource':
        return t('stage1.tooltips.dataSource');
      case 'methodType':
        return t('stage1.tooltips.methodType');
      case 'co2ePerUnit':
        return t('stage1.tooltips.co2ePerUnit');
      case 'emissionFactorUnit':
        return t('stage1.tooltips.emissionFactorUnit');
      case 'ghgReportingStandard':
        return t('stage1.tooltips.ghgReportingStandard');
      case 'sourceOrDisclosureRequirement':
        return t('stage1.tooltips.sourceOrDisclosureRequirement');
      default:
        return '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const errors: Record<string, string> = {};
    emissionFactorFields.forEach(field => {
      if (field.required) {
        const value = formData[field.key as keyof EmissionFactorData];
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          errors[field.key] = t('stage1.validation.fieldRequired', { fieldName: field.label });
        }
      }
    });

    if (Object.keys(errors).length > 0) {
      Object.values(errors).forEach(error => toast.error(error));
      return;
    }

    try {
      const newFactorId = await indexedDBService.addEmissionFactor(formData);
      const newFactor = { ...formData, _id: newFactorId };
      setEmissionFactors(prev => [...prev, newFactor]);
      
      // Reset form
      setFormData({
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
      
      toast.success(t('stage1.toast.addedSuccessfully'));
    } catch (error) {
      console.error('Error adding emission factor:', error);
      toast.error(error instanceof Error ? error.message : t('stage1.toast.addFailed'));
    }
  };

  const handleEdit = (factor: EmissionFactorData) => {
    setEditingFactor(factor);
    setShowEditModal(true);
  };

  const handleUpdate = async (updatedFactor: EmissionFactorData) => {
    if (!updatedFactor._id) {
      toast.error(t('stage1.toast.cannotUpdateMissingId'));
      return;
    }

    setIsLoading(true);
    try {
      await indexedDBService.updateEmissionFactor(updatedFactor as EmissionFactor);
      toast.success(t('stage1.toast.updatedSuccessfully'));
      fetchEmissionFactors(); // Refresh the table
    } catch (error) {
      console.error('Error updating emission factor:', error);
      toast.error(`${t('stage1.toast.updateFailed')}: ${error instanceof Error ? error.message : t('common.unknownError')}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete functionality
  const handleDelete = (factor: EmissionFactorData) => {
    setDeletingFactor(factor);
    setShowDeleteModal(true);
  };

  const handleBulkDelete = () => {
    if (selectedFactors.size === 0) {
      toast.error(t('stage1.toast.selectAtLeastOneToDelete'));
      return;
    }
    setShowBulkDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingFactor?._id) {
      toast.error(t('stage1.toast.cannotDeleteMissingId'));
      return;
    }

    setIsDeleting(true);
    try {
      await indexedDBService.deleteEmissionFactor(deletingFactor._id);
      toast.success(t('stage1.toast.deletedSuccessfully'));
      fetchEmissionFactors(); // Refresh the table
      setShowDeleteModal(false);
      setDeletingFactor(null);
    } catch (error) {
      console.error('Error deleting emission factor:', error);
      toast.error(`${t('stage1.toast.deleteFailed')}: ${error instanceof Error ? error.message : t('common.unknownError')}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmBulkDelete = async () => {
    if (selectedFactors.size === 0) {
      toast.error(t('stage1.toast.noFactorsSelectedForDeletion'));
      return;
    }

    setIsDeleting(true);
    try {
      // Delete each selected factor
      const deletePromises = Array.from(selectedFactors).map(async (id) => {
        await indexedDBService.deleteEmissionFactor(id);
        return { id, success: true };
      });

      const results = await Promise.allSettled(deletePromises);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.length - successful;

      if (successful > 0) {
        toast.success(t('stage1.toast.bulkDeleteSuccess', { count: successful, plural: successful > 1 ? 's' : '' }));
        if (failed > 0) {
          toast.error(t('stage1.toast.bulkDeleteFailed', { count: failed, plural: failed > 1 ? 's' : '' }));
        }
        fetchEmissionFactors(); // Refresh the table
        setSelectedFactors(new Set()); // Clear selection
      } else {
        toast.error(t('stage1.toast.bulkDeleteAllFailed'));
      }

      setShowBulkDeleteModal(false);
    } catch (error) {
      console.error('Error during bulk delete:', error);
      toast.error(`${t('stage1.toast.bulkDeleteFailed')}: ${error instanceof Error ? error.message : t('common.unknownError')}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSelectFactor = (factorId: string | number, checked: boolean) => {
    if (typeof factorId === 'string') {
      if (checked) {
        setSelectedFactors(prev => new Set([...prev, factorId]));
      } else {
        setSelectedFactors(prev => {
          const newSet = new Set(prev);
          newSet.delete(factorId);
          return newSet;
        });
      }
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedFactors(new Set(emissionFactors.map(f => f._id!).filter(Boolean)));
    } else {
      setSelectedFactors(new Set());
    }
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
      emissionFactorUnit: '',
      ghgReportingStandard: '',
      sourceOrDisclosureRequirement: '',
    });
    setIsEditing(false);
    setFieldErrors({}); // Clear errors on reset
  };

  // Auto-scroll functions
  const scrollToImportSection = () => {
    console.log('Auto-scrolling to import section...');
    if (importSectionRef.current) {
      importSectionRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'end'
      });
      console.log('Scrolled to import section');
    } else {
      console.warn('Import section ref not found');
    }
  };

  const scrollToSavedFactors = () => {
    console.log('Auto-scrolling to saved factors table...');
    if (savedFactorsRef.current) {
      savedFactorsRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
      console.log('Scrolled to saved factors table');
    } else {
      console.warn('Saved factors ref not found');
    }
  };

  // Enhanced CSV import success handler with auto-scroll
  const handleCSVImportSuccess = () => {
    fetchEmissionFactors();
    // Auto-scroll to saved factors table after successful import
    setTimeout(() => {
      scrollToSavedFactors();
    }, 500); // Small delay to ensure data is loaded
  };

  return (
    <div className="stage">
      <h2 className="stage-title">{t('stage1.importTitle')}</h2>
      {/* CSV Import/Export Manager */}
      <EmissionFactorCSVManager 
        onImportSuccess={handleCSVImportSuccess} 
        onCSVLoaded={scrollToImportSection}
        importSectionRef={importSectionRef}
      />

      <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>{t('stage1.or')}</h1>

      <h2 className="stage-title">{t('stage1.inputTitle')}</h2>

      <form onSubmit={handleSubmit} className="emission-form">
        {/* General Section */}
        <div className="form-section">
          <h3 className="section-title">{t('stage1.generalInfoTitle')}</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="description">{t('stage1.formLabels.description')}</label>
              <input
                type="text"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
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
              <label htmlFor="scope">{t('stage1.formLabels.scope')}</label>
              <select
                id="scope"
                name="scope"
                value={formData.scope}
                onChange={handleInputChange}
                onFocus={() => handleFieldFocus('scope')}
                onBlur={() => handleFieldBlur('scope')}
                required
                className={`form-input ${fieldErrors.scope ? 'form-input-error' : ''}`}
              >
                <option value="">{t('stage1.selectScope')}</option>
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
              <label htmlFor="category">{t('stage1.formLabels.category')}</label>
              <input
                type="text"
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
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
              <label htmlFor="location">{t('stage1.formLabels.location')}</label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
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
              <label htmlFor="unit">{t('stage1.formLabels.unit')}</label> 
              <input
                type="text"
                id="unit"
                name="unit"
                value={formData.unit}
                onChange={handleInputChange}
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
              <label htmlFor="dataSource">{t('stage1.formLabels.dataSource')}</label>
              <input
                type="text"
                id="dataSource"
                name="dataSource"
                value={formData.dataSource}
                onChange={handleInputChange}
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

        {/* Calculation Methods Section */}
        <div className="form-section">
          <h3 className="section-title">{t('stage1.calculationMethodsTitle')}</h3>
          <div className="form-group">
            <label htmlFor="methodType">{t('stage1.formLabels.methodType')}</label>
            <select
              id="methodType"
              name="methodType"
              value={formData.methodType}
              onChange={handleInputChange}
              onFocus={() => handleFieldFocus('methodType')}
              onBlur={() => handleFieldBlur('methodType')}
              required
              className={`form-input ${fieldErrors.methodType ? 'form-input-error' : ''}`}
            >
              <option value="">{t('stage1.selectMethodType')}</option>
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

        {/* Emission Factor & Reference Section */}
        <div className="form-section">
          <h3 className="section-title">{t('stage1.emissionFactorReferenceTitle')}</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="co2ePerUnit">{t('stage1.formLabels.co2ePerUnit')}</label>
              <input
                type="number"
                id="co2ePerUnit"
                name="co2ePerUnit"
                value={formData.co2ePerUnit}
                onChange={handleInputChange}
                onFocus={() => handleFieldFocus('co2ePerUnit')}
                onBlur={() => handleFieldBlur('co2ePerUnit')}
                step="0.01"
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
              <label htmlFor="emissionFactorUnit">{t('stage1.formLabels.emissionFactorUnit')}</label>
              <input
                type="text"
                id="emissionFactorUnit"
                name="emissionFactorUnit"
                value={formData.emissionFactorUnit}
                onChange={handleInputChange}
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
              <label htmlFor="ghgReportingStandard">{t('stage1.formLabels.ghgReportingStandard')}</label>
              {/*
                To add or change the dropdown options, update the MongoDB collection 'ghg_reporting_standards'.
                See src/lib/mongodb.ts for seeding logic.
              */}
              <select
                id="ghgReportingStandard"
                name="ghgReportingStandard"
                value={formData.ghgReportingStandard}
                onChange={handleInputChange}
                onFocus={() => handleFieldFocus('ghgReportingStandard')}
                onBlur={() => handleFieldBlur('ghgReportingStandard')}
                required
                className={`form-input ${fieldErrors.ghgReportingStandard ? 'form-input-error' : ''}`}
              >
                <option value="">{t('stage1.selectStandard')}</option>
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
              <label htmlFor="sourceOrDisclosureRequirement">{t('stage1.formLabels.sourceOrDisclosureRequirement')}</label>
              <input
                type="text"
                id="sourceOrDisclosureRequirement"
                name="sourceOrDisclosureRequirement"
                value={formData.sourceOrDisclosureRequirement}
                onChange={handleInputChange}
                onFocus={() => handleFieldFocus('sourceOrDisclosureRequirement')}
                onBlur={() => handleFieldBlur('sourceOrDisclosureRequirement')}
                required
                className={`form-input ${fieldErrors.sourceOrDisclosureRequirement ? 'form-input-error' : ''}`}
                placeholder={t('stage1.placeholders.sourceOrDisclosureRequirement')}
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

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? t('stage1.saving') : (isEditing ? t('stage1.update') : t('stage1.add'))}
          </button>
          {isEditing && (
            <button type="button" onClick={resetForm} className="btn btn-secondary">
              {t('stage1.cancel')}
            </button>
          )}
        </div>
      </form>

      {/* Data Table */}
      <div className="data-section" ref={savedFactorsRef}>
        <h3 className="section-title">{t('stage1.savedEmissionFactorsTitle')}</h3>
        
        {/* Use unified table component */}
        {emissionFactors.length > 0 && (
          <EmissionFactorTable
            data={emissionFactors}
            selectedRows={selectedFactors}
            onRowSelect={handleSelectFactor}
            onSelectAll={handleSelectAll}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onBulkDelete={handleBulkDelete}
            isDeleting={isDeleting}
            showBulkDelete={true}
            tableType="saved"
          />
        )}
        
        {emissionFactors.length === 0 && (
          <div className="no-data">
            <p>{t('stage1.noEmissionFactorsMessage')}</p>
          </div>
        )}
      </div>

      <div className="stage-actions">
        <button onClick={onNext} className="btn btn-primary">
          {t('stage1.nextButton')}
        </button>
      </div>

      {/* Edit Emission Factor Modal */}
      <EditEmissionFactorModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingFactor(null);
        }}
        factor={editingFactor}
        onUpdate={handleUpdate}
        ghgStandards={ghgStandards}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingFactor(null);
        }}
        onConfirm={confirmDelete}
        title={t('stage1.deleteEmissionFactorTitle')}
        message={t('stage1.deleteEmissionFactorMessage')}
        confirmText={t('stage1.delete')}
        cancelText={t('stage1.cancel')}
      />

      {/* Bulk Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showBulkDeleteModal}
        onClose={() => setShowBulkDeleteModal(false)}
        onConfirm={confirmBulkDelete}
        title={t('stage1.bulkDeleteEmissionFactorsTitle')}
        message={t('stage1.bulkDeleteEmissionFactorsMessage')}
        confirmText={t('stage1.deleteAll')}
        cancelText={t('stage1.cancel')}
        isBulkDelete={true}
        selectedCount={selectedFactors.size}
      />
    </div>
  );
};

export default Stage1; 