import React, { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { clearAuthError, login, registerUser, resetPassword } from '../features/authSlice';

const initialCredentials = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
};

const initialTouched = {
  fullName: false,
  email: false,
  password: false,
  confirmPassword: false,
};

const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);

function Login() {
  const [mode, setMode] = useState('login');
  const [credentials, setCredentials] = useState(initialCredentials);
  const [touched, setTouched] = useState(initialTouched);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const dispatch = useDispatch();
  const status = useSelector((state) => state.auth.status);
  const error = useSelector((state) => state.auth.error);
  const authMessage = useSelector((state) => state.auth.authMessage);

  const fieldErrors = useMemo(() => {
    const nextErrors = {};
    const email = credentials.email.trim();

    if (!email) {
      nextErrors.email = 'Email is required.';
    } else if (!validateEmail(email)) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (!credentials.password) {
      nextErrors.password = 'Password is required.';
    } else if (credentials.password.length < 6) {
      nextErrors.password = 'Use at least 6 characters.';
    }

    if (mode === 'register') {
      if (!credentials.fullName.trim()) {
        nextErrors.fullName = 'Full name is required.';
      }

      if (!credentials.confirmPassword) {
        nextErrors.confirmPassword = 'Please confirm your password.';
      } else if (credentials.confirmPassword !== credentials.password) {
        nextErrors.confirmPassword = 'Passwords do not match.';
      }
    }

    return nextErrors;
  }, [credentials, mode]);

  const handleChange = (field, value) => {
    setCredentials((current) => ({
      ...current,
      [field]: value,
    }));

    if (error || authMessage) {
      dispatch(clearAuthError());
    }
  };

  const handleBlur = (field) => {
    setTouched((current) => ({
      ...current,
      [field]: true,
    }));
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setCredentials(initialCredentials);
    setTouched(initialTouched);
    setShowPassword(false);
    setShowConfirmPassword(false);
    dispatch(clearAuthError());
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    setTouched({
      fullName: true,
      email: true,
      password: true,
      confirmPassword: mode === 'register',
    });

    if (Object.keys(fieldErrors).length > 0) {
      return;
    }

    const payload = {
      email: credentials.email.trim(),
      password: credentials.password,
    };

    dispatch(mode === 'login' ? login(payload) : registerUser(payload));
  };

  const handleForgotPassword = async () => {
    const email = credentials.email.trim();

    setTouched((current) => ({
      ...current,
      email: true,
    }));

    if (error || authMessage) {
      dispatch(clearAuthError());
    }

    if (!email || !validateEmail(email)) {
      return;
    }

    try {
      await dispatch(resetPassword({ email })).unwrap();
    } catch {
      // Slice state already stores the reset-password error for UI display.
    }
  };

  const isLoading = status === 'loading';

  return (
    <div className="todo-page auth-page">
      <div className="todo-aurora" aria-hidden="true" />
      <div className="container py-2 py-lg-3 position-relative">
        <div className="row justify-content-center align-items-center min-vh-100">
          <div className="col-12 col-xl-11">
            <div className="auth-shell shadow-lg">
              <div className="auth-hero">
                <div className="auth-badge">Productivity Workspace</div>
                <h1 className="auth-title">A modern task workspace built for planning, focus, and reliable execution.</h1>
                <p className="auth-copy">
                  Sign in to access your workspace or create a new account. Tasks are secured with Firebase Authentication and stored in Firestore for a structured cloud-backed workflow.
                </p>

                <div className="auth-highlight-grid">
                  <div className="auth-highlight-card">
                    <div className="auth-highlight-label">Cloud-backed</div>
                    <div className="auth-highlight-text">Task data is connected to authenticated user accounts and stored in Firestore.</div>
                  </div>
                  <div className="auth-highlight-card">
                    <div className="auth-highlight-label">Structured workflow</div>
                    <div className="auth-highlight-text">Tasks move through clear states with priority, effort, category, and due-date context.</div>
                  </div>
                  <div className="auth-highlight-card">
                    <div className="auth-highlight-label">Decision support</div>
                    <div className="auth-highlight-text">Weather-aware planning and focus guidance help surface the most relevant next task.</div>
                  </div>
                </div>
              </div>

              <div className="auth-panel">
                <div className="auth-mode-toggle mb-4" role="tablist" aria-label="Authentication mode">
                  <button
                    type="button"
                    className={`auth-mode-button ${mode === 'login' ? 'active' : ''}`}
                    onClick={() => switchMode('login')}
                  >
                    Sign in
                  </button>
                  <button
                    type="button"
                    className={`auth-mode-button ${mode === 'register' ? 'active' : ''}`}
                    onClick={() => switchMode('register')}
                  >
                    Create account
                  </button>
                </div>

                <div className="mb-4">
                  <h2 className="h3 mb-2">{mode === 'login' ? 'Welcome back' : 'Create your workspace'}</h2>
                  <p className="text-muted mb-0">
                    {mode === 'login'
                      ? 'Use your email and password to continue to the dashboard.'
                      : 'Create an account to start managing tasks in your cloud workspace.'}
                  </p>
                </div>

                <form onSubmit={handleSubmit} noValidate>
                  {mode === 'register' && (
                    <div className="mb-3">
                      <label htmlFor="fullNameInput" className="form-label">Full name</label>
                      <input
                        id="fullNameInput"
                        type="text"
                        className={`form-control ${touched.fullName && fieldErrors.fullName ? 'is-invalid' : ''}`}
                        placeholder="Your name"
                        value={credentials.fullName}
                        onChange={(event) => handleChange('fullName', event.target.value)}
                        onBlur={() => handleBlur('fullName')}
                      />
                      {touched.fullName && fieldErrors.fullName && <div className="invalid-feedback">{fieldErrors.fullName}</div>}
                    </div>
                  )}

                  <div className="mb-3">
                    <label htmlFor="emailInput" className="form-label">Email</label>
                    <input
                      id="emailInput"
                      type="email"
                      autoComplete="email"
                      className={`form-control ${touched.email && fieldErrors.email ? 'is-invalid' : ''}`}
                      placeholder="name@example.com"
                      value={credentials.email}
                      onChange={(event) => handleChange('email', event.target.value)}
                      onBlur={() => handleBlur('email')}
                    />
                    {touched.email && fieldErrors.email && <div className="invalid-feedback">{fieldErrors.email}</div>}
                  </div>

                  <div className="mb-3">
                    <label htmlFor="passwordInput" className="form-label">Password</label>
                    <div className="input-group">
                      <input
                        id="passwordInput"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                        className={`form-control ${touched.password && fieldErrors.password ? 'is-invalid' : ''}`}
                        placeholder="At least 6 characters"
                        value={credentials.password}
                        onChange={(event) => handleChange('password', event.target.value)}
                        onBlur={() => handleBlur('password')}
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setShowPassword((current) => !current)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                      {touched.password && fieldErrors.password && <div className="invalid-feedback d-block">{fieldErrors.password}</div>}
                    </div>
                  </div>

                  {mode === 'register' && (
                    <div className="mb-3">
                      <label htmlFor="confirmPasswordInput" className="form-label">Confirm password</label>
                      <div className="input-group">
                        <input
                          id="confirmPasswordInput"
                          type={showConfirmPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          className={`form-control ${touched.confirmPassword && fieldErrors.confirmPassword ? 'is-invalid' : ''}`}
                          placeholder="Repeat your password"
                          value={credentials.confirmPassword}
                          onChange={(event) => handleChange('confirmPassword', event.target.value)}
                          onBlur={() => handleBlur('confirmPassword')}
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => setShowConfirmPassword((current) => !current)}
                          aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                        >
                          {showConfirmPassword ? 'Hide' : 'Show'}
                        </button>
                        {touched.confirmPassword && fieldErrors.confirmPassword && (
                          <div className="invalid-feedback d-block">{fieldErrors.confirmPassword}</div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="auth-helper-row mb-3">
                    <div className="text-muted small">
                      {mode === 'login'
                        ? 'Use the same email you used when creating the account.'
                        : 'Passwords are handled by Firebase Authentication.'}
                    </div>
                    {mode === 'login' && (
                      <button
                        type="button"
                        className="btn btn-link btn-sm p-0 auth-link-button"
                        disabled={isLoading}
                        onClick={handleForgotPassword}
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>

                  {error && (
                    <div className="alert alert-warning" role="alert">
                      {error}
                    </div>
                  )}

                  {authMessage && !error && (
                    <div className="alert alert-success" role="status">
                      {authMessage}
                    </div>
                  )}

                  {mode === 'login' && !error && !authMessage && (
                    <div className="text-muted small mb-3">
                      Password reset sends an email to the address above. Check spam or promotions if it does not appear quickly.
                    </div>
                  )}

                  <button type="submit" className="btn btn-primary btn-lg w-100" disabled={isLoading}>
                    {isLoading
                      ? 'Please wait...'
                      : mode === 'login'
                        ? 'Enter dashboard'
                        : 'Create secure account'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
