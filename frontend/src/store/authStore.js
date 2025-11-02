import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '../services';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      loading: false,
      error: null,

      initialize: async () => {
        const token = localStorage.getItem('accessToken');
        const storedUser = get().user;
        
        if (token && !storedUser) {
          try {
            set({ loading: true });
            const response = await authService.getProfile();
            // backend: { success: true, data: { user } }
            const user = response.data?.data?.user || response.data?.user || null;
            set({
              user,
              accessToken: token,
              refreshToken: localStorage.getItem('refreshToken'),
              isAuthenticated: !!user,
              loading: false,
            });
          } catch (error) {
            console.error('Failed to initialize auth:', error);
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            set({
              user: null,
              accessToken: null,
              refreshToken: null,
              isAuthenticated: false,
              loading: false,
            });
          }
        } else if (token && storedUser) {
          // Token and user exist, just ensure auth state is correct
          set({
            accessToken: token,
            refreshToken: localStorage.getItem('refreshToken'),
            isAuthenticated: true,
          });
        }
      },

      login: async (email, password) => {
        set({ loading: true, error: null });
        try {
          console.log('AuthStore: Calling authService.login');
          const response = await authService.login(email, password);
          console.log('AuthStore: Login response:', response);
          
          const { accessToken, refreshToken, user } = response.data?.data || {};
          console.log('AuthStore: Extracted tokens and user:', { accessToken: !!accessToken, refreshToken: !!refreshToken, user });
          
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          
          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            loading: false,
          });
          
          console.log('AuthStore: State updated, isAuthenticated:', true);
          return response;
        } catch (error) {
          console.error('AuthStore: Login error:', error);
          set({ loading: false, error: error.response?.data?.message || 'Login failed' });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      getProfile: async () => {
        set({ loading: true });
        try {
          const response = await authService.getProfile();
          const user = response.data?.data?.user || response.data?.user || null;
          set({ user, loading: false, isAuthenticated: !!user });
          return response;
        } catch (error) {
          set({ loading: false, error: error.response?.data?.message });
          throw error;
        }
      },

      updateProfile: async (userData) => {
        set({ loading: true });
        try {
          const response = await authService.updateProfile(userData);
          // After updating profile, refresh the profile from server
          const profileResp = await authService.getProfile();
          const user = profileResp.data?.data?.user || profileResp.data?.user || null;
          set({ user, loading: false });
          return response;
        } catch (error) {
          set({ loading: false, error: error.response?.data?.message });
          throw error;
        }
      },

      setUser: (userData) => {
        set({ user: userData });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
