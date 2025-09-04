"use client";

import { useState, useEffect } from "react";
import { createPoll } from "@/app/lib/actions/poll-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function PollCreateForm() {
  const [options, setOptions] = useState(["", ""]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [csrfToken, setCsrfToken] = useState<string>('');
  
  // Generate CSRF token on component mount
  useEffect(() => {
    // In a real implementation, this would be fetched from the server
    const token = Math.random().toString(36).substring(2, 15);
    setCsrfToken(token);
    // Store in sessionStorage for verification
    sessionStorage.setItem('pollCsrfToken', token);
  }, []);

  const handleOptionChange = (idx: number, value: string) => {
    setOptions((opts) => opts.map((opt, i) => (i === idx ? value : opt)));
  };

  const addOption = () => setOptions((opts) => [...opts, ""]);
  const removeOption = (idx: number) => {
    if (options.length > 2) {
      setOptions((opts) => opts.filter((_, i) => i !== idx));
    }
  };

  // Client-side validation function
  const validateForm = (formData: FormData): string | null => {
    const question = formData.get('question') as string;
    if (!question || question.trim() === '') {
      return 'Please provide a valid question';
    }
    
    // Check if all options are filled
    const formOptions = formData.getAll('options') as string[];
    const validOptions = formOptions.filter(opt => opt && opt.trim() !== '');
    
    if (validOptions.length < 2) {
      return 'Please provide at least two options';
    }
    
    // Check for duplicate options
    const uniqueOptions = new Set(validOptions.map(opt => opt.trim()));
    if (uniqueOptions.size !== validOptions.length) {
      return 'All options must be unique';
    }
    
    return null;
  };
  
  return (
    <form
      action={async (formData) => {
        setError(null);
        setSuccess(false);
        
        // Verify CSRF token
        const formCsrfToken = formData.get('csrfToken') as string;
        const storedToken = sessionStorage.getItem('pollCsrfToken');
        
        if (formCsrfToken !== storedToken) {
          setError('Security validation failed. Please refresh the page and try again.');
          return;
        }
        
        // Client-side validation
        const validationError = validateForm(formData);
        if (validationError) {
          setError(validationError);
          return;
        }
        
        try {
          const res = await createPoll(formData);
          if (res?.error) {
            setError(res.error);
          } else {
            // Clear sensitive data
            sessionStorage.removeItem('pollCsrfToken');
            // Generate new CSRF token
            const newToken = Math.random().toString(36).substring(2, 15);
            sessionStorage.setItem('pollCsrfToken', newToken);
            
            setSuccess(true);
            setTimeout(() => {
              window.location.href = "/polls";
            }, 1200);
          }
        } catch (err) {
          console.error('Poll creation error:', err);
          setError('An unexpected error occurred. Please try again.');
        }
      }}
      className="space-y-6 max-w-md mx-auto"
    >
      <div>
        <Label htmlFor="question">Poll Question</Label>
        <Input name="question" id="question" required />
      </div>
      <div>
        <Label>Options</Label>
        {options.map((opt, idx) => (
          <div key={idx} className="flex items-center gap-2 mb-2">
            <Input
              name="options"
              value={opt}
              onChange={(e) => handleOptionChange(idx, e.target.value)}
              required
            />
            {options.length > 2 && (
              <Button type="button" variant="destructive" onClick={() => removeOption(idx)}>
                Remove
              </Button>
            )}
          </div>
        ))}
        <Button type="button" onClick={addOption} variant="secondary">
          Add Option
        </Button>
      </div>
      {/* Hidden CSRF token field */}
      <Input 
        type="hidden" 
        name="csrfToken" 
        value={csrfToken} 
      />
      
      {error && (
        <Alert variant="destructive">
          <AlertDescription className="text-red-500">{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert>
          <AlertDescription className="text-green-600">Poll created! Redirecting...</AlertDescription>
        </Alert>
      )}
      
      <Button 
        type="submit" 
        disabled={!csrfToken || success}
      >
        Create Poll
      </Button>
    </form>
  );
}