import { createContext } from "react";
import { User } from "@supabase/supabase-js";

export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: "customer" | "admin";
  updated_at: string | null;
}

export interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
