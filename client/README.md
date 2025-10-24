# React Frontend Client

Modern React application with Vite for interacting with the MERN Notes API using Google SSO.

## Features
- Google Sign-In (Google Identity Services)
- Protected notes dashboard (create, list, delete)
- Responsive design with Tailwind CSS
- Toast notifications for user feedback
-- Role-based UI rendering (optional)

## Tech Stack
- React 19 + Vite
- React Router DOM for routing
- Axios for API calls
- Tailwind CSS for styling
- React Toastify for notifications

## Environment Variables
Create `.env` file:
```
VITE_BACKEND_URL=http://localhost:4000
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

## Installation & Setup
```bash
npm install
npm run dev     # Development server
npm run build   # Production build
npm run preview # Preview production build
```

## Project Structure
```
client/
├── public/         # Static assets
├── src/
│   ├── assets/     # Images, icons
│   ├── components/ # Reusable components
│   ├── context/    # React context (auth state)
│   ├── pages/      # Page components
│   ├── App.jsx     # Main app component
│   └── main.jsx    # Entry point
├── index.html     # HTML template
└── vite.config.js # Vite configuration
```

## Pages & Features

### Authentication
- **Login Page** (`/login`) - Email/password (optional) + Google Sign-In button
- **Root** (`/`) - Notes dashboard for authenticated users

### Notes Dashboard
- Notes management (create, list, delete)
- User profile display
- Logout functionality

## Key Components

### AppContexts.jsx
- Manages authentication state
- Handles API calls with credentials
- Provides user data and auth status

### Pages
- **Home.jsx** - Notes dashboard
- **Login.jsx** - Authentication form with Google button

### Components
- **Navbar.jsx** - Navigation with user avatar and logout
- **Header.jsx** - Welcome header component

## UI/UX Features
- Responsive design (mobile-friendly)
- Clean, modern interface
- Toast notifications for feedback
- Loading states and error handling
- Role-based navigation and content
- Search and filtering capabilities

## Security
- JWT tokens handled via HTTP-only cookies
- Automatic redirects based on authentication status
- Secure API communication with backend
 
## Google Cloud Console
- OAuth 2.0 Client Type: Web application
- Authorized JavaScript origins:
  - `http://localhost:5173`
  - `https://your-production-domain.com`
- Authorized redirect URIs: not required for this token-based approach

## Development
- Hot reload with Vite
- ESLint configuration
- Tailwind CSS for styling
- Component-based architecture
