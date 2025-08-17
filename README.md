# Carbon Hub

A comprehensive carbon footprint tracking and reporting application built with Next.js, React, and client-side IndexedDB storage. The application runs entirely offline with all data persisted in the user's browser.

## Features

- **Emission Factor Management**: Import, manage, and validate emission factors from CSV files
- **Activity Reporting**: Track and report carbon emissions from various activities
- **Multi-Scope Support**: Support for Scope 1, 2, and 3 emissions
- **Data Validation**: Comprehensive validation of emission factor data
- **Responsive Design**: Modern, mobile-friendly user interface
- **Offline-First**: Works completely offline with IndexedDB storage
- **Data Export/Import**: Backup and restore functionality for data portability
- **Multi-Language Support**: Internationalization with English and Chinese support

## Architecture

This application uses a **client-side only architecture** with the following key components:

- **Frontend**: Next.js 15 with React 19 and TypeScript
- **Storage**: IndexedDB for persistent client-side data storage
- **Styling**: Custom CSS framework with modern design principles
- **Internationalization**: next-intl for multi-language support
- **Charts**: Chart.js with react-chartjs-2 for data visualization

## Quick Start

### Prerequisites

- Node.js 18+
- Modern web browser with IndexedDB support

### Installation

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd carbon-hub
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Start the development server:**

   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### Stage 1: Emission Factors

- Import emission factors from CSV files
- Validate data against schema requirements
- Manage and edit emission factor data
- Export data for backup purposes

### Stage 2: Activity Reporting

- Create reporting activities with emission data
- Link activities to emission factors
- Calculate carbon emissions automatically
- Filter and manage activity data

### Stage 3: Analytics & Reporting

- Generate comprehensive carbon footprint reports
- View data visualizations and charts
- Export data for external reporting
- Analyze emission trends and patterns

## Data Management

### Storage

All data is stored locally in your browser using IndexedDB:

- **Emission Factors**: CO2e values, units, and metadata
- **Reporting Activities**: Activity data with calculated emissions
- **GHG Standards**: Reporting framework references

### Data Retention

The application implements automatic data cleanup:

- **Inactivity Timeout**: 20 minutes of inactivity triggers a warning
- **Auto-Cleanup**: 10 minutes after warning, data is automatically cleared
- **Session Extension**: Users can extend their session to prevent data loss

### Backup & Export

- Export all data as JSON for backup
- Import previously exported data
- CSV import for bulk emission factor data

## Development

### Project Structure

```
src/
├── app/                 # Next.js app router
│   ├── globals.css     # Global styles
│   └── layout.tsx      # Root layout
├── components/          # React components
│   ├── Stage1.tsx      # Emission factor management
│   ├── Stage2.tsx      # Activity reporting
│   ├── Stage3.tsx      # Analytics dashboard
│   └── ...             # Other components
├── config/             # Configuration schemas
├── i18n/               # Internationalization
├── lib/                # Utility libraries
│   ├── indexedDB.ts    # IndexedDB service layer
│   └── sessionManager.ts # Session management
└── types/              # TypeScript type definitions
```

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript with strict mode
- **UI Library**: React 19 with functional components
- **Storage**: IndexedDB for client-side persistence
- **Styling**: Custom CSS framework (no Tailwind)
- **Charts**: Chart.js with react-chartjs-2
- **Internationalization**: next-intl
- **Notifications**: react-hot-toast

## Browser Compatibility

The application requires a modern browser with IndexedDB support:

- Chrome 23+
- Firefox 16+
- Safari 10+
- Edge 12+

## Troubleshooting

### Data Not Loading

- Check browser console for IndexedDB errors
- Ensure browser supports IndexedDB
- Try clearing browser data and refreshing

### Import/Export Issues

- Verify CSV format matches expected schema
- Check file encoding (UTF-8 recommended)
- Ensure all required fields are present

### Performance Issues

- Large datasets may cause slower performance
- Consider exporting and clearing old data
- Check browser memory usage

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For issues and questions:

- Check the [SETUP.md](SETUP.md) file for detailed setup instructions
- Review the troubleshooting section above
- Create an issue in the repository

## Migration Notes

This application has been migrated from a MongoDB backend to a client-side IndexedDB architecture. The migration provides:

- **Offline functionality**: No internet connection required
- **Faster performance**: No network latency
- **Data privacy**: All data stays on your device
- **Simplified deployment**: No backend server needed

For migration details, see [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md).
