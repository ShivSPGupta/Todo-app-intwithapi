import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

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
};

const normalizeTask = (task) => ({
  ...defaultTaskFields,
  ...task,
  text: typeof task.text === 'string' ? task.text : '',
  priority: task.priority || 'Medium',
  status: task.completed ? 'Done' : task.status || 'Backlog',
  completed: task.completed || task.status === 'Done',
  effort: task.effort || 'Medium',
  dueDate: task.dueDate || '',
  category: task.category || 'Personal',
  notes: task.notes || '',
  createdAt: task.createdAt || Date.now(),
});

const readStoredTasks = () => {
  try {
    const storedTasks = localStorage.getItem('tasks');
    const parsedTasks = storedTasks ? JSON.parse(storedTasks) : [];
    return Array.isArray(parsedTasks) ? parsedTasks.map(normalizeTask) : [];
  } catch {
    return [];
  }
};

const persistTasks = (tasks) => {
  localStorage.setItem('tasks', JSON.stringify(tasks));
};

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

const taskSlice = createSlice({
  name: 'tasks',
  initialState: {
    tasks: readStoredTasks(),
    weather: null,
    weatherStatus: 'idle',
    weatherError: null,
  },
  reducers: {
    addTask: (state, action) => {
      state.tasks = [...state.tasks, normalizeTask(action.payload)];
      persistTasks(state.tasks);
    },
    removeTask: (state, action) => {
      state.tasks = state.tasks.filter((task) => task.id !== action.payload);
      persistTasks(state.tasks);
    },
    toggleTaskComplete: (state, action) => {
      const task = state.tasks.find((item) => item.id === action.payload);
      if (task) {
        const isDone = task.status === 'Done';
        task.status = isDone ? 'In Progress' : 'Done';
        task.completed = !isDone;
        persistTasks(state.tasks);
      }
    },
    updateTaskStatus: (state, action) => {
      const { id, status } = action.payload;
      const task = state.tasks.find((item) => item.id === id);
      if (task) {
        task.status = status;
        task.completed = status === 'Done';
        persistTasks(state.tasks);
      }
    },
    updateTask: (state, action) => {
      const { id, updates } = action.payload;
      const task = state.tasks.find((item) => item.id === id);
      if (task) {
        Object.assign(task, updates);
        task.completed = task.status === 'Done';
        persistTasks(state.tasks);
      }
    },
    clearCompleted: (state) => {
      state.tasks = state.tasks.filter((task) => task.status !== 'Done');
      persistTasks(state.tasks);
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchWeather.pending, (state) => {
      state.weatherStatus = 'loading';
      state.weatherError = null;
    });
    builder.addCase(fetchWeather.fulfilled, (state, action) => {
      state.weather = action.payload;
      state.weatherStatus = 'succeeded';
    });
    builder.addCase(fetchWeather.rejected, (state, action) => {
      state.weather = null;
      state.weatherStatus = 'failed';
      state.weatherError = action.error.message || 'Unable to load weather data.';
    });
  },
});

export const {
  addTask,
  removeTask,
  toggleTaskComplete,
  updateTaskStatus,
  updateTask,
  clearCompleted,
} = taskSlice.actions;
export default taskSlice.reducer;
