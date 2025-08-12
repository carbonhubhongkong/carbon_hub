import React, { useState, useRef } from 'react';
import { FaCheck } from 'react-icons/fa';
import Papa from 'papaparse';
import { toast } from 'react-hot-toast';
import { emissionFactorFields, EmissionFactorData } from '../config/emissionFactorSchema';
import EditEmissionFactorModal from './EditEmissionFactorModal';
import EmissionFactorTable from './EmissionFactorTable';

// Helper: Generate CSV template (headers + example row)
function generateCSVTemplate() {
  const headers = emissionFactorFields.map(f => f.label);
  // Create example data row with realistic values
  const example = emissionFactorFields.map(f => f.example);
  return Papa.unparse({ fields: headers, data: [example] });
}

// Helper: Convert superscript/subscript characters to normal text
function convertSuperscriptSubscript(text: string): string {
  if (!text) return text;
  
  // Normalize the text to handle potential encoding issues
  const normalizedText = text.normalize('NFC');
  
  // More comprehensive character mappings
  const conversions: Record<string, string> = {
    // Superscript numbers (Unicode ranges)
    '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁰': '0',
    // Subscript numbers
    '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9', '₀': '0',
    // Subscript letters
    'ᵢ': 'i', 'ⱼ': 'j', 'ₖ': 'k', 'ₗ': 'l', 'ₘ': 'm', 'ₙ': 'n', 'ₒ': 'o', 'ₚ': 'p', 'ᵣ': 'r', 'ₛ': 's', 'ₜ': 't', 'ᵤ': 'u', 'ᵥ': 'v', 'ₓ': 'x', 'ᵧ': 'y', 'ᵦ': 'z'
  };
  
  // Debug: Log the original text and its character codes
  console.log(`Original text: "${text}"`);
  console.log(`Normalized text: "${normalizedText}"`);
  console.log(`Character codes: ${normalizedText.split('').map(c => `${c}(${c.charCodeAt(0)})`).join(' ')}`);
  
  // Handle the Unicode replacement character (65533) - this indicates encoding corruption
  // Try to reconstruct superscript characters based on context
  let processedText = normalizedText;
  
  // If we see the replacement character, try to fix common patterns
  if (processedText.includes('')) {
    console.log('Detected Unicode replacement character, attempting to fix...');
    
    // Simple character-by-character replacement to avoid double conversion
    processedText = processedText.split('').map(char => {
      if (char.charCodeAt(0) === 65533) {
        return '3'; // Replace Unicode replacement character with '3'
      }
      return char;
    }).join('');
    
    console.log(`Fixed text: "${processedText}"`);
  }
  
  const converted = processedText.split('').map(char => {
    const replacement = conversions[char];
    if (replacement) {
      console.log(`Converting: "${char}" (${char.charCodeAt(0)}) → "${replacement}"`);
      return replacement;
    }
    // Fallback: if character looks like a superscript/subscript but isn't in our map
    const charCode = char.charCodeAt(0);
    if (charCode >= 0x2070 && charCode <= 0x209F) {
      // Superscript and subscript Unicode block
      console.log(`Found unmapped superscript/subscript: "${char}" (${charCode})`);
    }
    return char;
  }).join('');
  
  // Debug: Log the converted text
  if (text !== converted) {
    console.log(`Final conversion: "${text}" → "${converted}"`);
  }
  
  return converted;
}

// Helper: Validate CSV headers against expected schema
function validateCSVHeaders(headers: string[]): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const expectedHeaders = emissionFactorFields.map(f => f.label);
  
  // Check if all expected headers are present
  const missingHeaders = expectedHeaders.filter(expected => 
    !headers.some(header => header.trim().toLowerCase() === expected.toLowerCase())
  );
  
  if (missingHeaders.length > 0) {
    errors.push(`Missing required columns: ${missingHeaders.join(', ')}`);
  }
  
  // Check for extra headers that aren't expected
  const extraHeaders = headers.filter(header => 
    !expectedHeaders.some(expected => header.trim().toLowerCase() === expected.toLowerCase())
  );
  
  if (extraHeaders.length > 0) {
    errors.push(`Unexpected columns found: ${extraHeaders.join(', ')}`);
  }
  
  // Check if headers are in the correct order (optional but helpful)
  const headerOrder = headers.map(h => h.trim().toLowerCase());
  const expectedOrder = expectedHeaders.map(h => h.toLowerCase());
  
  if (JSON.stringify(headerOrder) !== JSON.stringify(expectedOrder)) {
    errors.push('Column order does not match expected template. Please use the provided CSV template.');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Helper: Map CSV row object to schema keys (updated for header-based parsing)
function mapCSVRowToSchema(row: Record<string, string>): EmissionFactorData {
  const mapped: Record<string, string> = {};
  
  // Map each field using the label as the key from the CSV
  emissionFactorFields.forEach(field => {
    let value = row[field.label] ?? '';
    
    // Convert superscript/subscript for specific fields
    if (field.key === 'unit' || field.key === 'emissionFactorUnit') {
      console.log(`Before conversion [${field.key}]: "${value}"`);
      value = convertSuperscriptSubscript(value);
      console.log(`After conversion [${field.key}]: "${value}"`);
    }
    
    mapped[field.key] = value;
  });
  
  // Ensure all required fields are present with proper types
  return {
    description: mapped.description || '',
    scope: mapped.scope || '',
    category: mapped.category || '',
    location: mapped.location || '',
    unit: mapped.unit || '',
    dataSource: mapped.dataSource || '',
    methodType: (mapped.methodType as 'Volume Based' | 'Spend Based' | 'Distance Based' | 'Mass Based') || 'Volume Based',
    co2ePerUnit: parseFloat(mapped.co2ePerUnit) || 0,
    emissionFactorUnit: mapped.emissionFactorUnit || '',
    ghgReportingStandard: mapped.ghgReportingStandard || '',
    sourceOrDisclosureRequirement: mapped.sourceOrDisclosureRequirement || '',
  };
}

// Helper: Validate a single row
function validateRow(row: EmissionFactorData): Record<string, string> {
  const errors: Record<string, string> = {};
  
  // Use the schema to validate each field
  for (const field of emissionFactorFields) {
    const value = row[field.key as keyof EmissionFactorData];
    
    if (field.required) {
      if (field.type === 'number') {
        if (value === undefined || value === null || isNaN(Number(value))) {
          errors[field.key] = `${field.label} is required and must be a valid number`;
        }
      } else {
        // For strings, check if it's undefined, null, or empty string
        // But allow empty strings if the field allows it (for CSV imports)
        if (value === undefined || value === null || 
            (typeof value === 'string' && value.trim() === '' && !field.allowEmpty)) {
          errors[field.key] = `${field.label} is required`;
        }
      }
    }
    
    // Additional validation for specific field types
    if (field.validation) {
      if (field.validation.enumOptions && typeof value === 'string' && value.trim() !== '' && !field.validation.enumOptions.includes(value)) {
        errors[field.key] = `${field.label} must be one of: ${field.validation.enumOptions.join(', ')}`;
      }
      if (field.validation.min !== undefined && typeof value === 'number' && value < field.validation.min) {
        errors[field.key] = `${field.label} must be at least ${field.validation.min}`;
      }
      if (field.validation.max !== undefined && typeof value === 'number' && value > field.validation.max) {
        errors[field.key] = `${field.label} must be at most ${field.validation.max}`;
      }
      if (field.validation.regex && typeof value === 'string' && value.trim() !== '' && !new RegExp(field.validation.regex).test(value)) {
        errors[field.key] = field.validation.customError || `${field.label} format is invalid`;
      }
    }
  }
  
  // Debug logging for validation
  if (Object.keys(errors).length > 0) {
    console.log(`Validation errors for row:`, errors);
    console.log(`Row data:`, row);
  }
  
  return errors;
}

interface EmissionFactorCSVManagerProps {
  onImportSuccess?: () => void; // Callback to notify parent of successful import
}

const EmissionFactorCSVManager: React.FC<EmissionFactorCSVManagerProps> = ({ onImportSuccess }) => {
  const [csvRows, setCsvRows] = useState<EmissionFactorData[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [rowErrors, setRowErrors] = useState<Record<number, Record<string, string>>>({});
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{ added: number; failed: number } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editRowIdx, setEditRowIdx] = useState<number | null>(null);
  const [editingFactor, setEditingFactor] = useState<EmissionFactorData | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Monitor changes in csvRows and ensure validation state is consistent
  React.useEffect(() => {
    if (csvRows.length > 0) {
      console.log('CSV rows changed, ensuring validation state is consistent...');
      console.log('Current csvRows:', csvRows);
      console.log('Current rowErrors:', rowErrors);
      
      // Validate all rows
      const newErrors = validateAllRows(csvRows);
      
      // Check if validation state is consistent
      if (!isValidationStateConsistent()) {
        console.warn('Validation state inconsistency detected, forcing refresh...');
        setTimeout(() => validateAllRows(csvRows), 100);
      }
      
      // Additional check: ensure no false errors exist
      const hasFalseErrors = Object.keys(rowErrors).some(rowIndexStr => {
        const rowIndex = parseInt(rowIndexStr);
        if (rowIndex >= 0 && rowIndex < csvRows.length) {
          const row = csvRows[rowIndex];
          const actualErrors = validateRow(row);
          return Object.keys(actualErrors).length === 0 && Object.keys(rowErrors[rowIndex] || {}).length > 0;
        }
        return false;
      });
      
      if (hasFalseErrors) {
        console.warn('False validation errors detected, cleaning up...');
        ensureCleanValidationState();
      }
    }
  }, [csvRows.length]); // Only trigger when the number of rows changes

  const handleDownloadTemplate = () => {
    const csvContent = generateCSVTemplate();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'emission_factors_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      parseCSV(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'text/csv') {
      parseCSV(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const parseCSV = (file: File) => {
    Papa.parse(file, {
      header: true, // Enable header parsing
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setErrorMsg(`CSV parsing errors: ${results.errors.map(e => e.message).join(', ')}`);
          return;
        }
        
        const rows = results.data as Record<string, string>[];
        if (rows.length === 0) {
          setErrorMsg('CSV file is empty or contains only headers');
          return;
        }
        
        // Get headers from the first row (Papa Parse provides this when header: true)
        const headers = results.meta.fields || [];
        
        // Validate headers
        const headerValidation = validateCSVHeaders(headers);
        if (!headerValidation.isValid) {
          setErrorMsg(`CSV header validation failed: ${headerValidation.errors.join('; ')}`);
          return;
        }
        
        // Map CSV rows to schema (exclude header row automatically)
        const mappedRows = rows
          .filter(row => {
            // Filter out rows that are completely empty or just contain header-like data
            const hasData = Object.values(row).some(value => 
              value && value.trim() !== '' && 
              !emissionFactorFields.some(field => 
                field.label.toLowerCase() === value.trim().toLowerCase()
              )
            );
            return hasData;
          })
          .map(row => mapCSVRowToSchema(row));
        
        if (mappedRows.length === 0) {
          setErrorMsg('No valid data rows found in CSV. Please ensure your CSV contains data rows after the header.');
          return;
        }
        
        setCsvRows(mappedRows);
        
        // Validate all rows using the helper function
        validateAllRows(mappedRows);
        
        setErrorMsg('');
      },
      error: (error) => {
        setErrorMsg(`Error parsing CSV: ${error.message}`);
      }
    });
  };

  const openEditModal = (idx: number) => {
    setEditRowIdx(idx);
    setEditingFactor(csvRows[idx]);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditRowIdx(null);
    setEditingFactor(null);
    
    // Ensure validation state is consistent after closing modal
    if (csvRows.length > 0) {
      validateAllRows(csvRows);
    }
  };

  const toggleRowSelect = (id: string | number, checked: boolean) => {
    const idx = typeof id === 'string' ? parseInt(id) : id;
    if (checked) {
      setSelectedRows(prev => new Set([...prev, idx]));
    } else {
      setSelectedRows(prev => {
        const newSet = new Set(prev);
        newSet.delete(idx);
        return newSet;
      });
    }
  };

  const selectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(csvRows.map((_, idx) => idx)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const deleteSelected = async () => {
    if (selectedRows.size === 0) return;
    
    setIsDeleting(true);
    try {
      const rowsToDelete = Array.from(selectedRows).sort((a, b) => b - a); // Sort in descending order
      const updatedRows = [...csvRows];
      
      // Remove rows from highest index to lowest to avoid index shifting issues
      rowsToDelete.forEach(idx => {
        updatedRows.splice(idx, 1);
      });
      
      setCsvRows(updatedRows);
      setSelectedRows(new Set());
      
      // Re-validate remaining rows using the helper function
      validateAllRows(updatedRows);
      
    } catch (error) {
      console.error('Error deleting rows:', error);
      setErrorMsg('Failed to delete selected rows');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleImport = async () => {
    if (Object.keys(rowErrors).length > 0) {
      setErrorMsg('Please fix all validation errors before importing');
      return;
    }
    
    setImporting(true);
    setImportProgress(0);
    setImportResult(null);
    
    try {
      let added = 0;
      let failed = 0;
      
      for (let i = 0; i < csvRows.length; i++) {
        const row = csvRows[i];
        try {
          const response = await fetch('/api/emission-factors/factors', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(row)
          });
          
          if (response.ok) {
            added++;
          } else {
            failed++;
            console.error(`Failed to import row ${i + 1}:`, await response.text());
          }
        } catch (error) {
          failed++;
          console.error(`Error importing row ${i + 1}:`, error);
        }
        
        // Update progress
        setImportProgress(((i + 1) / csvRows.length) * 100);
      }
      
      setImportResult({ added, failed });
      
      if (failed === 0) {
        // Clear CSV data on successful import
        setCsvRows([]);
        setSelectedRows(new Set());
        setRowErrors({});
        setErrorMsg('');
        
        // Notify parent component of successful import to refresh data
        if (onImportSuccess) {
          onImportSuccess();
        }
        
        // Show success message
        toast.success(`Successfully imported ${added} emission factor${added > 1 ? 's' : ''}! The table below has been updated.`);
      } else {
        // Show partial success message if some failed
        toast.error(`Import completed with ${failed} failure${failed > 1 ? 's' : ''}. ${added} emission factor${added > 1 ? 's' : ''} imported successfully.`);
      }
      
          } catch (error) {
        console.error('Import error:', error);
        setErrorMsg('Import failed');
        toast.error('Import failed. Please try again.');
      } finally {
        setImporting(false);
        setImportProgress(0);
      }
  };

  const handleEdit = (factor: EmissionFactorData) => {
    // Find the index of the factor in csvRows
    const idx = csvRows.findIndex(row => 
      row.description === factor.description && 
      row.scope === factor.scope &&
      row.category === factor.category
    );
    
    if (idx !== -1) {
      openEditModal(idx);
    }
  };

  const handleDelete = (factor: EmissionFactorData) => {
    // Find the index of the factor in csvRows
    const idx = csvRows.findIndex(row => 
      row.description === factor.description && 
      row.scope === factor.scope &&
      row.category === factor.category
    );
    
    if (idx !== -1) {
      setSelectedRows(new Set([idx]));
      deleteSelected();
    }
  };

  // Helper function to validate all rows and update rowErrors
  const validateAllRows = (rows: EmissionFactorData[]) => {
    const errors: Record<number, Record<string, string>> = {};
    rows.forEach((row, idx) => {
      const rowErrors = validateRow(row);
      if (Object.keys(rowErrors).length > 0) {
        errors[idx] = rowErrors;
        console.log(`Row ${idx} validation errors:`, rowErrors);
      } else {
        // Ensure this row has no errors in the state
        console.log(`Row ${idx} is valid`);
      }
    });
    console.log(`Total validation errors:`, Object.keys(errors).length);
    console.log(`Current rowErrors state:`, rowErrors);
    setRowErrors(errors);
    return errors;
  };

  // Helper function to clear errors for a specific row
  const clearRowErrors = (rowIndex: number) => {
    setRowErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[rowIndex];
      return newErrors;
    });
  };

  // Helper function to check if import should be enabled
  const isImportEnabled = () => {
    const hasErrors = Object.keys(rowErrors).length > 0;
    const hasRows = csvRows.length > 0;
    const isNotImporting = !importing;
    
    // More detailed debugging
    const errorDetails = Object.entries(rowErrors).map(([rowIndex, errors]) => ({
      rowIndex: parseInt(rowIndex),
      errorCount: Object.keys(errors).length,
      errors: errors
    }));
    
    console.log('Import button state:', {
      hasErrors,
      hasRows,
      isNotImporting,
      rowErrorsCount: Object.keys(rowErrors).length,
      csvRowsCount: csvRows.length,
      importing,
      errorDetails
    });
    
    // Additional validation: check if any row actually has errors
    const actualErrors = errorDetails.filter(detail => detail.errorCount > 0);
    const hasActualErrors = actualErrors.length > 0;
    
    console.log('Actual error analysis:', {
      hasActualErrors,
      actualErrors
    });
    
    // Additional check: verify that the errors in state are actually valid
    let hasValidErrors = false;
    if (hasActualErrors) {
      hasValidErrors = actualErrors.some(detail => {
        const rowIndex = detail.rowIndex;
        if (rowIndex >= 0 && rowIndex < csvRows.length) {
          const row = csvRows[rowIndex];
          const actualRowErrors = validateRow(row);
          return Object.keys(actualRowErrors).length > 0;
        }
        return false;
      });
    }
    
    console.log('Validation verification:', {
      hasValidErrors,
      shouldEnable: !hasValidErrors && hasRows && isNotImporting
    });
    
    return !hasValidErrors && hasRows && isNotImporting;
  };

  // Debug function to refresh validation
  const refreshValidation = () => {
    console.log('Manually refreshing validation...');
    if (csvRows.length > 0) {
      validateAllRows(csvRows);
    }
  };

  // Function to check if a specific row has validation errors
  const hasRowValidationErrors = (rowIndex: number): boolean => {
    return rowErrors[rowIndex] && Object.keys(rowErrors[rowIndex]).length > 0;
  };

  // Function to get validation errors for a specific row
  const getRowValidationErrors = (rowIndex: number): Record<string, string> => {
    return rowErrors[rowIndex] || {};
  };

  // Function to clear all validation errors
  const clearAllValidationErrors = () => {
    console.log('Clearing all validation errors...');
    setRowErrors({});
  };

  // Function to force validation refresh
  const forceValidationRefresh = () => {
    console.log('Forcing validation refresh...');
    if (csvRows.length > 0) {
      // Clear existing errors first
      setRowErrors({});
      // Then re-validate
      setTimeout(() => validateAllRows(csvRows), 100);
    }
  };

  // Function to check if validation state is consistent
  const isValidationStateConsistent = (): boolean => {
    if (csvRows.length === 0) return true;
    
    const currentErrors = validateAllRows(csvRows);
    const stateErrors = rowErrors;
    
    const currentErrorKeys = Object.keys(currentErrors);
    const stateErrorKeys = Object.keys(stateErrors);
    
    if (currentErrorKeys.length !== stateErrorKeys.length) {
      console.log('Validation state inconsistency detected:');
      console.log('Current validation errors:', currentErrorKeys);
      console.log('State validation errors:', stateErrorKeys);
      return false;
    }
    
    // Check if the error keys match
    for (const key of currentErrorKeys) {
      if (!stateErrorKeys.includes(key)) {
        console.log(`Validation state inconsistency: key ${key} missing from state`);
        return false;
      }
    }
    
    return true;
  };

  // Function to manually validate a specific row
  const validateSpecificRow = (rowIndex: number) => {
    if (rowIndex >= 0 && rowIndex < csvRows.length) {
      const row = csvRows[rowIndex];
      console.log(`Manually validating row ${rowIndex}:`, row);
      
      const errors = validateRow(row);
      console.log(`Row ${rowIndex} validation result:`, errors);
      
      if (Object.keys(errors).length > 0) {
        setRowErrors(prev => ({ ...prev, [rowIndex]: errors }));
      } else {
        // Clear errors for this row if it's valid
        setRowErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[rowIndex];
          return newErrors;
        });
      }
      
      return errors;
    }
    return {};
  };

  // Function to ensure validation state is clean and consistent
  const ensureCleanValidationState = () => {
    console.log('Ensuring clean validation state...');
    
    if (csvRows.length === 0) {
      setRowErrors({});
      return;
    }
    
    // Clear all existing errors
    setRowErrors({});
    
    // Re-validate all rows
    setTimeout(() => {
      validateAllRows(csvRows);
    }, 100);
  };

  // Function to automatically fix validation state inconsistencies
  const autoFixValidationState = () => {
    console.log('Auto-fixing validation state inconsistencies...');
    
    if (csvRows.length === 0) {
      setRowErrors({});
      return;
    }
    
    // Re-validate all rows and update state
    const newErrors: Record<number, Record<string, string>> = {};
    
    csvRows.forEach((row, idx) => {
      const rowErrors = validateRow(row);
      if (Object.keys(rowErrors).length > 0) {
        newErrors[idx] = rowErrors;
      }
    });
    
    console.log('Auto-fix result:', {
      oldErrorCount: Object.keys(rowErrors).length,
      newErrorCount: Object.keys(newErrors).length,
      newErrors
    });
    
    setRowErrors(newErrors);
  };

  // Function to perform comprehensive validation check and fix
  const comprehensiveValidationCheck = () => {
    console.log('Performing comprehensive validation check...');
    
    if (csvRows.length === 0) {
      setRowErrors({});
      return;
    }
    
    // Step 1: Clear all existing errors
    setRowErrors({});
    
    // Step 2: Re-validate all rows
    setTimeout(() => {
      const newErrors: Record<number, Record<string, string>> = {};
      
      csvRows.forEach((row, idx) => {
        const rowErrors = validateRow(row);
        if (Object.keys(rowErrors).length > 0) {
          newErrors[idx] = rowErrors;
          console.log(`Row ${idx} has ${Object.keys(rowErrors).length} validation errors:`, rowErrors);
        } else {
          console.log(`Row ${idx} is valid`);
        }
      });
      
      console.log('Comprehensive validation result:', {
        totalRows: csvRows.length,
        rowsWithErrors: Object.keys(newErrors).length,
        newErrors
      });
      
      setRowErrors(newErrors);
      
      // Step 3: Verify Import button state
      setTimeout(() => {
        const shouldBeEnabled = isImportEnabled();
        console.log('Final Import button state after comprehensive check:', shouldBeEnabled);
      }, 100);
    }, 100);
  };

  // Function to ensure Import button is in correct state
  const ensureImportButtonState = () => {
    console.log('Ensuring Import button is in correct state...');
    
    if (csvRows.length === 0) {
      console.log('No CSV rows, Import button should be disabled');
      return;
    }
    
    // Check current validation state
    const currentErrors = Object.keys(rowErrors).length;
    const shouldBeEnabled = isImportEnabled();
    
    console.log('Import button state check:', {
      currentErrors,
      shouldBeEnabled,
      csvRowsCount: csvRows.length
    });
    
    if (!shouldBeEnabled && currentErrors === 0) {
      console.warn('Import button should be enabled but is not. Performing comprehensive check...');
      comprehensiveValidationCheck();
    } else if (shouldBeEnabled && currentErrors > 0) {
      console.warn('Import button should be disabled but is not. Clearing false errors...');
      ensureCleanValidationState();
    } else {
      console.log('Import button state is correct');
    }
  };

  // Final validation check function
  const finalValidationCheck = () => {
    console.log('Performing final validation check...');
    
    // Check if there are any false validation errors
    let hasFalseErrors = false;
    
    Object.keys(rowErrors).forEach(rowIndexStr => {
      const rowIndex = parseInt(rowIndexStr);
      if (rowIndex >= 0 && rowIndex < csvRows.length) {
        const row = csvRows[rowIndex];
        const actualErrors = validateRow(row);
        
        if (Object.keys(actualErrors).length === 0 && Object.keys(rowErrors[rowIndex] || {}).length > 0) {
          console.warn(`False validation errors detected for row ${rowIndex}`);
          hasFalseErrors = true;
        }
      }
    });
    
    if (hasFalseErrors) {
      console.warn('False validation errors detected, performing cleanup...');
      comprehensiveValidationCheck();
    } else {
      console.log('No false validation errors detected');
    }
  };

  // UI
  return (
    <div className="csv-manager">
      <div className="csv-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleDownloadTemplate}
        >
          Download CSV Template
        </button>
      </div>
      <div
        className="csv-dropzone"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        tabIndex={0}
        aria-label="Upload CSV file"
      >
        <input
          type="file"
          accept=".csv,text/csv"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <span>Drag & drop a CSV file here, or </span>
        <button
          type="button"
          className="btn btn-link"
          onClick={() => fileInputRef.current?.click()}
        >
          click to select
        </button>
      </div>
      {errorMsg && <div className="csv-error">{errorMsg}</div>}
      
      {/* CSV Structure Information */}
      <div className="csv-info">
        <h4>Expected CSV Structure:</h4>
        <p>Your CSV should have the following columns in order:</p>
        <div className="csv-columns">
          {emissionFactorFields.map((field, index) => (
            <span key={field.key} className="csv-column">
              {index + 1}. {field.label}
            </span>
          ))}
        </div>
        <p><strong>Note:</strong> The first row should contain headers, and subsequent rows should contain data.</p>
      </div>
      
      {/* Use unified table component */}
      {csvRows.length > 0 && (
        <EmissionFactorTable
          data={csvRows}
          selectedRows={selectedRows}
          onRowSelect={toggleRowSelect}
          onSelectAll={selectAll}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onBulkDelete={deleteSelected}
          isDeleting={isDeleting}
          showBulkDelete={true}
          tableType="csv"
          rowErrors={rowErrors}
        />
      )}
      
      {csvRows.length > 0 && (
        <div className="csv-import-actions">
          <div className="csv-import-info">
            <span>Ready to import {csvRows.length} emission factor{csvRows.length > 1 ? 's' : ''}</span>
          </div>
          <button
            className="btn btn-primary"
            onClick={handleImport}
            disabled={!isImportEnabled()}
          >
            {importing ? (
              <>
                <span className="spinner"></span>
                Importing... {Math.round(importProgress)}%
              </>
            ) : (
              'Import'
            )}
          </button>
          {importing && (
            <div className="csv-progress-bar">
              <div className="csv-progress-container">
                <div className="csv-progress" style={{ width: `${importProgress}%` }}></div>
              </div>
              <span className="csv-progress-text">Importing... {Math.round(importProgress)}%</span>
            </div>
          )}
          {importResult && (
            <div className="csv-import-result">
              <FaCheck className="csv-success" />
              {importResult.added} added, {importResult.failed} failed.
            </div>
          )}
        </div>
      )}

      {/* Edit Modal - now using the unified EditEmissionFactorModal */}
      <EditEmissionFactorModal
        isOpen={showEditModal}
        onClose={closeEditModal}
        factor={editingFactor}
        onUpdate={async (updatedFactor) => {
          // Update the CSV row data
          if (editRowIdx !== null) {
            console.log('Updating row at index:', editRowIdx);
            console.log('Updated factor data:', updatedFactor);
            
            const updatedRows = [...csvRows];
            updatedRows[editRowIdx] = updatedFactor;
            setCsvRows(updatedRows);
            
            // Clear any existing errors for this row first
            clearRowErrors(editRowIdx);
            
            // Wait a bit for state to update, then re-validate
            setTimeout(() => {
              console.log('Re-validating after edit...');
              
              // First, validate just the updated row
              const rowErrors = validateRow(updatedFactor);
              console.log(`Row ${editRowIdx} validation result:`, rowErrors);
              
              if (Object.keys(rowErrors).length > 0) {
                // Set errors for this specific row
                setRowErrors(prev => ({ ...prev, [editRowIdx]: rowErrors }));
                console.log('Setting validation errors for edited row');
              } else {
                // Ensure this row has no errors
                setRowErrors(prev => {
                  const newErrors = { ...prev };
                  delete newErrors[editRowIdx];
                  return newErrors;
                });
                console.log('Clearing validation errors for edited row');
              }
              
              // Then validate all rows to ensure consistency
              validateAllRows(updatedRows);
              
              // Final check: ensure the Import button state is correct
              setTimeout(() => {
                const shouldBeEnabled = isImportEnabled();
                console.log('Final Import button state check:', shouldBeEnabled);
                
                if (!shouldBeEnabled && Object.keys(rowErrors).length === 0) {
                  console.warn('Import button should be enabled but is not. Auto-fixing...');
                  autoFixValidationState();
                }
                
                              // Additional check: ensure Import button state is correct
              ensureImportButtonState();
              
              // Final validation check to ensure complete cleanup
              finalValidationCheck();
            }, 200);
          }, 100);
          
          closeEditModal();
        }
      }}
        ghgStandards={[
          "GHG Protocol",
          "GRI Standards", 
          "ISO 14064",
          "IFRS - ISSB",
          "Custom"
        ]}
      />
    </div>
  );
};

export default EmissionFactorCSVManager; 