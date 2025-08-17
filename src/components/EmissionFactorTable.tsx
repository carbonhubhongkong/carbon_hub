'use client';

import React from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { useTranslations } from 'next-intl';
import { emissionFactorFields, EmissionFactorData } from '../config/emissionFactorSchema';

interface EmissionFactorTableProps {
  data: EmissionFactorData[];
  selectedRows: Set<string | number>;
  onRowSelect: (id: string | number, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onEdit: (factor: EmissionFactorData) => void;
  onDelete: (factor: EmissionFactorData) => void;
  onBulkDelete: () => void;
  isDeleting?: boolean;
  showBulkDelete?: boolean;
  tableType: 'csv' | 'saved';
  rowErrors?: Record<number, Record<string, string>>;
}

const EmissionFactorTable: React.FC<EmissionFactorTableProps> = ({
  data,
  selectedRows,
  onRowSelect,
  onSelectAll,
  onEdit,
  onDelete,
  onBulkDelete,
  isDeleting = false,
  showBulkDelete = true,
  tableType,
  rowErrors = {}
}) => {
  const t = useTranslations();
  const allSelected = data.length > 0 && selectedRows.size === data.length;
  const someSelected = selectedRows.size > 0;

  const getRowId = (item: EmissionFactorData, index: number) => {
    return tableType === 'csv' ? index : item._id!;
  };

  const hasRowErrors = (index: number) => {
    return tableType === 'csv' && Object.keys(rowErrors[index] || {}).length > 0;
  };

  const getCellClass = (index: number, fieldKey: string) => {
    if (tableType === 'csv' && rowErrors[index]?.[fieldKey]) {
      return 'csv-cell-error';
    }
    return '';
  };

  // Helper function to safely get field value
  const getFieldValue = (factor: EmissionFactorData, fieldKey: string): string | number => {
    switch (fieldKey) {
      case 'description':
        return factor.description;
      case 'scope':
        return factor.scope;
      case 'category':
        return factor.category;
      case 'location':
        return factor.location;
      case 'unit':
        return factor.unit;
      case 'dataSource':
        return factor.dataSource;
      case 'methodType':
        return factor.methodType;
      case 'co2ePerUnit':
        return factor.co2ePerUnit;
      case 'emissionFactorUnit':
        return factor.emissionFactorUnit;
      case 'ghgReportingStandard':
        return factor.ghgReportingStandard;
      case 'sourceOrDisclosureRequirement':
        return factor.sourceOrDisclosureRequirement;
      default:
        return 'N/A';
    }
  };

  return (
    <div className="table-container">
      {/* Bulk Actions */}
      {data.length > 0 && showBulkDelete && (
        <div className="bulk-actions">
          <div className="bulk-controls">
            <label className="select-all-checkbox">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => onSelectAll(e.target.checked)}
              />
              <span>{t('common.selectAll')}</span>
            </label>
            {someSelected && (
              <button
                type="button"
                onClick={onBulkDelete}
                className="btn btn-danger btn-small"
                disabled={isDeleting}
              >
                {isDeleting ? t('common.deleting') : t('common.deleteSelected', { count: selectedRows.size })}
              </button>
            )}
          </div>
        </div>
      )}
      
      <table className={`unified-table ${tableType === 'csv' ? 'csv-table' : 'data-table'}`}>
        <thead>
          <tr>
            <th className="checkbox-column">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => onSelectAll(e.target.checked)}
              />
            </th>
            {emissionFactorFields.map(f => (
              <th key={f.key}>{t(`stage1.formLabels.${f.key}`)}</th>
            ))}
            {tableType === 'csv' && <th></th>}
            <th>{t('common.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((factor, index) => {
            const rowId = getRowId(factor, index);
            const isSelected = selectedRows.has(rowId);
            const hasErrors = hasRowErrors(index);
            
            return (
              <tr 
                key={rowId} 
                className={tableType === 'csv' && hasErrors ? 'csv-row-invalid' : ''}
              >
                <td className="checkbox-column">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => onRowSelect(rowId, e.target.checked)}
                  />
                </td>
                {emissionFactorFields.map(f => (
                  <td
                    key={f.key}
                    className={getCellClass(index, f.key)}
                    title={tableType === 'csv' && rowErrors[index]?.[f.key] ? rowErrors[index][f.key] : ''}
                  >
                    {f.key === 'co2ePerUnit' 
                      ? `${factor.co2ePerUnit} ${factor.emissionFactorUnit}`
                      : f.key === 'sourceOrDisclosureRequirement' && factor.sourceOrDisclosureRequirement && /^https?:\/\//.test(factor.sourceOrDisclosureRequirement.trim())
                        ? <a href={factor.sourceOrDisclosureRequirement} target="_blank" rel="noopener noreferrer">{factor.sourceOrDisclosureRequirement}</a>
                        : getFieldValue(factor, f.key)
                    }
                  </td>
                ))}
                {tableType === 'csv' && (
                  <td>
                    {hasErrors && (
                      <span className="csv-caution" title={t('csvManager.rowHasErrors')}>⚠️</span>
                    )}
                  </td>
                )}
                <td className="actions-column">
                  <div className="action-buttons">
                    <button
                      onClick={() => onEdit(factor)}
                      className="btn btn-small btn-secondary"
                      title={t('common.editEmissionFactor')}
                    >
                      <FaEdit /> {t('common.edit')}
                    </button>
                    <button
                      onClick={() => onDelete(factor)}
                      className="btn btn-small btn-danger"
                      title={t('common.deleteEmissionFactor')}
                      disabled={isDeleting}
                    >
                      <FaTrash /> {t('common.delete')}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default EmissionFactorTable;
