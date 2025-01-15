import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SearchState {
  recentSearches: string[];
}

const initialState: SearchState = {
  recentSearches: []
};

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    addRecentSearch: (state, action: PayloadAction<string>) => {
      const term = action.payload;
      if (term.length >= 2) {
        state.recentSearches = [
          term,
          ...state.recentSearches.filter(s => s !== term)
        ].slice(0, 5);
      }
    },
    clearRecentSearches: (state) => {
      state.recentSearches = [];
    }
  }
});

export const { addRecentSearch, clearRecentSearches } = searchSlice.actions;
export default searchSlice.reducer; 