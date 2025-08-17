# Carbon Hub Setup Guide

This guide provides comprehensive setup instructions for the Carbon Hub application, which now runs entirely on the client-side using IndexedDB for data storage.

## Overview

Carbon Hub is a **client-side only application** that stores all data locally in your browser using IndexedDB. This means:

- ✅ **No backend server required**
- ✅ **Works completely offline**
- ✅ **All data stays on your device**
- ✅ **No internet connection needed**
- ✅ **Instant data access**

## Prerequisites

### System Requirements

- **Operating System**: Windows 10+, macOS 10.14+, or Linux
- **Node.js**: Version 18.0.0 or higher
- **Browser**: Modern browser with IndexedDB support
- **Memory**: At least 4GB RAM recommended
- **Storage**: At least 1GB free disk space

### Browser Compatibility

The application requires a modern browser with IndexedDB support:

| Browser | Minimum Version | Status          |
| ------- | --------------- | --------------- |
| Chrome  | 23+             | ✅ Full Support |
| Firefox | 16+             | ✅ Full Support |
| Safari  | 10+             | ✅ Full Support |
| Edge    | 12+             | ✅ Full Support |

## Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/49fenixng94/carbon_hub.git
cd carbon_hub
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Start Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## Configuration

### Environment Variables

Since this is a client-side application, **no environment variables are required**. The application automatically:

- Detects browser capabilities
- Initializes IndexedDB storage
- Sets up default data structures
- Configures session management

### Optional Environment Variables

If you want to customize the development experience, you can create a `.env.local` file:

```bash
# Development settings (optional)
NODE_ENV=development
NEXT_PUBLIC_APP_NAME=Carbon Hub
NEXT_PUBLIC_APP_VERSION=0.1.0
```

## Data Storage

### IndexedDB Structure

The application creates the following IndexedDB databases:

- **Database Name**: `CarbonHubDB`
- **Version**: 1
- **Object Stores**:
  - `emission_factors`: Emission factor data
  - `reporting_activities`: Activity reporting data
  - `ghg_reporting_standards`: GHG reporting standards

### Data Persistence

- **Automatic**: Data persists between browser sessions
- **Cross-tab**: Data is shared across browser tabs
- **Backup**: Export functionality for data portability
- **Cleanup**: Automatic data retention management

## Usage

### First Launch

1. **Open the application** in your browser
2. **Wait for initialization** (IndexedDB setup)
3. **Start with Stage 1** to add emission factors
4. **Proceed to Stage 2** for activity reporting
5. **View analytics** in Stage 3

### Data Management

#### Adding Emission Factors

1. Navigate to Stage 1
2. Use the form to add individual factors
3. Or import CSV files for bulk data
4. Validate data against schema requirements

#### Reporting Activities

1. Navigate to Stage 2
2. Create new reporting activities
3. Link activities to emission factors
4. View calculated emissions automatically

#### Analytics & Export

1. Navigate to Stage 3
2. View data visualizations
3. Export data for external reporting
4. Generate comprehensive reports

## Troubleshooting

### Common Issues

#### Data Not Loading

**Symptoms**: Empty tables, "No data" messages

**Solutions**:

1. Check browser console for errors
2. Verify IndexedDB is supported
3. Try refreshing the page
4. Clear browser data if necessary

#### Import/Export Issues

**Symptoms**: CSV import fails, export errors

**Solutions**:

1. Verify CSV format matches schema
2. Check file encoding (UTF-8)
3. Ensure all required fields present
4. Try with smaller datasets first

#### Performance Issues

**Symptoms**: Slow loading, unresponsive interface

**Solutions**:

1. Check browser memory usage
2. Export and clear old data
3. Close unnecessary browser tabs
4. Restart the application

### Browser-Specific Issues

#### Chrome/Edge

- **Issue**: IndexedDB quota exceeded
- **Solution**: Clear browsing data or increase quota

#### Firefox

- **Issue**: Private browsing mode limitations
- **Solution**: Use normal browsing mode

#### Safari

- **Issue**: IndexedDB not available
- **Solution**: Update to Safari 10+ or use different browser

## Development

### Local Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint
```

### Code Structure

```
src/
├── app/                 # Next.js app router
├── components/          # React components
├── config/             # Configuration schemas
├── i18n/               # Internationalization
├── lib/                # Utility libraries
└── types/              # TypeScript definitions
```

### Key Components

- **Stage1**: Emission factor management
- **Stage2**: Activity reporting
- **Stage3**: Analytics dashboard
- **IndexedDB Service**: Data persistence layer
- **Session Manager**: User session handling

## Security Considerations

### Data Privacy

- **Local Storage**: All data remains on your device
- **No Network**: No data transmitted to external servers
- **Browser Security**: Subject to browser security policies

### Best Practices

- **Regular Backups**: Export data periodically
- **Browser Updates**: Keep browser updated for security
- **Private Data**: Be cautious with sensitive information

## Support

### Getting Help

1. **Check this guide** for common solutions
2. **Review browser console** for error messages
3. **Check GitHub issues** for known problems
4. **Create new issue** if problem persists

### Reporting Issues

When reporting issues, include:

- Browser name and version
- Operating system
- Error messages from console
- Steps to reproduce
- Expected vs actual behavior

## Migration from MongoDB

If you're migrating from the previous MongoDB version:

1. **Export existing data** from MongoDB
2. **Convert to CSV format** if needed
3. **Import into new application** using Stage 1
4. **Verify data integrity** before deleting old system

For detailed migration instructions, see [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md).

## Conclusion

Carbon Hub is designed to be simple to set up and use. The client-side architecture eliminates the need for complex backend infrastructure while providing robust data management capabilities.

If you encounter any issues during setup or usage, refer to the troubleshooting section above or create an issue in the repository.
