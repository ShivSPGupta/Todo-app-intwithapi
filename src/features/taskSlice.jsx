import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_KEY = 'aefb5d9f3c500cd582d22b2026557064';

export const fetchWeather = createAsyncThunk('tasks/fetchWeather', async (task) => {
  if (!task.text.toLowerCase().includes('outdoor') && !task.text.toLowerCase().includes('park')) {
    return null;
  }
  try {
    const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=London&appid=${API_KEY}&units=metric`);
    return response.data;
  } catch (error) {
    console.error('Weather API error:', error);
    return null;
  }
});

const taskSlice = createSlice({
  name: 'tasks',
  initialState: { tasks: JSON.parse(localStorage.getItem('tasks')) || [], weather: null },
  reducers: {
    addTask: (state, action) => {
      state.tasks = [...state.tasks, action.payload];
      localStorage.setItem('tasks', JSON.stringify(state.tasks));
    },
    removeTask: (state, action) => {
      state.tasks = state.tasks.filter(task => task.id !== action.payload);
      localStorage.setItem('tasks', JSON.stringify(state.tasks));
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchWeather.fulfilled, (state, action) => {
      state.weather = action.payload;
    });
  },
});

export const { addTask, removeTask } = taskSlice.actions;
export default taskSlice.reducer;