'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { login } from '@/app/lib/actions/auth-actions';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [csrfToken, setCsrfToken] = useState<string>('');
  
  // Generate CSRF token on component mount
  useEffect(() => {
    // In a real implementation, this would be fetched from the server
    const token = Math.random().toString(36).substring(2, 15);
    setCsrfToken(token);
    // Store in sessionStorage for verification
    sessionStorage.setItem('csrfToken', token);
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    // Client-side validation
    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const formCsrfToken = formData.get('csrfToken') as string;
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }
    
    // Validate password is not empty
    if (!password || password.trim() === '') {
      setError('Password is required');
      setLoading(false);
      return;
    }
    
    // Verify CSRF token
    const storedToken = sessionStorage.getItem('csrfToken');
    if (formCsrfToken !== storedToken) {
      setError('Security validation failed. Please refresh the page and try again.');
      setLoading(false);
      return;
    }

    try {
      const result = await login({ email, password });

      if (result?.error) {
        setError(result.error);
        setLoading(false);
      } else {
        // Clear sensitive data
        sessionStorage.removeItem('csrfToken');
        // Regenerate CSRF token for next login attempt
        const newToken = Math.random().toString(36).substring(2, 15);
        sessionStorage.setItem('csrfToken', newToken);
        
        // Redirect to dashboard
        window.location.href = '/polls'; // Full reload to pick up session
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Login to ALX Polly</CardTitle>
          <CardDescription className="text-center">Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                name="email"
                type="email" 
                placeholder="your@email.com" 
                required
                autoComplete="email"
                aria-describedby="email-error"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                name="password"
                type="password" 
                required
                autoComplete="current-password"
                aria-describedby="password-error"
              />
            </div>
            {/* Hidden CSRF token field */}
            <Input 
              type="hidden" 
              name="csrfToken" 
              value={csrfToken} 
            />
            {error && <p id="form-error" role="alert" className="text-red-500 text-sm">{error}</p>}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !csrfToken}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-slate-500">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-blue-600 hover:underline">
              Register
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}