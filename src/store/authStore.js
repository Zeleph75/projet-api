import { create } from "zustand";

export const useAuthStore = create((set) => ({
    token: localStorage.getItem("spotify_token"),
    user: null,
    setToken: (token) => {
        localStorage.setItem("spotify_token", token);
        set({ token });
    },
    setUser: (user) => set({ user }),
    logout: () => {
        localStorage.removeItem("spotify_token");
        set({ token: null, user: null });
    },
}));