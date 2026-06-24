import React, { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  addTask,
  clearCompleted,
  fetchWeather,
  removeTask,
  toggleTaskComplete,
  updateTaskStatus,
  updateTask,
} from '../features/taskSlice';
import { logout } from '../features/authSlice';
import { useNavigate } from 'react-router-dom';

const priorityOrder = {
  High: 0,
  Medium: 1,
  Low: 2,
};

const defaultDraft = {
  text: '',
  priority: 'Medium',
  effort: 'Medium',
  dueDate: '',
  category: 'Personal',
  notes: '',
};

const categoryOptions = ['Personal', 'Work', 'Health', 'Learning', 'Errands'];
const statusOptions = ['Backlog', 'In Progress', 'Done'];
const statusOrder = {
  Backlog: 0,
  'In Progress': 1,
  Done: 2,
};
const effortOptions = ['Small', 'Medium', 'Large'];
const effortOrder = {
  Small: 0,
  Medium: 1,
  Large: 2,
};
const outdoorTaskPattern = /(outdoor|park|walk|run|travel|event)/i;

function isOverdue(task) {
  if (!task.dueDate || task.status === 'Done') {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(task.dueDate) < today;
}

function formatDueDate(dueDate) {
  if (!dueDate) {
    return 'No due date';
  }

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(dueDate));
}

function getTaskScore(task) {
  const priorityScore = { High: 70, Medium: 40, Low: 20 }[task.priority] || 20;
  const effortScore = { Small: 20, Medium: 10, Large: 0 }[task.effort] || 0;
  const statusScore = task.status === 'In Progress' ? 20 : 0;
  const dueScore = task.dueDate ? Math.max(0, 21 - Math.ceil((new Date(task.dueDate) - new Date()) / 86400000)) : 0;
  return priorityScore + effortScore + statusScore + dueScore;
}

function isOutdoorTask(task) {
  return outdoorTaskPattern.test(`${task.text} ${task.notes} ${task.category}`);
}

function getAdjustedTaskScore(task, weatherPenalty) {
  return getTaskScore(task) - (isOutdoorTask(task) ? weatherPenalty : 0);
}

function ToDo() {
  const [draft, setDraft] = useState(defaultDraft);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recommended');
  const [editingId, setEditingId] = useState(null);
  const [editingDraft, setEditingDraft] = useState(defaultDraft);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const tasks = useSelector((state) => state.tasks.tasks);
  const tasksStatus = useSelector((state) => state.tasks.tasksStatus);
  const taskError = useSelector((state) => state.tasks.taskError);
  const weather = useSelector((state) => state.tasks.weather);
  const weatherStatus = useSelector((state) => state.tasks.weatherStatus);
  const weatherError = useSelector((state) => state.tasks.weatherError);

  const stats = useMemo(() => {
    const completed = tasks.filter((task) => task.status === 'Done').length;
    const overdue = tasks.filter(isOverdue).length;
    const active = tasks.length - completed;
    const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
    const inProgress = tasks.filter((task) => task.status === 'In Progress').length;
    const backlog = tasks.filter((task) => task.status === 'Backlog').length;

    return { completed, overdue, active, progress, inProgress, backlog };
  }, [tasks]);

  const outdoorTasks = useMemo(() => tasks.filter((task) => task.status !== 'Done' && isOutdoorTask(task)), [tasks]);
  const weatherPenalty = weather && weather.score < 60 ? 45 : 0;

  const focusTask = useMemo(() => {
    return tasks
      .filter((task) => task.status !== 'Done')
      .sort(
        (a, b) =>
          getAdjustedTaskScore(b, weatherPenalty) - getAdjustedTaskScore(a, weatherPenalty) ||
          priorityOrder[a.priority] - priorityOrder[b.priority] ||
          effortOrder[a.effort] - effortOrder[b.effort],
      )[0];
  }, [tasks, weatherPenalty]);

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tasks
      .filter((task) => {
        const taskText = String(task.text ?? '').toLowerCase();
        const taskNotes = String(task.notes ?? '').toLowerCase();
        const taskCategory = String(task.category ?? '').toLowerCase();
        const matchesQuery =
          !query ||
          taskText.includes(query) ||
          taskNotes.includes(query) ||
          taskCategory.includes(query);
        const matchesStatus =
          statusFilter === 'all' ||
          (statusFilter === 'overdue' && isOverdue(task)) ||
          task.status === statusFilter;
        const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
        const matchesCategory = categoryFilter === 'all' || task.category === categoryFilter;

        return matchesQuery && matchesStatus && matchesPriority && matchesCategory;
      })
      .sort((a, b) => {
        if (sortBy === 'recommended') {
          return (
            getAdjustedTaskScore(b, weatherPenalty) - getAdjustedTaskScore(a, weatherPenalty) ||
            priorityOrder[a.priority] - priorityOrder[b.priority] ||
            effortOrder[a.effort] - effortOrder[b.effort]
          );
        }

        if (sortBy === 'priority') {
          return priorityOrder[a.priority] - priorityOrder[b.priority] || a.createdAt - b.createdAt;
        }

        if (sortBy === 'dueDate') {
          if (!a.dueDate && !b.dueDate) return b.createdAt - a.createdAt;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate) - new Date(b.dueDate);
        }

        if (sortBy === 'status') {
          return (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99) || b.createdAt - a.createdAt;
        }

        return b.createdAt - a.createdAt;
      });
  }, [tasks, search, statusFilter, priorityFilter, categoryFilter, sortBy, weatherPenalty]);

  const handleDraftChange = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const handleAddTask = async (event) => {
    event.preventDefault();

    if (!draft.text.trim()) return;

    const newTask = {
      text: draft.text.trim(),
      priority: draft.priority,
      status: 'Backlog',
      effort: draft.effort,
      dueDate: draft.dueDate,
      category: draft.category,
      notes: draft.notes.trim(),
      completed: false,
      createdAt: Date.now(),
    };

    try {
      const savedTask = await dispatch(addTask(newTask)).unwrap();
      dispatch(fetchWeather(savedTask));
      setDraft(defaultDraft);
    } catch {
      // Keep the draft values in place so the user can retry after fixing auth or Firestore access.
    }
  };

  const startEditing = (task) => {
    setEditingId(task.id);
    setEditingDraft({
      text: task.text,
      priority: task.priority,
      status: task.status,
      effort: task.effort,
      dueDate: task.dueDate,
      category: task.category,
      notes: task.notes,
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingDraft(defaultDraft);
  };

  const saveEditing = (taskId) => {
    if (!editingDraft.text.trim()) return;

    dispatch(
      updateTask({
        id: taskId,
        updates: {
          text: editingDraft.text.trim(),
          priority: editingDraft.priority,
          status: editingDraft.status,
          effort: editingDraft.effort,
          dueDate: editingDraft.dueDate,
          category: editingDraft.category,
          notes: editingDraft.notes.trim(),
          completed: editingDraft.status === 'Done',
        },
      }),
    );
    setEditingId(null);
  };

  const openTaskCount = tasks.filter((task) => task.status !== 'Done').length;

  return (
    <div className="todo-page">
      <div className="todo-aurora" aria-hidden="true" />
      <div className="container py-4 py-lg-5 position-relative">
        <div className="todo-topbar mb-4">
          <div className="d-flex flex-column flex-lg-row justify-content-between gap-3 align-items-lg-center">
            <div>
              <div className="text-uppercase text-muted small fw-semibold mb-1">Task Operations</div>
              <h1 className="h2 fw-bold mb-1">Today Command Center</h1>
              <p className="text-muted mb-0">Plan, prioritize, and move work through a simple delivery flow.</p>
            </div>

            <button
              type="button"
              className="btn btn-outline-danger px-4 align-self-start align-self-lg-auto"
              onClick={() => {
                dispatch(logout());
                navigate('/login', { replace: true });
              }}
            >
              Logout
            </button>
          </div>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-6 col-xl-3">
            <div className="stat-card card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="text-uppercase text-muted small fw-semibold">Backlog</div>
                <div className="display-6 fw-bold mb-0">{stats.backlog}</div>
              </div>
            </div>
          </div>
          <div className="col-6 col-xl-3">
            <div className="stat-card card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="text-uppercase text-muted small fw-semibold">In Progress</div>
                <div className="display-6 fw-bold mb-0">{stats.inProgress}</div>
              </div>
            </div>
          </div>
          <div className="col-6 col-xl-3">
            <div className="stat-card card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="text-uppercase text-muted small fw-semibold">Completed</div>
                <div className="display-6 fw-bold mb-0">{stats.completed}</div>
              </div>
            </div>
          </div>
          <div className="col-6 col-xl-3">
            <div className="stat-card card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="text-uppercase text-muted small fw-semibold">Overdue</div>
                <div className="display-6 fw-bold mb-0">{stats.overdue}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="fw-semibold">Completion</div>
              <div className="text-muted small">{stats.progress}%</div>
            </div>
            <div className="progress" style={{ height: '10px' }}>
              <div className="progress-bar" style={{ width: `${stats.progress}%` }} />
            </div>
          </div>
        </div>

        <div className="focus-strip mb-4">
          <div className="row g-3 align-items-center">
            <div className="col-12 col-lg-8">
              <div className="text-uppercase text-muted small fw-semibold mb-1">Recommended next</div>
              {focusTask ? (
                <>
                  <h2 className="h4 mb-1">{focusTask.text}</h2>
                  <div className="d-flex flex-wrap gap-2">
                    <span className="badge text-bg-dark">{focusTask.priority}</span>
                    <span className="badge text-bg-light border">{focusTask.effort}</span>
                    <span className="badge text-bg-light border">{focusTask.category}</span>
                    <span className="badge text-bg-light border">Due {formatDueDate(focusTask.dueDate)}</span>
                    {isOutdoorTask(focusTask) && <span className="badge text-bg-info">Weather-aware</span>}
                  </div>
                </>
              ) : (
                <h2 className="h4 mb-0">All tasks are clear.</h2>
              )}
            </div>
            <div className="col-12 col-lg-4 text-lg-end">
              {focusTask && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => dispatch(updateTaskStatus({ id: focusTask.id, status: 'In Progress' }))}
                >
                  Start Focus
                </button>
              )}
            </div>
          </div>
        </div>

        {(outdoorTasks.length > 0 || weatherStatus === 'loading' || weatherError || weather) && (
          <div className="weather-planner mb-4">
            <div className="row g-3 align-items-center">
              <div className="col-12 col-lg-8">
                <div className="text-uppercase text-muted small fw-semibold mb-1">Weather Planning</div>
                {weatherStatus === 'loading' && <h2 className="h5 mb-1">Checking outdoor conditions...</h2>}
                {weatherError && <h2 className="h5 mb-1 text-warning">Weather check needs attention</h2>}
                {weather && (
                  <>
                    <h2 className="h5 mb-1">{weather.recommendation}</h2>
                    <p className="text-muted mb-0">
                      {weather.city}: {weather.description}, {weather.temperature} deg C, wind {weather.windSpeed} m/s.
                    </p>
                  </>
                )}
                {!weather && weatherStatus !== 'loading' && !weatherError && (
                  <h2 className="h5 mb-1">{outdoorTasks.length} outdoor task{outdoorTasks.length === 1 ? '' : 's'} waiting for conditions.</h2>
                )}
                {weatherError && <p className="text-muted mb-0">{weatherError}</p>}
              </div>
              <div className="col-12 col-lg-4 text-lg-end">
                {weather && (
                  <div className="weather-score mb-2">
                    <span className="fw-bold">{weather.score}</span>
                    <span className="text-muted">/100</span>
                  </div>
                )}
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  disabled={weatherStatus === 'loading'}
                  onClick={() => dispatch(fetchWeather({ text: 'outdoor planning check' }))}
                >
                  Refresh Weather
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="row g-4">
          <div className="col-12 col-xl-5">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <h2 className="h4 mb-1">Create task</h2>
                    <p className="text-muted mb-0">Capture the full context in one place.</p>
                  </div>
                </div>

                <form onSubmit={handleAddTask} className="task-form">
                  <div className="mb-3">
                    <label htmlFor="taskInput" className="form-label">Task title</label>
                    <input
                      id="taskInput"
                      className="form-control"
                      placeholder="Launch landing page review"
                      value={draft.text}
                      onChange={(e) => handleDraftChange('text', e.target.value)}
                    />
                  </div>

                  <div className="row g-3">
                    <div className="col-12 col-md-4">
                      <label htmlFor="prioritySelect" className="form-label">Priority</label>
                      <select
                        id="prioritySelect"
                        className="form-select"
                        value={draft.priority}
                        onChange={(e) => handleDraftChange('priority', e.target.value)}
                      >
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </div>
                    <div className="col-12 col-md-4">
                      <label htmlFor="effortSelect" className="form-label">Effort</label>
                      <select
                        id="effortSelect"
                        className="form-select"
                        value={draft.effort}
                        onChange={(e) => handleDraftChange('effort', e.target.value)}
                      >
                        {effortOptions.map((effort) => (
                          <option key={effort} value={effort}>
                            {effort}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-12 col-md-4">
                      <label htmlFor="categorySelect" className="form-label">Category</label>
                      <select
                        id="categorySelect"
                        className="form-select"
                        value={draft.category}
                        onChange={(e) => handleDraftChange('category', e.target.value)}
                      >
                        {categoryOptions.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="row g-3 mt-0">
                    <div className="col-12">
                      <label htmlFor="dueDateInput" className="form-label">Due date</label>
                      <input
                        id="dueDateInput"
                        type="date"
                        className="form-control"
                        value={draft.dueDate}
                        onChange={(e) => handleDraftChange('dueDate', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="mt-3">
                    <label htmlFor="notesInput" className="form-label">Notes</label>
                    <textarea
                      id="notesInput"
                      className="form-control"
                      rows="3"
                      placeholder="Add links, reminders, or context"
                      value={draft.notes}
                      onChange={(e) => handleDraftChange('notes', e.target.value)}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary w-100 mt-4">
                    Add Task
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div className="col-12 col-xl-7">
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-body p-4">
                <div className="row g-3 align-items-end">
                  <div className="col-12 col-lg-6 col-xl-4">
                    <label htmlFor="searchInput" className="form-label">Search</label>
                    <input
                      id="searchInput"
                      className="form-control"
                      placeholder="Search title, notes, or category"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <div className="col-12 col-sm-6 col-lg-3 col-xl-2">
                    <label htmlFor="statusFilter" className="form-label">Status</label>
                    <select
                      id="statusFilter"
                      className="form-select"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="all">All</option>
                      <option value="Backlog">Backlog</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Done">Done</option>
                      <option value="overdue">Overdue</option>
                    </select>
                  </div>
                  <div className="col-12 col-sm-6 col-lg-3 col-xl-2">
                    <label htmlFor="priorityFilter" className="form-label">Priority</label>
                    <select
                      id="priorityFilter"
                      className="form-select"
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value)}
                    >
                      <option value="all">All</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                  <div className="col-12 col-sm-6 col-lg-3 col-xl-2">
                    <label htmlFor="categoryFilter" className="form-label">Category</label>
                    <select
                      id="categoryFilter"
                      className="form-select"
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                      <option value="all">All</option>
                      {categoryOptions.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-12 col-sm-6 col-lg-3 col-xl-2">
                    <label htmlFor="sortSelect" className="form-label">Sort by</label>
                    <select
                      id="sortSelect"
                      className="form-select"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      <option value="recommended">Recommended</option>
                      <option value="priority">Priority</option>
                      <option value="dueDate">Due date</option>
                      <option value="status">Status</option>
                      <option value="newest">Newest</option>
                    </select>
                  </div>
                </div>

                <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mt-4">
                  <div className="text-muted small">
                    {filteredTasks.length} task{filteredTasks.length === 1 ? '' : 's'} shown
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    disabled={!tasks.some((task) => task.status === 'Done')}
                    onClick={() => dispatch(clearCompleted())}
                  >
                    Clear completed
                  </button>
                </div>
              </div>
            </div>

            <div className="task-list">
              {tasksStatus === 'loading' ? (
                <div className="card border-0 shadow-sm">
                  <div className="card-body p-5 text-center">
                    <div className="spinner-border text-primary mb-3" role="status" aria-hidden="true" />
                    <p className="text-muted mb-0">Loading your task workspace...</p>
                  </div>
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="card border-0 shadow-sm">
                  <div className="card-body p-5 text-center">
                    <h3 className="h5 mb-2">No matching tasks</h3>
                    <p className="text-muted mb-0">
                      Try changing filters or add a fresh task to keep the workflow moving.
                    </p>
                  </div>
                </div>
              ) : (
                filteredTasks.map((task) => {
                  const overdue = isOverdue(task);
                  const editing = editingId === task.id;

                  return (
                    <div
                      key={task.id}
                      className={`task-card card border-0 shadow-sm mb-3 ${task.status === 'Done' ? 'task-complete' : ''} ${overdue ? 'task-overdue' : ''}`}
                    >
                      <div className="card-body p-3 p-sm-4">
                        {editing ? (
                          <div className="task-editor">
                            <div className="mb-3">
                              <label className="form-label">Task title</label>
                              <input
                                className="form-control"
                                value={editingDraft.text}
                                onChange={(e) => setEditingDraft((current) => ({ ...current, text: e.target.value }))}
                              />
                            </div>
                            <div className="row g-3">
                              <div className="col-12 col-md-6 col-xl-3">
                                <label className="form-label">Priority</label>
                                <select
                                  className="form-select"
                                  value={editingDraft.priority}
                                  onChange={(e) => setEditingDraft((current) => ({ ...current, priority: e.target.value }))}
                                >
                                  <option value="High">High</option>
                                  <option value="Medium">Medium</option>
                                  <option value="Low">Low</option>
                                </select>
                              </div>
                              <div className="col-12 col-md-6 col-xl-3">
                                <label className="form-label">Status</label>
                                <select
                                  className="form-select"
                                  value={editingDraft.status}
                                  onChange={(e) => setEditingDraft((current) => ({ ...current, status: e.target.value }))}
                                >
                                  {statusOptions.map((status) => (
                                    <option key={status} value={status}>
                                      {status}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="col-12 col-md-6 col-xl-3">
                                <label className="form-label">Effort</label>
                                <select
                                  className="form-select"
                                  value={editingDraft.effort}
                                  onChange={(e) => setEditingDraft((current) => ({ ...current, effort: e.target.value }))}
                                >
                                  {effortOptions.map((effort) => (
                                    <option key={effort} value={effort}>
                                      {effort}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="col-12 col-md-6 col-xl-3">
                                <label className="form-label">Category</label>
                                <select
                                  className="form-select"
                                  value={editingDraft.category}
                                  onChange={(e) => setEditingDraft((current) => ({ ...current, category: e.target.value }))}
                                >
                                  {categoryOptions.map((category) => (
                                    <option key={category} value={category}>
                                      {category}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="col-12 col-md-6">
                                <label className="form-label">Due date</label>
                                <input
                                  type="date"
                                  className="form-control"
                                  value={editingDraft.dueDate}
                                  onChange={(e) => setEditingDraft((current) => ({ ...current, dueDate: e.target.value }))}
                                />
                              </div>
                            </div>
                            <div className="mt-3">
                              <label className="form-label">Notes</label>
                              <textarea
                                className="form-control"
                                rows="3"
                                value={editingDraft.notes}
                                onChange={(e) => setEditingDraft((current) => ({ ...current, notes: e.target.value }))}
                              />
                            </div>
                            <div className="d-flex gap-2 mt-3">
                              <button type="button" className="btn btn-primary" onClick={() => saveEditing(task.id)}>
                                Save
                              </button>
                              <button type="button" className="btn btn-outline-secondary" onClick={cancelEditing}>
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="task-card-layout">
                            <div className="form-check task-check">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={task.status === 'Done'}
                                onChange={() => dispatch(toggleTaskComplete(task.id))}
                                id={`task-${task.id}`}
                              />
                            </div>

                            <div className="task-content">
                              <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                                <h3 className={`task-title h5 mb-0 ${task.status === 'Done' ? 'text-decoration-line-through text-muted' : ''}`}>
                                  {task.text}
                                </h3>
                                <span className="badge text-bg-dark">{task.priority}</span>
                                <span className="badge text-bg-primary">{task.status}</span>
                                <span className="badge text-bg-light border">{task.effort}</span>
                                <span className="badge text-bg-light border">{task.category}</span>
                                {overdue && <span className="badge text-bg-danger">Overdue</span>}
                              </div>

                              <div className="text-muted small mb-2">
                                Due {formatDueDate(task.dueDate)}
                              </div>

                              {task.notes && (
                                <p className="mb-0 text-secondary">
                                  {task.notes}
                                </p>
                              )}
                            </div>

                            <div className="task-actions">
                              <select
                                className="form-select form-select-sm task-status-select"
                                value={task.status}
                                onChange={(e) => dispatch(updateTaskStatus({ id: task.id, status: e.target.value }))}
                                aria-label={`Change status for ${task.text}`}
                              >
                                {statusOptions.map((status) => (
                                  <option key={status} value={status}>
                                    {status}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                className="btn btn-outline-primary btn-sm"
                                onClick={() => startEditing(task)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline-danger btn-sm"
                                onClick={() => dispatch(removeTask(task.id))}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {taskError && (
              <div className="alert alert-warning mt-3 mb-0" role="alert">
                {taskError}
              </div>
            )}

            {openTaskCount > 0 && statusFilter === 'all' && (
              <div className="text-muted small mt-3">
                You have {openTaskCount} open task{openTaskCount === 1 ? '' : 's'}.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ToDo;
