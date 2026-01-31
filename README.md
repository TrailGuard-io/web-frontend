# Web Frontend (Next.js + TypeScript + TailwindCSS)

## Description

TrailGuard Web Frontend is a modern React application built with Next.js, TypeScript, and TailwindCSS. It provides a user-friendly interface for the TrailGuard rescue management system, featuring authentication, dashboard, and rescue request functionality.

## Prerequisites

Before running this project, make sure you have the following installed:

- [Node.js](https://nodejs.org/) (version 16 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [TrailGuard Backend](https://github.com/your-repo/trailguard-backend) running locally

## Installation

1. **Clone the repository** (if not already done):

   ```bash
   git clone <repository-url>
   cd TrailGuard/web-frontend
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Set up environment variables**:

   ```bash
   cp env.example .env.local
   ```

   Edit the `.env.local` file with your configuration:

   ```env
   # API Configuration
   NEXT_PUBLIC_API_URL="http://localhost:3001"

   # Environment
   NODE_ENV=development
   ```

4. **Ensure the backend is running**:
   Make sure the TrailGuard backend is running on the port specified in your `NEXT_PUBLIC_API_URL` (default: `http://localhost:3001`).
   For Vercel production, set `NEXT_PUBLIC_API_URL` in the Vercel project environment variables
   (for example: `https://trailguardapi-q2zbx7653-gapbriels-projects.vercel.app`).

## Running the Application

### Development Mode

```bash
npm run dev
```

This will start the development server at `http://localhost:3000` with hot reloading enabled.

### Production Build

```bash
npm run build
npm start
```

This will create an optimized production build and start the server.

## Available Pages

The application includes the following pages:

- **Home** (`/`) - Landing page with application overview
- **Login** (`/login`) - User authentication page
- **Dashboard** (`/dashboard`) - Main dashboard with rescue management
- **Rescue** (`/rescue`) - Rescue request creation and management

## Features

### Authentication

- User registration and login
- JWT token-based authentication
- Protected routes

### Dashboard

- Overview of rescue requests
- User management (admin functionality)
- Real-time status updates

### Rescue Management

- Create new rescue requests with location data
- View and manage existing rescue requests
- Interactive map integration with Leaflet

### Internationalization

- Multi-language support (English, Spanish, and Portuguese)
- Dynamic language switching

## Project Structure

```
web-frontend/
├── components/           # Reusable React components
│   └── Header.tsx       # Navigation header component
├── pages/               # Next.js pages (routing)
│   ├── _app.tsx         # App wrapper and global styles
│   ├── index.tsx        # Home page
│   ├── login.tsx        # Authentication page
│   ├── dashboard.tsx    # Main dashboard
│   └── rescue.tsx       # Rescue management page
├── public/              # Static assets
│   ├── images/          # Image assets
│   └── locales/         # Translation files
├── store/               # State management (Zustand)
│   ├── useAppStore.ts   # Main application store
│   └── user.ts          # User state management
├── styles/              # Global styles
│   └── globals.css      # Global CSS and Tailwind imports
├── package.json         # Dependencies and scripts
├── tailwind.config.js   # TailwindCSS configuration
├── next.config.js       # Next.js configuration
└── tsconfig.json        # TypeScript configuration
```

## Key Technologies

- **Next.js 14** - React framework with SSR/SSG capabilities
- **TypeScript** - Type-safe JavaScript
- **TailwindCSS** - Utility-first CSS framework
- **Zustand** - Lightweight state management
- **Leaflet** - Interactive maps
- **React i18next** - Internationalization
- **React Toastify** - Toast notifications

## Development

### Code Style

- Follow TypeScript best practices
- Use functional components with hooks
- Implement proper error handling
- Follow the existing component structure

### Adding New Pages

1. Create a new file in the `pages/` directory
2. Export a default React component
3. Add any necessary routing logic

### Adding New Components

1. Create a new file in the `components/` directory
2. Use TypeScript interfaces for props
3. Follow the existing component patterns

### State Management

- Use Zustand for global state
- Keep component state local when possible
- Follow the existing store patterns

## Internationalization

The application supports multiple languages through `react-i18next`. Translation files are located in `public/locales/`.

### Adding New Languages

1. Create a new language folder in `public/locales/`
2. Add translation files (e.g., `common.json`)
3. Update the i18n configuration

### Adding New Translations

1. Add keys to the appropriate language files
2. Use the `useTranslation` hook in components
3. Follow the existing translation patterns

## API Integration

The frontend communicates with the TrailGuard backend API. Make sure the backend is running and the `NEXT_PUBLIC_API_URL` is correctly configured.

### API Endpoints Used

- Authentication: `/auth/login`, `/auth/register`, `/auth/me`
- Users: `/users`
- Rescues: `/rescues`

## Troubleshooting

### Common Issues

1. **Backend connection error**: Ensure the backend is running and the API URL is correct in `.env.local`.

2. **Port already in use**: The default port is 3000. Change it by running `npm run dev -- -p 3001`.

3. **Build errors**: Clear the `.next` folder and node_modules, then reinstall dependencies.

4. **TypeScript errors**: Run `npx tsc --noEmit` to check for type errors.

5. **TailwindCSS not working**: Ensure PostCSS and TailwindCSS are properly configured.

### Development Tips

- Use the browser's developer tools for debugging
- Check the Network tab for API request issues
- Use React Developer Tools for component debugging
- Monitor the console for error messages

## Deployment

### Vercel (Recommended)

1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms

1. Build the application: `npm run build`
2. Start the production server: `npm start`
3. Configure your hosting platform accordingly

## Contributing

1. Follow the existing code style and patterns
2. Test your changes thoroughly
3. Update documentation as needed
4. Create a pull request with a clear description of changes
5. Ensure all TypeScript types are properly defined
