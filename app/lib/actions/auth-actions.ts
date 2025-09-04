'use server';

import { createClient } from '@/lib/supabase/server';
import { LoginFormData, RegisterFormData } from '../types';

export async function login(data: LoginFormData) {
  // Validate input data
  if (!data.email || !data.password) {
    return { error: "Email and password are required" };
  }
  
  // Rate limiting check could be implemented here
  
  const supabase = await createClient();

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email.trim().toLowerCase(),
      password: data.password,
    });

    if (error) {
      // Use generic error message to prevent user enumeration
      return { error: "Invalid login credentials" };
    }

    // Success: no error
    return { error: null };
  } catch (err) {
    console.error("Login error:", err);
    return { error: "An unexpected error occurred" };
  }
}

export async function register(data: RegisterFormData) {
  // Validate input data
  if (!data.email || !data.password || !data.name) {
    return { error: "All fields are required" };
  }
  
  // Password strength validation
  if (data.password.length < 8) {
    return { error: "Password must be at least 8 characters long" };
  }
  
  // Check for common password patterns
  const commonPasswords = ['password', '12345678', 'qwerty123'];
  if (commonPasswords.includes(data.password.toLowerCase())) {
    return { error: "Please use a stronger password" };
  }
  
  const supabase = await createClient();

  try {
    const { error } = await supabase.auth.signUp({
      email: data.email.trim().toLowerCase(),
      password: data.password,
      options: {
        data: {
          name: data.name.trim(),
        },
      },
    });

    if (error) {
      // Sanitize error message to prevent information disclosure
      if (error.message.includes("already registered")) {
        return { error: "This email is already registered" };
      }
      return { error: "Registration failed. Please try again." };
    }

    // Success: no error
    return { error: null };
  } catch (err) {
    console.error("Registration error:", err);
    return { error: "An unexpected error occurred" };
  }
}

export async function logout() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    return { error: error.message };
  }
  return { error: null };
}

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function getSession() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getSession();
  return data.session;
}
