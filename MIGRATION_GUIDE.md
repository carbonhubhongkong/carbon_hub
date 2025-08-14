# Carbon Hub - MongoDB to Client-Side Storage Migration Guide

## Overview

This document outlines the complete migration of the Carbon Hub application from MongoDB backend storage to client-side IndexedDB storage. The application now runs entirely offline with all data persisted in the user's browser.

## Migration Summary

### What Changed

1. **Storage Layer**: Replaced MongoDB with IndexedDB
2. **API Routes**: Removed all backend API endpoints
3. **Data Access**: Updated all components to use IndexedDB service
4. **Dependencies**: Removed MongoDB package
5. **Session Management**: Updated to work with local storage
6. **Data Management**: Added export/import functionality for data backup

### Why IndexedDB?

- **Complex Data Structures**: Handles nested objects and relationships better than localStorage
- **Storage Limits**: Much higher storage capacity (typically 50MB+ vs 5-10MB)
- **Performance**: Better for complex queries and large datasets
- **Offline-First**: Designed for offline applications
- **Data Types**: Native support for JavaScript objects, dates, and arrays

## Technical Changes

### 1. New IndexedDB Service (`src/lib/indexedDB.ts`)

The service provides a unified interface for all data operations:

```typescript
// Key methods
await indexedDBService.addReportingActivity(activity);
await indexedDBService.getAllEmissionFactors();
await indexedDBService.updateEmissionFactor(factor);
await indexedDBService.deleteEmissionFactor(id);
await indexedDBService.exportData();
await indexedDBService.importData(backupData);
await indexedDBService.clearAllData();
```

### 2. Updated Components

All components now use IndexedDB instead of API calls:

- **Stage1**: Emission factor management
- **Stage2**: Reporting activities
- **Stage3**: Reports and charts
- **EditActivityModal**: Activity editing
- **EmissionFactorCSVManager**: CSV import/export

### 3. Removed Files

- `src/lib/mongodb.ts` - MongoDB connection logic
- `src/app/api/*` - All API route handlers
- MongoDB package from `package.json`

### 4. New Data Management Component

Added `DataManager` component for:

- Data export (JSON backup files)
- Data import (restore from backup)
- Clear all data functionality

## Data Structure

### IndexedDB Schema

```typescript
// Object Stores
- reporting_activities: { _id, reportingPeriodStart, reportingPeriodEnd, scope, category, activityName, location, quantity, emissionFactorId, remarks, calculatedEmissions }
- emission_factors: { _id, description, scope, category, location, unit, dataSource, methodType, co2ePerUnit, emissionFactorUnit, ghgReportingStandard, sourceOrDisclosureRequirement }
- ghg_reporting_standards: { _id, name }
```

### Indexes

- `scope`, `category`, `location` on both activities and factors
- `name` (unique) on standards

## Performance Impact

### Improvements

- **Faster Data Access**: No network latency
- **Offline Operation**: Works without internet connection
- **Reduced Bundle Size**: No MongoDB dependencies
- **Better User Experience**: Instant data operations

### Considerations

- **Storage Limits**: Subject to browser storage quotas
- **Data Persistence**: Data only available on the same device/browser
- **No Cross-Device Sync**: Data is local to the user's browser

## Data Migration

### From MongoDB

If you have existing MongoDB data, you can:

1. Export data from MongoDB using standard tools
2. Convert to the expected JSON format
3. Use the Data Manager to import the backup file

### Backup Format

```json
{
  "reporting_activities": [...],
  "emission_factors": [...],
  "ghg_reporting_standards": [...]
}
```

## Usage Instructions

### For Users

1. **Data Persistence**: All data is automatically saved to your browser
2. **Backup**: Use "Export Data" to create backup files
3. **Restore**: Use "Import Data" to restore from backup files
4. **Clear Data**: Use "Clear All Data" to reset the application

### For Developers

1. **Adding New Data Types**: Extend the IndexedDB service
2. **Data Validation**: Add validation in the service layer
3. **Error Handling**: Implement proper error handling for storage operations

## Browser Compatibility

- **Modern Browsers**: Full support (Chrome, Firefox, Safari, Edge)
- **Mobile Browsers**: Full support on modern mobile browsers
- **Private Browsing**: May have limited storage capacity

## Security Considerations

- **Data Privacy**: All data stays on the user's device
- **No Server Communication**: No data sent to external servers
- **Local Storage**: Subject to browser security policies

## Troubleshooting

### Common Issues

1. **Storage Quota Exceeded**: Clear some data or use export/import
2. **Data Not Persisting**: Check browser storage settings
3. **Import Failures**: Verify backup file format

### Debug Information

Check browser console for:

- IndexedDB initialization messages
- Data operation logs
- Error messages

## Future Enhancements

### Potential Improvements

1. **Data Compression**: Implement data compression for large datasets
2. **Incremental Sync**: Add cloud sync capabilities
3. **Data Validation**: Enhanced validation and error reporting
4. **Performance Monitoring**: Track storage performance metrics

## Conclusion

The migration successfully transforms Carbon Hub into a fully offline-capable application while maintaining all existing functionality. Users now have complete control over their data with the ability to backup, restore, and manage their information locally.

## Support

For technical support or questions about the migration:

1. Check browser console for error messages
2. Verify browser storage permissions
3. Test with a fresh browser profile
4. Review this migration guide for common solutions
