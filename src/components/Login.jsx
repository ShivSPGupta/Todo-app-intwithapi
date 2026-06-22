import React from 'react';
import { useDispatch } from 'react-redux';
import { login } from '../features/authSlice';
import { useNavigate } from 'react-router-dom';

function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  return (
    <div className="todo-page">
      <div className="todo-aurora" aria-hidden="true" />
      <div className="container py-5 position-relative">
        <div className="row justify-content-center align-items-center min-vh-100 py-4">
          <div className="col-12 col-md-10 col-lg-8">
            <div className="row g-0 overflow-hidden shadow-lg rounded-5 border border-white border-opacity-50 bg-white bg-opacity-75 backdrop-blur">
              <div className="col-lg-6 p-5 d-flex flex-column justify-content-between">
                <div>
                  <span className="badge rounded-pill text-bg-primary mb-3">Modern Todo Experience</span>
                  <h1 className="display-6 fw-bold mb-3">Plan work like a product team.</h1>
                  <p className="text-muted mb-4">
                    Manage priorities, deadlines, completion, and context in a single screen built for
                    recruiter-friendly demos.
                  </p>
                </div>

                <div className="row g-3 text-center">
                  <div className="col-4">
                    <div className="stat-card card border-0 shadow-sm h-100">
                      <div className="card-body py-3">
                        <div className="fw-bold">3</div>
                        <div className="small text-muted">Filters</div>
                      </div>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="stat-card card border-0 shadow-sm h-100">
                      <div className="card-body py-3">
                        <div className="fw-bold">Inline</div>
                        <div className="small text-muted">Editing</div>
                      </div>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="stat-card card border-0 shadow-sm h-100">
                      <div className="card-body py-3">
                        <div className="fw-bold">Live</div>
                        <div className="small text-muted">Weather</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-lg-6 p-5 bg-white">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body p-4 p-md-5 text-center">
                    <h2 className="h3 mb-3">Welcome back</h2>
                    <p className="text-muted mb-4">
                      Jump into your dashboard and keep your tasks organized in one place.
                    </p>
                    <button
                      type="button"
                      className="btn btn-primary btn-lg px-4"
                      onClick={() => {
                        dispatch(login());
                        navigate('/', { replace: true });
                      }}
                    >
                      Enter dashboard
                    </button>
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
