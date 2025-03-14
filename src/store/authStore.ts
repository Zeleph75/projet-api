import { create } from "zustand";

interface AuthState {
    token: string | null;
    user: any;
    setToken: (token: string) => void;
    setUser: (user: any) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
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
