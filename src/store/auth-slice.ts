import { defaultAPIEndpoint } from '@constants/apiEndpoints';
import { StoreSlice } from './store';

export interface AuthSlice {
  userName?: string;
  apiKey?: string;
  apiEndpoint: string;
  firstVisit: boolean;
  setUserName: (userName: string) => void;
  setApiKey: (apiKey: string) => void;
  setApiEndpoint: (apiEndpoint: string) => void;
  setFirstVisit: (firstVisit: boolean) => void;
}

export const createAuthSlice: StoreSlice<AuthSlice> = (set, get) => ({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || undefined,
  apiEndpoint: defaultAPIEndpoint,
  firstVisit: true,
  setUserName: (userName: string) => {
    set((prev: AuthSlice) => ({
      ...prev,
      userName: userName,
    }));
  },  setApiKey: (apiKey: string) => {
    set((prev: AuthSlice) => ({
      ...prev,
      apiKey: apiKey,
    }));
  },
  setApiEndpoint: (apiEndpoint: string) => {
    set((prev: AuthSlice) => ({
      ...prev,
      apiEndpoint: apiEndpoint,
    }));
  },
  setFirstVisit: (firstVisit: boolean) => {
    set((prev: AuthSlice) => ({
      ...prev,
      firstVisit: firstVisit,
    }));
  },
});
