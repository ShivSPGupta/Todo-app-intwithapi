import React, { useEffect } from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import store from './store/store';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import ToDo from './components/ToDo';
import Login from './components/Login';
import { auth } from './firebase/config';
import { setAuthState } from './features/authSlice';
import { fetchTasks, resetTasks } from './features/taskSlice';

const AuthBootstrap = ({ children }) => {
  const dispatch = useDispatch();
  const authResolved = useSelector((state) => state.auth.authResolved);
  const userId = useSelector((state) => state.auth.user?.uid);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      dispatch(setAuthState(
        user
          ? {
              uid: user.uid,
              email: user.email,
            }
          : null,
      ));
    });

    return unsubscribe;
  }, [dispatch]);

  useEffect(() => {
    if (!authResolved) {
      return;
    }

    if (userId) {
      dispatch(fetchTasks());
      return;
    }

    dispatch(resetTasks());
  }, [authResolved, dispatch, userId]);

  if (!authResolved) {
    return (
      <div className="todo-page">
        <div className="todo-aurora" aria-hidden="true" />
        <div className="container min-vh-100 d-flex align-items-center justify-content-center position-relative">
          <div className="text-center">
            <div className="spinner-border text-primary mb-3" role="status" aria-hidden="true" />
            <div className="text-muted">Checking your workspace...</div>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

const PrivateRoute = ({ element }) => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  return isAuthenticated ? element : <Navigate to="/login" replace />;
};

const PublicOnlyRoute = ({ element }) => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  return isAuthenticated ? <Navigate to="/" replace /> : element;
};

function App() {
  return (
    <Provider store={store}>
      <AuthBootstrap>
        <Router>
          <Routes>
            <Route path="/" element={<PrivateRoute element={<ToDo />} />} />
            <Route path="/login" element={<PublicOnlyRoute element={<Login />} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthBootstrap>
    </Provider>
  );
}

export default App;
