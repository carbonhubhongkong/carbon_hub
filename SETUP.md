# Carbon Hub Setup Guide

## MongoDB Configuration

The application requires a MongoDB database to function properly. Since you already have a `.env.local` file, the application will automatically use it.

### Option 1: Local MongoDB Installation

1. **Install MongoDB Community Edition:**

   - Download from [MongoDB Download Center](https://www.mongodb.com/try/download/community)
   - Follow the installation instructions for your operating system

2. **Start MongoDB Service:**

   - Windows: MongoDB runs as a Windows service
   - macOS/Linux: `sudo systemctl start mongod`

3. **Verify Environment File:**
   Ensure your existing `.env.local` file contains:
   ```
   MONGODB_URI=mongodb://localhost:27017/carbon_hub
   NODE_ENV=development
   ```

### Option 2: MongoDB Atlas (Cloud)

1. **Create MongoDB Atlas Account:**

   - Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Create a free account and cluster

2. **Get Connection String:**

   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string

3. **Update Environment File:**
   Update your existing `.env.local` file with:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/carbon_hub?retryWrites=true&w=majority
   NODE_ENV=development
   ```
   Replace `username`, `password`, and `cluster.mongodb.net` with your actual values.

### Option 3: Use Fallback Storage (Development Only)

If you can't set up MongoDB immediately, the application will use in-memory storage as a fallback. This means:

- Data will be lost when you restart the application
- Some features may be limited
- Perfect for development and testing

## Running the Application

1. **Install Dependencies:**

   ```bash
   npm install
   ```

2. **Start Development Server:**

   ```bash
   npm run dev
   ```

3. **Access the Application:**
   Open [http://localhost:3000](http://localhost:3000) in your browser

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

## Database Collections

The application creates these collections automatically:

- `emission_factors`: Carbon emission factor data
- `reporting_activities`: User activity reporting data
- `general_factors`: General emission factors
- `calculation_methods`: Calculation methodology data
- `ghg_reporting_standards`: GHG reporting standards

## Security Notes

- Never commit `.env.local` files to version control
- Use strong passwords for MongoDB Atlas
- Consider using environment-specific configuration files
- Regularly update MongoDB and dependencies
