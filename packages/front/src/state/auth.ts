import { atom } from 'recoil';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  clientId?: string;
  mustChangePassword?: boolean;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
}

const storedToken = localStorage.getItem('accessToken');
const storedUser = localStorage.getItem('user');

export const authState = atom<AuthState>({
  key: 'authState',
  default: {
    isAuthenticated: !!storedToken,
    user: storedUser ? JSON.parse(storedUser) : null,
    accessToken: storedToken,
  },
});
