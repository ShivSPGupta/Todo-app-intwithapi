import React from 'react';
import { useDispatch } from 'react-redux';
import { login } from '../features/authSlice';
import { useNavigate } from 'react-router-dom';

function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  return (
    <div className="container">
      <h2>Login</h2>
      <button className="btn btn-success" onClick={() => { dispatch(login()); navigate('/'); }}>Login</button>
    </div>
  );
}

export default Login;