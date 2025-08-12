# Carbon Hub

A comprehensive carbon footprint tracking and reporting application built with Next.js, React, and MongoDB.

## Features

- **Emission Factor Management**: Import, manage, and validate emission factors from CSV files
- **Activity Reporting**: Track and report carbon emissions from various activities
- **Multi-Scope Support**: Support for Scope 1, 2, and 3 emissions
- **Data Validation**: Comprehensive validation of emission factor data
- **Responsive Design**: Modern, mobile-friendly user interface

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (local or cloud)
- Existing `.env.local` file with MongoDB connection string

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

3. **Verify environment variables:**
   Ensure your existing `.env.local` file contains:

   ```bash
   MONGODB_URI=mongodb://localhost:27017/carbon_hub
   NODE_ENV=development
   ```

   **Note**: The application will automatically use your existing `.env.local` file.

4. **Start the development server:**

   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## MongoDB Setup

### Option 1: Local MongoDB

1. **Install MongoDB Community Edition:**

   - [Download MongoDB](https://www.mongodb.com/try/download/community)
   - Follow installation instructions for your OS

2. **Start MongoDB:**
   - Windows: MongoDB runs as a Windows service
   - macOS/Linux: `sudo systemctl start mongod`

### Option 2: MongoDB Atlas (Cloud)

1. **Create MongoDB Atlas Account:**

   - Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Create a free account and cluster

2. **Get Connection String:**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string

### Test MongoDB Connection

```bash
npm run test:mongodb
```

## Usage

### Stage 1: Emission Factors

- Import emission factors from CSV files
- Validate data against schema requirements
- Manage and edit emission factor data

### Stage 2: Activity Reporting

- Create reporting activities with emission data
- Link activities to emission factors
- Calculate carbon emissions automatically

### Stage 3: Reporting

- Generate comprehensive carbon footprint reports
- Export data for external reporting

## Troubleshooting

### "Failed to fetch activities" Error

This error occurs when:

- MongoDB is not running
- `MONGODB_URI` environment variable is not set in your `.env.local` file
- Network connectivity issues

**Solutions:**

1. Check if MongoDB is running
2. Verify your `.env.local` file contains the correct `MONGODB_URI`
3. Check network connectivity
4. Restart the development server after making changes

### Connection Status Indicators

The application shows connection status:

- **📱 Using Local Storage**: MongoDB unavailable, using fallback storage
- **⚠️ Connection Error**: Failed to connect to MongoDB
- **No indicator**: Successfully connected to MongoDB

### Environment File Issues

If you're having trouble with environment variables:

1. Ensure your `.env.local` file is in the project root directory
2. Check that the file contains `MONGODB_URI=your_connection_string`
3. Restart the development server after making changes
4. Verify the file is not being ignored by your editor or version control

## Development

### Project Structure

```
src/
├── app/                 # Next.js app router
│   ├── api/            # API endpoints
│   └── globals.css     # Global styles
├── components/          # React components
├── config/             # Configuration schemas
└── lib/                # Utility libraries
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

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
