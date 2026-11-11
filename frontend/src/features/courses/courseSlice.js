import { createSlice } from '@reduxjs/toolkit';
const courseSlice = createSlice({
  name: 'courses',
  initialState: { list: [], current: null },
  reducers: {
    setCourses: (state, action) => { state.list = action.payload; },
    setCourseDetails: (state, action) => { state.current = action.payload; }
  }
});
export const { setCourses, setCourseDetails } = courseSlice.actions;
export default courseSlice.reducer;
