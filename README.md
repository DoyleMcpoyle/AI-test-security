# AI CCTV - Test Security Investigation Platform

A comprehensive video surveillance and investigation platform designed to help test security investigators identify and review potential cheating incidents in testing center video recordings.

## Overview

This platform enables test security investigators to:
- Search and browse video recordings from testing centers worldwide
- Review AI-detected violations with timestamped navigation
- Adjudicate potential violations (confirm, reject, or escalate)
- Track investigation progress with comprehensive statistics
- Filter and search by location, date, violation type, and more

## Key Features

### 1. Dashboard
- Real-time statistics on videos, violations, and reviews
- Recent activity monitoring
- Quick access to flagged content

### 2. Video Management
- Browse all test session recordings
- Filter by program, testing center, date, and status
- View detailed metadata for each session
- Track violation counts and review progress

### 3. Video Player with Violation Timeline
- Standard video playback controls
- Clickable violation timestamps for instant navigation
- Side-by-side violation list with confidence scores
- Visual severity indicators (critical, high, medium, low)

### 4. Adjudication Workflow
- Review AI-detected violations
- Three decision options:
  - **Confirm**: Validate the AI detection
  - **Reject**: Dismiss false positives
  - **Escalate**: Flag for senior review
- Add investigation notes
- Track adjudication history

### 5. Advanced Search
- Multi-criteria search across all videos
- Filter by:
  - Date range
  - Testing program
  - Testing center location
  - Violation type
  - AI confidence threshold
  - Video status
- Keyword search across session IDs and metadata

### 6. Role-Based Access Control
Four user roles with different permissions:
- **Admin**: Full system access including user management
- **Internal Case Manager**: Access to all videos and investigations
- **Internal Investigator**: Can review and adjudicate violations
- **External Case Manager**: Limited to their organization's data

## Database Schema

### Core Tables
- **user_profiles**: User accounts with role-based access
- **programs**: Testing programs (SAT, GRE, MCAT, etc.)
- **testing_centers**: Physical testing locations worldwide
- **videos**: Video recordings with metadata
- **violation_types**: Categorized violation definitions
- **violations**: AI-detected incidents with timestamps
- **adjudications**: Investigator review decisions

### Sample Violation Types
- Mobile Phone Use (Critical)
- Unauthorized Notes (High)
- Verbal Communication (High)
- Suspicious Looking (Medium)
- Writing on Materials (Medium)
- Unauthorized Absence (Medium)
- Electronic Device (Critical)
- Suspicious Gestures (Low)

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase account (database is pre-configured)

### Authentication
To access the platform, you'll need to create a user account:

1. Click on the login screen
2. Use the sign-up option (if available) or contact an administrator
3. Roles are assigned during account creation

### Demo Data
The platform includes sample data:
- 4 testing programs
- 5 testing centers globally
- Multiple video recordings with various violation types
- Pre-detected violations with different confidence scores

## Usage Guide

### For Investigators

1. **Dashboard**: Start here to see overview statistics and recent activity

2. **Reviewing Videos**:
   - Navigate to "Videos" section
   - Use filters to find specific recordings
   - Click on a video to open the player

3. **Adjudicating Violations**:
   - In the video player, violations appear in the right panel
   - Click on a violation to select it
   - Click "Jump to Time" to view the moment in the video
   - Add notes (optional)
   - Choose: Confirm, Reject, or Escalate

4. **Searching**:
   - Use "Search" for advanced filtering
   - Combine multiple criteria
   - Filter by violation type and confidence threshold

### For Administrators

- Access "Users" section to view all platform users
- Monitor user roles and organizations
- Review system-wide statistics

## Technical Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth

## Security Features

- Row Level Security (RLS) on all database tables
- Role-based access control
- Organization-based data isolation for external users
- Secure authentication with Supabase

## Architecture Highlights

### Component Structure
```
src/
├── components/
│   ├── Auth/           # Authentication forms
│   ├── Dashboard/      # Overview and statistics
│   ├── Layout/         # Navigation and layout
│   ├── Search/         # Advanced search interface
│   ├── Users/          # User management
│   └── Videos/         # Video list and player
├── contexts/           # React contexts (Auth)
└── lib/               # Supabase client and types
```

### Key Design Patterns
- Context API for global state management
- Row Level Security for data access control
- Optimistic UI updates for better UX
- Modular component architecture

## Future Enhancements

Potential features for production deployment:
- Real-time AI processing integration
- Batch video upload
- Export reports to PDF/CSV
- Email notifications for critical violations
- Multi-language support
- Video annotation tools
- Integration with testing center management systems
- Advanced analytics and reporting dashboard

## Development

### Build for Production
```bash
npm run build
```

### Type Checking
```bash
npm run typecheck
```

### Linting
```bash
npm run lint
```

## Support

For technical support or feature requests, contact your system administrator.
