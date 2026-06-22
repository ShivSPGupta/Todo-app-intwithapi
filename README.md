# Advanced To-Do App

## Overview
This is a dashboard-style productivity app built with React, Redux Toolkit, and Vite. It goes beyond a basic checklist with task metadata, workflow statuses, effort sizing, inline editing, smart task recommendations, filtering, due dates, completion analytics, authentication simulation, weather-aware planning, and persistent storage.

## Features
- **Task Management**: Add, remove, edit, and prioritize tasks with notes, due dates, effort, workflow status, and categories.
- **Smart Focus Queue**: Automatically recommends the next best task using priority, urgency, effort, workflow state, and weather suitability.
- **Workflow Tracking**: Move tasks through Backlog, In Progress, and Done without leaving the list.
- **Smart Filtering**: Search by text, filter by status, priority, or category, and sort by priority, due date, completion, or recency.
- **Progress Tracking**: See completion stats, overdue counts, and progress percentage at a glance.
- **Authentication Simulation**: Login/logout functionality using Redux state management.
- **Protected Routes**: To-Do list is only accessible to logged-in users.
- **Weather-Aware Planning**: Fetches live weather for outdoor tasks, scores suitability, and adjusts recommendations when conditions are poor.
- **Persistent Storage**: Tasks stored in localStorage and authentication status in sessionStorage.
- **Fully Responsive Design**: Built with Bootstrap for a mobile-first, responsive UI.
- **Vite for Fast Development**: Uses Vite for lightning-fast hot module replacement (HMR) and optimized builds.

## Installation & Setup
### 1. Clone the Repository
```sh
git clone https://github.com/ShivSPGupta/Todo-app-intwithapi.git
cd todo-app
```

### 2. Install Dependencies
```sh
npm install
```

### 3. Configure Weather API
Create a `.env.local` file in the project root and add your OpenWeather API key:
```sh
VITE_OPENWEATHER_API_KEY=your_openweather_api_key
VITE_OPENWEATHER_CITY=London
```

### 4. Run the Development Server
```sh
npm run dev
```

The app will be available at `http://localhost:5173/`.

## Available Scripts
- **`npm run dev`** - Starts the development server.
- **`npm run build`** - Builds the app for production.
- **`npm run preview`** - Serves the production build locally.

## Technologies Used
- **React.js**: Component-based UI library.
- **Redux Toolkit**: State management.
- **React Router**: Navigation and protected routes.
- **Bootstrap**: Responsive design.
- **OpenWeather API**: Powers context-aware outdoor task planning and recommendation scoring.
- **Vite**: Fast development and optimized builds.

## License
This project is licensed under the MIT License.
