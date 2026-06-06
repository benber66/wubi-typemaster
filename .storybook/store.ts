import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';

// 占位 store，仅供 Storybook 演示。后续 Zustand store 将在 src/stores/ 下创建。

interface PlaceholderState {
  count: number;
}

const slice = createSlice({
  name: 'placeholder',
  initialState: { count: 0 } as PlaceholderState,
  reducers: {
    increment: (state) => {
      state.count += 1;
    },
    set: (state, action: PayloadAction<number>) => {
      state.count = action.payload;
    },
  },
});

export const { increment, set } = slice.actions;
export const store = configureStore({ reducer: slice.reducer });
