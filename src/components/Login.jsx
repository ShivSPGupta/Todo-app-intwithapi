import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { clearAuthError, login, registerUser } from '../features/authSlice';

function Login() {
  const [mode, setMode] = useState('login');
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });
  const dispatch = useDispatch();
  const status = useSelector((state) => state.auth.status);
  const error = useSelector((state) => state.auth.error);

  const handleChange = (field, value) => {
    setCredentials((current) => ({
      ...current,
      [field]: value,
    }));

    if (error) {
      dispatch(clearAuthError());
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const payload = {
      email: credentials.email.trim(),
      password: credentials.password,
    };

    if (!payload.email || !payload.password) {
      return;
    }

    dispatch(mode === 'login' ? login(payload) : registerUser(payload));
  };

  const isLoading = status === 'loading';

  return (
    <div className="todo-page">
      <div className="todo-aurora" aria-hidden="true" />
      <div className="container py-5 position-relative">
        <div className="row justify-content-center align-items-center min-vh-100 py-4">
          <div className="col-12 col-md-11 col-lg-9">
            <div className="row g-0 overflow-hidden shadow-lg rounded-5 border border-white border-opacity-50 bg-white bg-opacity-75">
              <div className="col-lg-6 p-4 p-md-5 d-flex flex-column justify-content-between">
                <div>
                  <span className="badge rounded-pill text-bg-primary mb-3">Cloud Workspace</span>
                  <h1 className="display-6 fw-bold mb-3">Sign in to your live task dashboard.</h1>
                  <p className="text-muted mb-4">
                    Firebase Auth handles real users, and Firestore keeps each workspace synced to the right account.
                  </p>
                </div>

                <div className="row g-3 text-center">
                  <div className="col-4">
                    <div className="stat-card card border-0 shadow-sm h-100">
                      <div className="card-body py-3">
                        <div className="fw-bold">Cloud</div>
                        <div className="small text-muted">Storage</div>
                      </div>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="stat-card card border-0 shadow-sm h-100">
                      <div className="card-body py-3">
                        <div className="fw-bold">Secure</div>
                        <div className="small text-muted">Auth</div>
                      </div>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="stat-card card border-0 shadow-sm h-100">
                      <div className="card-body py-3">
                        <div className="fw-bold">Smart</div>
                        <div className="small text-muted">Planning</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-lg-6 p-4 p-md-5 bg-white">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body p-4 p-md-5">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <div>
                        <h2 className="h3 mb-1">{mode === 'login' ? 'Welcome back' : 'Create account'}</h2>
                        <p className="text-muted mb-0">
                          {mode === 'login' ? 'Use your account to continue.' : 'Start with email and password.'}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => {
                          setMode((current) => (current === 'login' ? 'register' : 'login'));
                          dispatch(clearAuthError());
                        }}
                      >
                        {mode === 'login' ? 'Sign up' : 'Sign in'}
                      </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                      <div className="mb-3">
                        <label htmlFor="emailInput" className="form-label">Email</label>
                        <input
                          id="emailInput"
                          type="email"
                          className="form-control"
                          placeholder="name@example.com"
                          value={credentials.email}
                          onChange={(event) => handleChange('email', event.target.value)}
                        />
                      </div>

                      <div className="mb-3">
                        <label htmlFor="passwordInput" className="form-label">Password</label>
                        <input
                          id="passwordInput"
                          type="password"
                          className="form-control"
                          placeholder="At least 6 characters"
                          value={credentials.password}
                          onChange={(event) => handleChange('password', event.target.value)}
                        />
                      </div>

                      {error && (
                        <div className="alert alert-warning" role="alert">
                          {error}
                        </div>
                      )}

                      <button type="submit" className="btn btn-primary btn-lg w-100" disabled={isLoading}>
                        {isLoading ? 'Working...' : mode === 'login' ? 'Enter dashboard' : 'Create workspace'}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
