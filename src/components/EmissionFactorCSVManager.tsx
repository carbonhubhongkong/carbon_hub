import React, { useRef, useState } from 'react';
import Papa from 'papaparse';
import { emissionFactorFields } from '@/config/emissionFactorSchema';
import { FaExclamationTriangle, FaEdit, FaTrash, FaCheckCircle } from 'react-icons/fa';

// Helper: Generate CSV template (headers + example row)
function generateCSVTemplate() {
  const headers = emissionFactorFields.map(f => f.label);
  // Prefix each example value with 'e.g. '
  const example = emissionFactorFields.map(f => `e.g. ${f.example}`);
  return Papa.unparse({ fields: headers, data: [example] });
}

// Helper: Map CSV row to schema keys
function mapCSVRowToSchema(row: any) {
  const mapped: Record<string, any> = {};
  emissionFactorFields.forEach((field, idx) => {
    mapped[field.key] = row[idx] ?? '';
  });
  return mapped;
}

// Helper: Validate a row
function validateRow(row: Record<string, any>) {
  const errors: Record<string, string> = {};
  for (const field of emissionFactorFields) {
    const value = row[field.key];
    if (field.required && (value === undefined || value === '')) {
      errors[field.key] = 'Required';
      continue;
    }
    if (field.type === 'number' && value !== undefined && value !== '') {
      const num = Number(value);
      if (isNaN(num)) {
        errors[field.key] = 'Must be a number';
        continue;
      }
      if (field.validation?.min !== undefined && num < field.validation.min) {
        errors[field.key] = `Must be >= ${field.validation.min}`;
      }
      if (field.validation?.max !== undefined && num > field.validation.max) {
        errors[field.key] = `Must be <= ${field.validation.max}`;
      }
    }
    if (field.type === 'enum' && value !== undefined && value !== '') {
      if (!field.validation?.enumOptions?.includes(value)) {
        errors[field.key] = 'Invalid option';
      }
    }
    if (field.validation?.regex && value !== undefined && value !== '') {
      const re = new RegExp(field.validation.regex);
      if (!re.test(value)) {
        errors[field.key] = 'Invalid format';
      }
    }
  }
  return errors;
}

const EmissionFactorCSVManager: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvRows, setCsvRows] = useState<any[]>([]);
  const [rowErrors, setRowErrors] = useState<Record<number, Record<string, string>>>({});
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [editRowIdx, setEditRowIdx] = useState<number | null>(null);
  const [editRowData, setEditRowData] = useState<any>({});
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{ added: number; failed: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Download CSV template
  const handleDownloadTemplate = () => {
    const csv = generateCSVTemplate();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'emission_factor_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handle file input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setErrorMsg('Please upload a valid CSV file.');
      return;
    }
    parseCSV(file);
  };

  // Drag-and-drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setErrorMsg('Please upload a valid CSV file.');
      return;
    }
    parseCSV(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // Parse CSV
  const parseCSV = (file: File) => {
    Papa.parse(file, {
      complete: (results: Papa.ParseResult<string[]>) => {
        const [header, ...rows] = results.data as string[][];
        // Validate header
        const expectedHeaders = emissionFactorFields.map(f => f.label);
        if (!header || header.length !== expectedHeaders.length || !header.every((h, i) => h.trim() === expectedHeaders[i])) {
          setErrorMsg('CSV headers do not match the required template.');
          return;
        }
        // Map and validate rows
        const mappedRows = rows.map(mapCSVRowToSchema);
        const errors: Record<number, Record<string, string>> = {};
        mappedRows.forEach((row, idx) => {
          const rowErr = validateRow(row);
          if (Object.keys(rowErr).length > 0) errors[idx] = rowErr;
        });
        setCsvRows(mappedRows);
        setRowErrors(errors);
        setSelectedRows(new Set());
        setErrorMsg(null);
      },
      error: () => setErrorMsg('Failed to parse CSV file.'),
      skipEmptyLines: true,
    });
  };

  // Edit modal logic
  const openEditModal = (idx: number) => {
    setEditRowIdx(idx);
    setEditRowData({ ...csvRows[idx] });
  };
  const closeEditModal = () => {
    setEditRowIdx(null);
    setEditRowData({});
  };
  const handleEditChange = (key: string, value: any) => {
    setEditRowData((prev: any) => ({ ...prev, [key]: value }));
  };
  const saveEditRow = () => {
    if (editRowIdx === null) return;
    const newRows = [...csvRows];
    newRows[editRowIdx] = editRowData;
    setCsvRows(newRows);
    // Re-validate
    const errors = validateRow(editRowData);
    setRowErrors(prev => {
      const newErrs = { ...prev };
      if (Object.keys(errors).length > 0) newErrs[editRowIdx] = errors;
      else delete newErrs[editRowIdx];
      return newErrs;
    });
    closeEditModal();
  };

  // Row selection
  const toggleRowSelect = (idx: number) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(idx)) newSet.delete(idx);
      else newSet.add(idx);
      return newSet;
    });
  };
  const selectAll = () => {
    setSelectedRows(new Set(csvRows.map((_, idx) => idx)));
  };
  const deselectAll = () => {
    setSelectedRows(new Set());
  };
  const deleteSelected = () => {
    const newRows = csvRows.filter((_, idx) => !selectedRows.has(idx));
    setCsvRows(newRows);
    // Re-index errors
    const newErrors: Record<number, Record<string, string>> = {};
    Object.entries(rowErrors).forEach(([idx, err]) => {
      const newIdx = Number(idx);
      if (!selectedRows.has(newIdx)) newErrors[newRows.indexOf(csvRows[newIdx])] = err;
    });
    setRowErrors(newErrors);
    setSelectedRows(new Set());
  };

  // Import
  const handleImport = async () => {
    setImporting(true);
    setImportProgress(0);
    setImportResult(null);
    try {
      // For hundreds of rows, send all at once
      const res = await fetch('/api/emission-factors/factors/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: csvRows }),
      });
      const data = await res.json();
      setImportResult({ added: data.added, failed: data.failed });
      setImporting(false);
      setImportProgress(100);
      // Optionally, clear table or keep failed rows
      if (data.failed === 0) setCsvRows([]);
    } catch (e) {
      setErrorMsg('Import failed.');
      setImporting(false);
    }
  };

  // UI
  return (
    <div className="csv-manager">
      <div className="csv-actions">
        <button className="btn btn-secondary" onClick={handleDownloadTemplate}>
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
      {csvRows.length > 0 && (
        <div className="csv-table-container">
          <div className="csv-table-header">
            <button
              className="btn btn-danger"
              onClick={deleteSelected}
              disabled={selectedRows.size === 0}
              title="Delete selected rows"
              style={{ float: 'right' }}
            >
              <FaTrash /> Delete
            </button>
            <button
              className="btn btn-link"
              onClick={selectAll}
              style={{ marginRight: 8 }}
            >
              Select All
            </button>
            <button
              className="btn btn-link"
              onClick={deselectAll}
            >
              Deselect All
            </button>
          </div>
          <table className="csv-table">
            <thead>
              <tr>
                <th></th>
                {emissionFactorFields.map(f => (
                  <th key={f.key}>{f.label}</th>
                ))}
                <th></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {csvRows.map((row, idx) => {
                const errors = rowErrors[idx] || {};
                const isValid = Object.keys(errors).length === 0;
                return (
                  <tr key={idx} className={isValid ? 'csv-row-valid' : 'csv-row-invalid'}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedRows.has(idx)}
                        onChange={() => toggleRowSelect(idx)}
                        aria-label="Select row"
                      />
                    </td>
                    {emissionFactorFields.map(f => (
                      <td
                        key={f.key}
                        className={errors[f.key] ? 'csv-cell-error' : ''}
                        title={errors[f.key] || ''}
                      >
                        {row[f.key]}
                      </td>
                    ))}
                    <td>
                      {!isValid && <FaExclamationTriangle className="csv-caution" title="Row has errors" />}
                    </td>
                    <td>
                      <button
                        className="btn btn-small btn-secondary"
                        onClick={() => openEditModal(idx)}
                        aria-label="Edit row"
                      >
                        <FaEdit />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {csvRows.length > 0 && (
        <div className="csv-import-actions">
          <button
            className="btn btn-primary"
            onClick={handleImport}
            disabled={Object.keys(rowErrors).length > 0 || importing}
          >
            Import
          </button>
          {importing && (
            <div className="csv-progress-bar">
              <div className="csv-progress" style={{ width: `${importProgress}%` }}></div>
            </div>
          )}
          {importResult && (
            <div className="csv-import-result">
              <FaCheckCircle className="csv-success" />
              {importResult.added} added, {importResult.failed} failed.
            </div>
          )}
        </div>
      )}
      {/* Edit Modal */}
      {editRowIdx !== null && (
        <div className="csv-modal-overlay" onClick={closeEditModal}>
          <div className="csv-modal" onClick={e => e.stopPropagation()}>
            <h3>Edit Row</h3>
            <form
              onSubmit={e => {
                e.preventDefault();
                saveEditRow();
              }}
            >
              {emissionFactorFields.map(f => (
                <div className="form-group" key={f.key}>
                  <label>{f.label}</label>
                  {f.type === 'enum' ? (
                    <select
                      value={editRowData[f.key] || ''}
                      onChange={e => handleEditChange(f.key, e.target.value)}
                      required={f.required}
                    >
                      <option value="">Select</option>
                      {f.validation?.enumOptions?.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={f.type === 'number' ? 'number' : 'text'}
                      value={editRowData[f.key] || ''}
                      onChange={e => handleEditChange(f.key, e.target.value)}
                      required={f.required}
                    />
                  )}
                </div>
              ))}
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">Save</button>
                <button type="button" className="btn btn-secondary" onClick={closeEditModal}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmissionFactorCSVManager; 