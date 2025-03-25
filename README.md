# Advanced To-Do App

## Overview
This is an advanced To-Do application built with React, Redux Toolkit, and Vite. The app features task management with priority sorting, authentication simulation using Redux, weather integration for relevant tasks, and persistent storage for tasks and authentication status.

## Features
- **Task Management**: Add, remove, and prioritize tasks (High, Medium, Low).
- **Authentication Simulation**: Login/logout functionality using Redux state management.
- **Protected Routes**: To-Do list is only accessible to logged-in users.
- **Weather Integration**: Fetch weather data for outdoor-related tasks using OpenWeather API.
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

### 3. Run the Development Server
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
- **OpenWeather API**: Fetches weather data.
- **Vite**: Fast development and optimized builds.

## License
This project is licensed under the MIT License.