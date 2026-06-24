# Advanced To-Do App

## Overview
This project is a modern productivity workspace built with React, Redux Toolkit, Vite, Firebase Auth, and Cloud Firestore. It moves beyond a basic to-do list by combining structured task workflows, smart prioritization, weather-aware planning, protected routes, and a polished responsive UI.

## Core Features
- **Cloud authentication**: Email/password sign up and login with Firebase Authentication.
- **Password reset flow**: Users can request a reset email directly from the login screen.
- **Protected app access**: Only authenticated users can access the task dashboard.
- **Per-user task storage**: Every signed-in user works with their own Firestore task collection.
- **Structured task creation**: Each task supports title, priority, effort, due date, category, notes, status, and timestamps.
- **Task workflow states**: Tasks move through `Backlog`, `In Progress`, and `Done`.
- **Inline editing**: Update task details directly inside the task list.
- **Smart focus recommendation**: The dashboard recommends the next best task based on urgency, priority, effort, and task state.
- **Weather-aware planning**: Outdoor-related tasks trigger OpenWeather checks and adjust focus scoring when conditions are poor.
- **Task analytics**: Backlog, in-progress, completed, overdue, and progress metrics are shown at the top of the dashboard.
- **Search, filters, and sorting**: Filter by status, priority, and category, search by text, and sort by recommendation, priority, due date, status, or recency.
- **Clear completed tasks**: Bulk remove completed tasks from Firestore.
- **Responsive UI**: Login and dashboard layouts are optimized for desktop, tablet, and mobile screens.

## Auth Experience
- Sign in and create-account modes on a single polished auth screen
- Inline validation for email and password fields
- Confirm password flow during account creation
- Friendly Firebase error messages instead of raw SDK errors
- Password visibility toggle for password fields
- Password reset helper text and success/error feedback

## Task Experience
- New tasks are created in `Backlog` by default
- Marking a task complete moves it to `Done`
- Starting focus moves the top recommended task into `In Progress`
- Overdue logic is based on due date and unfinished status
- Weather scoring is only fetched for outdoor-related tasks

## Tech Stack
- **React 19**
- **Redux Toolkit**
- **React Router**
- **Firebase Authentication**
- **Cloud Firestore**
- **Axios**
- **Bootstrap 5**
- **Vite**

## Project Setup

### 1. Clone the repository
```sh
git clone https://github.com/ShivSPGupta/Todo-app-intwithapi.git
cd todo-app
```

### 2. Install dependencies
```sh
npm install
```

### 3. Create environment variables
Create a `.env` file in the project root and copy values from `.env.example`.

```sh
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_OPENWEATHER_API_KEY=your_openweather_api_key
VITE_OPENWEATHER_CITY=London
```

## Firebase Setup

### Authentication
In Firebase Console:
- Enable **Authentication**
- Turn on the **Email/Password** provider
- Add your local and deployed domains to **Authorized domains**

### Firestore
Create a **Cloud Firestore** database and use rules that restrict access to the signed-in user.

Example rules:
```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/tasks/{taskId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Password reset
For reset emails to work correctly:
- Email/Password auth must be enabled
- Your app domain must be listed in **Authorized domains**
- Firebase will send users back to the `/login` route after reset

## Running the App
Start the development server:

```sh
npm run dev
```

Default local URL:

```sh
http://localhost:5173/
```

## Available Scripts
- `npm run dev` - Start the Vite development server
- `npm run build` - Create a production build
- `npm run preview` - Preview the production build locally
- `npm run lint` - Run ESLint

## Implementation Notes
- Auth state is synchronized with Firebase using `onAuthStateChanged`
- Task data is fetched from Firestore after authentication resolves
- Firestore document ids are normalized and used as the single source of truth for task updates
- OpenWeather is used as a planning signal, not just as a decorative widget

## License
This project is licensed under the MIT License.
