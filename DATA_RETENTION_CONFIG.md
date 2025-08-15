# Data Retention Configuration Guide

## Overview

The Carbon Hub application includes a comprehensive data retention system that automatically manages user data based on inactivity periods. This system ensures data security while providing users with control over their information.

## How It Works

1. **Local Storage**: User input data is stored locally in the browser's IndexedDB
2. **Inactivity Detection**: The system tracks user activity (mouse movements, clicks, form inputs, etc.)
3. **Retention Popup**: After a configurable period of inactivity, a modal popup appears
4. **User Choice**: Users can either extend their session or clear all data
5. **Auto-Deletion**: If no response is given within a configurable time, data is automatically deleted

## Configuration

### Primary Configuration File

All timing configurations are located in `src/lib/sessionManager.ts` in the `SessionManager` class.

### Timing Intervals

#### 1. Inactivity Timeout (`INACTIVITY_TIMEOUT`)

**Purpose**: How long to wait before showing the retention popup after the user's last action.

**Default Value**: 20 minutes (20 _ 60 _ 1000 milliseconds)

**To Change**:

```typescript
// In src/lib/sessionManager.ts, around line 35
private readonly INACTIVITY_TIMEOUT = 20 * 60 * 1000; // 20 minutes in milliseconds

// Change to your desired value, for example:
private readonly INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
private readonly INACTIVITY_TIMEOUT = 60 * 60 * 1000; // 1 hour
private readonly INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes
```

#### 2. Modal Timeout (`MODAL_TIMEOUT`)

**Purpose**: How long the user has to respond to the popup before automatic data deletion.

**Default Value**: 10 minutes (10 _ 60 _ 1000 milliseconds)

**To Change**:

```typescript
// In src/lib/sessionManager.ts, around line 40
private readonly MODAL_TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds

// Change to your desired value, for example:
private readonly MODAL_TIMEOUT = 15 * 60 * 1000; // 15 minutes
private readonly MODAL_TIMEOUT = 5 * 60 * 1000;  // 5 minutes
private readonly MODAL_TIMEOUT = 20 * 60 * 1000; // 20 minutes
```

### Configuration Section

The configuration section in the code is clearly marked with comment blocks:

```typescript
// ============================================================================
// CONFIGURATION: Easily adjust timing intervals here
// ============================================================================

// INACTIVITY_TIMEOUT: How long to wait before showing the retention popup
// Default: 20 minutes (20 * 60 * 1000 milliseconds)
// To change: Modify the value below (e.g., 30 minutes = 30 * 60 * 1000)
private readonly INACTIVITY_TIMEOUT = 20 * 60 * 1000; // 20 minutes in milliseconds

// MODAL_TIMEOUT: How long the user has to respond to the popup before auto-deletion
// Default: 10 minutes (10 * 60 * 1000 milliseconds)
// To change: Modify the value below (e.g., 15 minutes = 15 * 60 * 1000)
private readonly MODAL_TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds

// ============================================================================
// END CONFIGURATION
// ============================================================================
```

## User Experience Features

### 1. Modal Behavior

- **Page Freezing**: While the modal is open, the rest of the page is completely frozen and shadowed
- **No Background Interaction**: Users cannot interact with the underlying UI
- **Visual Feedback**: Enhanced backdrop with blur effect and higher z-index

### 2. Countdown Timer

- **Visual Progress Bar**: Shows remaining time with color-coded progress
- **Real-time Updates**: Updates every second
- **Color Changes**: Progress bar changes color as time runs out (green → orange → red)

### 3. User Options

- **Need More Time**: Extends the session and resets the inactivity timer
- **Clear All Records**: Immediately deletes all user data from IndexedDB

## Technical Implementation

### Files Involved

1. **`src/lib/sessionManager.ts`** - Core session management and timing logic
2. **`src/components/InactivityModal.tsx`** - Modal UI component
3. **`src/app/page.tsx`** - Main page integration
4. **`src/app/globals.css`** - Modal styling and animations
5. **`src/lib/indexedDB.ts`** - Data storage and cleanup methods

### Key Methods

- `updateActivity()` - Resets timers when user is active
- `showInactivityWarning()` - Displays the retention popup
- `extendSession()` - Extends the session and resets timers
- `cleanupData()` - Clears all user data
- `getInactivityTimeout()` - Returns configured inactivity timeout
- `getModalTimeout()` - Returns configured modal timeout

### Activity Tracking

The system tracks the following user activities:

- Mouse movements and clicks
- Keyboard input
- Form interactions
- Scrolling
- Touch events

## Best Practices

### 1. Timing Considerations

- **Inactivity Timeout**: Should balance user convenience with data security
  - Too short: May frustrate users with frequent popups
  - Too long: May leave sensitive data exposed
- **Modal Timeout**: Should give users enough time to make a decision
  - Too short: Users may not have time to respond
  - Too long: Defeats the purpose of automatic cleanup

### 2. User Communication

- Clear messaging about what will happen
- Visual countdown to create urgency
- Easy-to-understand options
- Consistent terminology

### 3. Data Security

- Automatic cleanup ensures no data is left indefinitely
- Local storage only (no server-side data retention)
- Immediate deletion when requested

## Troubleshooting

### Common Issues

1. **Modal not appearing**: Check browser console for JavaScript errors
2. **Timers not working**: Verify that activity listeners are properly attached
3. **Data not clearing**: Check IndexedDB implementation and error handling

### Debug Information

The system includes comprehensive logging:

- Session creation and updates
- Timer events
- Data cleanup operations
- Error conditions

## Future Enhancements

Potential improvements to consider:

1. **Configurable Activity Events**: Allow customization of what constitutes "activity"
2. **Multiple Warning Levels**: Show warnings at different intervals
3. **Data Export Options**: Allow users to download their data before deletion
4. **Session Persistence**: Remember user preferences across sessions
5. **Admin Overrides**: Allow administrators to adjust settings for specific users

## Support

For technical support or questions about the data retention system, please refer to the main project documentation or contact the development team.
