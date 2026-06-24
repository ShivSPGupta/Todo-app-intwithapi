import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase/config';

const WEATHER_TASK_PATTERN = /(outdoor|park|walk|run|travel|event)/i;
const OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
const OPENWEATHER_CITY = import.meta.env.VITE_OPENWEATHER_CITY || 'London';

const summarizeWeather = (weather) => {
  const condition = weather.weather?.[0]?.main || 'Unknown';
  const description = weather.weather?.[0]?.description || 'weather unavailable';
  const temperature = Math.round(weather.main?.temp ?? 0);
  const windSpeed = Math.round(weather.wind?.speed ?? 0);
  const isBadWeather = ['Thunderstorm', 'Drizzle', 'Rain', 'Snow'].includes(condition);
  const isExtremeTemp = temperature <= 5 || temperature >= 35;
  const score = isBadWeather ? 35 : isExtremeTemp ? 55 : windSpeed > 10 ? 70 : 92;
  const recommendation =
    score >= 80
      ? 'Good window for outdoor tasks.'
      : score >= 60
        ? 'Outdoor tasks are possible, but keep an eye on conditions.'
        : 'Consider rescheduling outdoor tasks or moving them indoors.';

  return {
    city: weather.name || OPENWEATHER_CITY,
    condition,
    description,
    temperature,
    windSpeed,
    score,
    recommendation,
    checkedAt: Date.now(),
  };
};

const defaultTaskFields = {
  completed: false,
  status: 'Backlog',
  effort: 'Medium',
  dueDate: '',
  category: 'Personal',
  notes: '',
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

const normalizeTaskId = (id) => String(id ?? '');

const toTaskWritePayload = (task) => {
  const normalizedTask = normalizeTask(task);
  const { id: _TASK_ID, ...taskData } = normalizedTask;
  return taskData;
};

const normalizeTask = (task) => ({
  ...defaultTaskFields,
  ...task,
  id: normalizeTaskId(task.id),
  text: typeof task.text === 'string' ? task.text : '',
  priority: task.priority || 'Medium',
  status: task.completed ? 'Done' : task.status || 'Backlog',
  completed: task.completed || task.status === 'Done',
  effort: task.effort || 'Medium',
  dueDate: task.dueDate || '',
  category: task.category || 'Personal',
  notes: task.notes || '',
  createdAt: task.createdAt || Date.now(),
  updatedAt: task.updatedAt || Date.now(),
});

const userTasksCollection = (uid) => collection(db, 'users', uid, 'tasks');

const requireUserId = (getState) => {
  const userId = getState().auth.user?.uid;
  if (!userId) {
    throw new Error('You need to sign in to manage tasks.');
  }
  return userId;
};

export const fetchTasks = createAsyncThunk('tasks/fetchTasks', async (_, { getState }) => {
  const userId = requireUserId(getState);
  const tasksQuery = query(userTasksCollection(userId), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(tasksQuery);

  return snapshot.docs.map((item) => normalizeTask({ ...item.data(), id: item.id }));
});

export const addTask = createAsyncThunk('tasks/addTask', async (task, { getState }) => {
  const userId = requireUserId(getState);
  const normalizedTask = normalizeTask({
    ...task,
    id: undefined,
    status: 'Backlog',
    completed: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  const payload = toTaskWritePayload(normalizedTask);

  const docRef = await addDoc(userTasksCollection(userId), payload);
  return normalizeTask({ ...payload, id: docRef.id });
});

export const removeTask = createAsyncThunk('tasks/removeTask', async (taskId, { getState }) => {
  const userId = requireUserId(getState);
  const normalizedTaskId = normalizeTaskId(taskId);
  await deleteDoc(doc(db, 'users', userId, 'tasks', normalizedTaskId));
  return normalizedTaskId;
});

export const toggleTaskComplete = createAsyncThunk('tasks/toggleTaskComplete', async (taskId, { getState }) => {
  const userId = requireUserId(getState);
  const normalizedTaskId = normalizeTaskId(taskId);
  const currentTask = getState().tasks.tasks.find((task) => normalizeTaskId(task.id) === normalizedTaskId);

  if (!currentTask) {
    throw new Error('Task not found.');
  }

  const isDone = currentTask.status === 'Done';
  const updates = {
    status: isDone ? 'In Progress' : 'Done',
    completed: !isDone,
    updatedAt: Date.now(),
  };

  await updateDoc(doc(db, 'users', userId, 'tasks', normalizedTaskId), updates);
  return { id: normalizedTaskId, updates };
});

export const updateTaskStatus = createAsyncThunk('tasks/updateTaskStatus', async ({ id, status }, { getState }) => {
  const userId = requireUserId(getState);
  const normalizedTaskId = normalizeTaskId(id);
  const updates = {
    status,
    completed: status === 'Done',
    updatedAt: Date.now(),
  };

  await updateDoc(doc(db, 'users', userId, 'tasks', normalizedTaskId), updates);
  return { id: normalizedTaskId, updates };
});

export const updateTask = createAsyncThunk('tasks/updateTask', async ({ id, updates }, { getState }) => {
  const userId = requireUserId(getState);
  const normalizedTaskId = normalizeTaskId(id);
  const payload = toTaskWritePayload({
    ...updates,
    completed: updates.status === 'Done',
    updatedAt: Date.now(),
  });

  await updateDoc(doc(db, 'users', userId, 'tasks', normalizedTaskId), payload);
  return { id: normalizedTaskId, updates: payload };
});

export const clearCompleted = createAsyncThunk('tasks/clearCompleted', async (_, { getState }) => {
  const userId = requireUserId(getState);
  const doneTasks = getState().tasks.tasks.filter((task) => task.status === 'Done');
  const batch = writeBatch(db);

  doneTasks.forEach((task) => {
    batch.delete(doc(db, 'users', userId, 'tasks', normalizeTaskId(task.id)));
  });

  await batch.commit();
  return doneTasks.map((task) => normalizeTaskId(task.id));
});

export const fetchWeather = createAsyncThunk('tasks/fetchWeather', async (task) => {
  if (!WEATHER_TASK_PATTERN.test(task.text)) {
    return null;
  }

  if (!OPENWEATHER_API_KEY) {
    throw new Error('Missing OpenWeather API key. Set VITE_OPENWEATHER_API_KEY in your .env file.');
  }

  const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
    params: {
      q: OPENWEATHER_CITY,
      appid: OPENWEATHER_API_KEY,
      units: 'metric',
    },
  });

  return summarizeWeather(response.data);
});

const applyTaskUpdates = (tasks, taskId, updates) => tasks.map((task) => (
  normalizeTaskId(task.id) === normalizeTaskId(taskId) ? normalizeTask({ ...task, ...updates }) : normalizeTask(task)
));

const taskSlice = createSlice({
  name: 'tasks',
  initialState: {
    tasks: [],
    tasksStatus: 'idle',
    taskError: null,
    weather: null,
    weatherStatus: 'idle',
    weatherError: null,
  },
  reducers: {
    resetTasks: (state) => {
      state.tasks = [];
      state.tasksStatus = 'idle';
      state.taskError = null;
      state.weather = null;
      state.weatherStatus = 'idle';
      state.weatherError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.tasksStatus = 'loading';
        state.taskError = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.tasks = action.payload;
        state.tasksStatus = 'succeeded';
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.tasksStatus = 'failed';
        state.taskError = action.error.message || 'Unable to load tasks.';
      })
      .addCase(addTask.fulfilled, (state, action) => {
        state.tasks.unshift(action.payload);
      })
      .addCase(addTask.rejected, (state, action) => {
        state.taskError = action.error.message || 'Unable to add task.';
      })
      .addCase(removeTask.fulfilled, (state, action) => {
        state.tasks = state.tasks.filter((task) => normalizeTaskId(task.id) !== normalizeTaskId(action.payload));
      })
      .addCase(removeTask.rejected, (state, action) => {
        state.taskError = action.error.message || 'Unable to remove task.';
      })
      .addCase(toggleTaskComplete.fulfilled, (state, action) => {
        state.tasks = applyTaskUpdates(state.tasks, action.payload.id, action.payload.updates);
      })
      .addCase(toggleTaskComplete.rejected, (state, action) => {
        state.taskError = action.error.message || 'Unable to update task.';
      })
      .addCase(updateTaskStatus.fulfilled, (state, action) => {
        state.tasks = applyTaskUpdates(state.tasks, action.payload.id, action.payload.updates);
      })
      .addCase(updateTaskStatus.rejected, (state, action) => {
        state.taskError = action.error.message || 'Unable to update task status.';
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        state.tasks = applyTaskUpdates(state.tasks, action.payload.id, action.payload.updates);
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.taskError = action.error.message || 'Unable to save task.';
      })
      .addCase(clearCompleted.fulfilled, (state, action) => {
        state.tasks = state.tasks.filter((task) => !action.payload.includes(normalizeTaskId(task.id)));
      })
      .addCase(clearCompleted.rejected, (state, action) => {
        state.taskError = action.error.message || 'Unable to clear completed tasks.';
      })
      .addCase(fetchWeather.pending, (state) => {
        state.weatherStatus = 'loading';
        state.weatherError = null;
      })
      .addCase(fetchWeather.fulfilled, (state, action) => {
        state.weather = action.payload;
        state.weatherStatus = 'succeeded';
      })
      .addCase(fetchWeather.rejected, (state, action) => {
        state.weather = null;
        state.weatherStatus = 'failed';
        state.weatherError = action.error.message || 'Unable to load weather data.';
      });
  },
});

export const { resetTasks } = taskSlice.actions;
export default taskSlice.reducer;
