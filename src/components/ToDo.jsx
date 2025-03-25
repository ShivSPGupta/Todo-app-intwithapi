import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addTask, removeTask, fetchWeather } from '../features/taskSlice';
import { logout } from '../features/authSlice';
import { useNavigate } from 'react-router-dom';
// import './ToDo.css';

function ToDo() {
  const [task, setTask] = useState('');
  const [priority, setPriority] = useState('Medium');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const tasks = useSelector(state => state.tasks.tasks);
  const weather = useSelector(state => state.tasks.weather);

  const handleAddTask = () => {
    if (!task.trim()) return;
    const newTask = { id: Date.now(), text: task, priority };
    dispatch(addTask(newTask));
    dispatch(fetchWeather(newTask));
    setTask('');
  };

  return (
    <div className="container mt-6">
      <h2>To-Do List</h2>
      <button className="btn btn-danger" onClick={() => { dispatch(logout()); navigate('/login'); }}>Logout</button>
      <input className="form-control mt-3" value={task} onChange={(e) => setTask(e.target.value)} />
      <select className="form-control mt-2" value={priority} onChange={(e) => setPriority(e.target.value)}>
        <option value="High">High</option>
        <option value="Medium">Medium</option>
        <option value="Low">Low</option>
      </select>
      <button className="btn btn-primary mt-2" onClick={handleAddTask}>Add Task</button>
      <ul className="list-group mt-3">
        {[...tasks].sort((a, b) => (a.priority === 'High' ? -1 : b.priority === 'High' ? 1 : 0)).map(t => (
          <li key={t.id} className="list-group-item d-flex justify-content-between">
            {t.text} ({t.priority})
            <button className="btn btn-danger" onClick={() => dispatch(removeTask(t.id))}>Delete</button>
          </li>
        ))}
      </ul>
      {weather && weather.weather && (
        <p className="mt-2">Weather: {weather.weather[0].description}, {weather.main.temp}°C</p>
      )}
    </div>
  );
}

export default ToDo;