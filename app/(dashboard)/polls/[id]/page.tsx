'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getPollById, submitVote } from '@/app/lib/actions/poll-actions';

// Mock data for a single poll
const mockPoll = {
  id: '1',
  title: 'Favorite Programming Language',
  description: 'What programming language do you prefer to use?',
  options: [
    { id: '1', text: 'JavaScript', votes: 15 },
    { id: '2', text: 'Python', votes: 12 },
    { id: '3', text: 'Java', votes: 8 },
    { id: '4', text: 'C#', votes: 5 },
    { id: '5', text: 'Go', votes: 2 },
  ],
  totalVotes: 42,
  createdAt: '2023-10-15',
  createdBy: 'John Doe',
};

export default function PollDetailPage({ params }: { params: { id: string } }) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [csrfToken, setCsrfToken] = useState<string>('');
  const [loading, setLoading] = useState(true);
  
  // Generate CSRF token on component mount
  useEffect(() => {
    // Generate CSRF token
    const token = Math.random().toString(36).substring(2, 15);
    setCsrfToken(token);
    sessionStorage.setItem('voteCsrfToken', token);
    setLoading(false);
  }, []);

  // In a real app, you would fetch the poll data based on the ID
  const poll = mockPoll;
  const totalVotes = poll.options.reduce((sum, option) => sum + option.votes, 0);

  const handleVote = async () => {
    if (!selectedOption) {
      setError("Please select an option");
      return;
    }
    
    // Verify CSRF token
    const storedToken = sessionStorage.getItem('voteCsrfToken');
    if (csrfToken !== storedToken) {
      setError('Security validation failed. Please refresh the page and try again.');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // In a real app, this would call the API
      const result = await submitVote(params.id, selectedOption);
      
      if (result?.error) {
        setError(result.error);
      } else {
        // Clear sensitive data
        sessionStorage.removeItem('voteCsrfToken');
        // Generate new CSRF token
        const newToken = Math.random().toString(36).substring(2, 15);
        sessionStorage.setItem('voteCsrfToken', newToken);
        
        setHasVoted(true);
      }
    } catch (err) {
      console.error('Vote submission error:', err);
      setError("Failed to submit vote. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPercentage = (votes: number) => {
    if (totalVotes === 0) return 0;
    return Math.round((votes / totalVotes) * 100);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/polls" className="text-blue-600 hover:underline">
          &larr; Back to Polls
        </Link>
        <div className="flex space-x-2">
          <Button variant="outline" asChild>
            <Link href={`/polls/${params.id}/edit`}>Edit Poll</Link>
          </Button>
          <Button variant="outline" className="text-red-500 hover:text-red-700">
            Delete
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{poll.title}</CardTitle>
          <CardDescription>{poll.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!hasVoted ? (
            <div className="space-y-3">
              {poll.options.map((option) => (
                <div 
                  key={option.id} 
                  className={`p-3 border rounded-md cursor-pointer transition-colors ${selectedOption === option.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-slate-50'}`}
                  onClick={() => setSelectedOption(option.id)}
                >
                  {option.text}
                </div>
              ))}
              {/* Hidden CSRF token field */}
              <input 
                type="hidden" 
                name="csrfToken" 
                value={csrfToken} 
              />
              
              {error && (
                <Alert variant="destructive" className="mt-2">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <Button 
                onClick={handleVote} 
                disabled={!selectedOption || isSubmitting || !csrfToken} 
                className="mt-4"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Vote'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="font-medium">Results:</h3>
              {poll.options.map((option) => (
                <div key={option.id} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{option.text}</span>
                    <span>{getPercentage(option.votes)}% ({option.votes} votes)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ width: `${getPercentage(option.votes)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
              <div className="text-sm text-slate-500 pt-2">
                Total votes: {totalVotes}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="text-sm text-slate-500 flex justify-between">
          <span>Created by {poll.createdBy}</span>
          <span>Created on {new Date(poll.createdAt).toLocaleDateString()}</span>
        </CardFooter>
      </Card>

      <div className="pt-4">
        <h2 className="text-xl font-semibold mb-4">Share this poll</h2>
        <div className="flex space-x-2">
          <Button variant="outline" className="flex-1">
            Copy Link
          </Button>
          <Button variant="outline" className="flex-1">
            Share on Twitter
          </Button>
        </div>
      </div>
    </div>
  );
}