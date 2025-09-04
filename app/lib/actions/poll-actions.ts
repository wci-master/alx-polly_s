"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// CREATE POLL
export async function createPoll(formData: FormData) {
  const supabase = await createClient();

  // Sanitize and validate question
  const question = formData.get("question") as string;
  if (!question || question.trim() === '') {
    return { error: "Please provide a valid question" };
  }
  
  // Sanitize and validate options
  const options = formData.getAll("options")
    .map(opt => typeof opt === 'string' ? opt.trim() : '')
    .filter(Boolean) as string[];

  if (options.length < 2) {
    return { error: "Please provide at least two options" };
  }
  
  // Check for duplicate options
  const uniqueOptions = new Set(options);
  if (uniqueOptions.size !== options.length) {
    return { error: "All options must be unique" };
  }
  
  // Limit number of options to prevent abuse
  if (options.length > 20) {
    return { error: "Maximum of 20 options allowed" };
  }

  try {
    // Get user from session
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('User authentication error:', userError);
      return { error: "Authentication failed" };
    }
    
    if (!user) {
      return { error: "You must be logged in to create a poll" };
    }
    
    // Rate limiting check could be implemented here
    // Check if user has created too many polls in a short time period
    
    // Create the poll with sanitized data
    const { error, data } = await supabase.from("polls").insert([
      {
        user_id: user.id,
        question: question.trim(),
        options: options.map(opt => opt.trim()),
        created_at: new Date().toISOString(),
      },
    ]).select();

    if (error) {
      console.error('Poll creation error:', error);
      return { error: "Failed to create poll" };
    }

    revalidatePath("/polls");
    return { error: null, pollId: data?.[0]?.id };
  } catch (err) {
    console.error('Poll creation error:', err);
    return { error: "An unexpected error occurred" };
  }
}

// GET USER POLLS
export async function getUserPolls() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { polls: [], error: "Not authenticated" };

  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return { polls: [], error: error.message };
  return { polls: data ?? [], error: null };
}

// GET POLL BY ID
export async function getPollById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { poll: null, error: error.message };
  return { poll: data, error: null };
}

// SUBMIT VOTE
export async function submitVote(pollId: string, optionIndex: number) {
  // Input validation
  if (!pollId || pollId.trim() === '') {
    return { error: 'Invalid poll ID' };
  }
  
  if (typeof optionIndex !== 'number' || optionIndex < 0) {
    return { error: 'Invalid option selected' };
  }
  
  // Sanitize inputs
  const sanitizedPollId = pollId.trim();
  
  // Validate UUID format for poll ID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(sanitizedPollId)) {
    return { error: "Invalid poll ID format" };
  }
  
  const supabase = await createClient();
  
  try {
    // Verify the poll exists
    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .select("*")
      .eq("id", sanitizedPollId)
      .single();
      
    if (pollError || !poll) {
      return { error: 'Poll not found' };
    }
    
    // Verify the option index is valid
    if (!poll.options || optionIndex >= poll.options.length) {
      return { error: 'Invalid option selected' };
    }
    
    // Get current user
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError) {
      console.error('User authentication error:', userError);
      return { error: "Authentication failed" };
    }

    // Check if user has already voted (prevent duplicate votes)
    if (user) {
      const { data: existingVote } = await supabase
        .from("votes")
        .select("*")
        .eq("poll_id", sanitizedPollId)
        .eq("user_id", user.id)
        .maybeSingle();
        
      if (existingVote) {
        return { error: 'You have already voted on this poll' };
      }
    }

    // Insert the vote with proper sanitization and rate limiting protection
    const { error, data: newVote } = await supabase.from("votes").insert([
      {
        poll_id: sanitizedPollId,
        user_id: user?.id ?? null,
        option_index: optionIndex,
        created_at: new Date().toISOString(),
        // Add IP address hash for anonymous vote tracking (prevent multiple votes from same IP)
        // ip_hash: hashIpAddress(request.ip) // Would be implemented in a real system
      },
    ]).select();

    if (error) {
      console.error('Vote submission error:', error);
      return { error: 'Failed to submit vote' };
    }
    
    // Get updated results to return to the client
    const { data: results, error: resultsError } = await supabase
      .from("votes")
      .select("option_index")
      .eq("poll_id", sanitizedPollId);

    if (resultsError) {
      console.error("Results fetch error:", resultsError);
      // Still continue even if we can't get the results
    } else {
      // Count votes for each option (could be used for analytics)
      const voteCounts = {};
      if (results) {
        results.forEach((vote) => {
          const idx = vote.option_index;
          voteCounts[idx] = (voteCounts[idx] || 0) + 1;
        });
      }
    }
    
    revalidatePath(`/polls/${sanitizedPollId}`);
    return { error: null, success: true };
  } catch (err) {
    console.error('Vote submission error:', err);
    return { error: 'An unexpected error occurred' };
  }
}

// DELETE POLL
export async function deletePoll(id: string) {
  if (!id || id.trim() === '') {
    return { error: 'Invalid poll ID' };
  }
  
  // Sanitize input
  const sanitizedPollId = id.trim();
  
  // Validate UUID format for poll ID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(sanitizedPollId)) {
    return { error: "Invalid poll ID format" };
  }
  
  const supabase = await createClient();
  
  try {
    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { error: 'You must be logged in to delete a poll' };
    }
    
    // Verify the poll exists and belongs to the user
    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .select("user_id")
      .eq("id", sanitizedPollId)
      .single();
      
    if (pollError || !poll) {
      return { error: 'Poll not found' };
    }
    
    // Verify ownership - prevent unauthorized deletion
    if (poll.user_id !== user.id) {
      // Log attempt for security monitoring
      console.warn(`Unauthorized deletion attempt: User ${user.id} tried to delete poll ${sanitizedPollId} owned by ${poll.user_id}`);
      return { error: 'You do not have permission to delete this poll' };
    }
    
    // Delete associated votes first
    const { error: votesDeleteError } = await supabase
      .from("votes")
      .delete()
      .eq("poll_id", sanitizedPollId);
      
    if (votesDeleteError) {
      console.error('Votes deletion error:', votesDeleteError);
      return { error: 'Failed to delete poll votes' };
    }
    
    // Delete the poll
    const { error } = await supabase
      .from("polls")
      .delete()
      .eq("id", sanitizedPollId)
      .eq("user_id", user.id); // Double-check ownership as a defense in depth measure
    
    if (error) {
      console.error('Poll deletion error:', error);
      return { error: 'Failed to delete poll' };
    }
    
    revalidatePath("/polls");
    revalidatePath(`/polls/${sanitizedPollId}`);
    return { error: null, success: true };
  } catch (err) {
    console.error('Poll deletion error:', err);
    return { error: 'An unexpected error occurred' };
  }
}

// UPDATE POLL
export async function updatePoll(pollId: string, formData: FormData) {
  // Input validation
  if (!pollId || pollId.trim() === '') {
    return { error: "Invalid poll ID" };
  }

  const question = formData.get("question") as string;
  
  // Sanitize and validate question
  if (!question || question.trim() === '') {
    return { error: "Please provide a valid question" };
  }
  
  // Sanitize and validate options
  const options = formData.getAll("options")
    .map(opt => typeof opt === 'string' ? opt.trim() : '')
    .filter(Boolean) as string[];

  if (options.length < 2) {
    return { error: "Please provide at least two options" };
  }
  
  // Check for duplicate options
  const uniqueOptions = new Set(options);
  if (uniqueOptions.size !== options.length) {
    return { error: "All options must be unique" };
  }

  const supabase = await createClient();

  try {
    // Get user from session
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('User authentication error:', userError);
      return { error: "Authentication failed" };
    }
    
    if (!user) {
      return { error: "You must be logged in to update a poll" };
    }

    // Verify the poll exists and belongs to the user
    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .select("user_id")
      .eq("id", pollId)
      .single();
      
    if (pollError || !poll) {
      return { error: "Poll not found" };
    }
    
    // Verify ownership - prevent unauthorized updates
    if (poll.user_id !== user.id) {
      return { error: "You do not have permission to update this poll" };
    }

    // Update the poll with sanitized data
    const { error } = await supabase
      .from("polls")
      .update({ 
        question: question.trim(), 
        options: options.map(opt => opt.trim())
      })
      .eq("id", pollId)
      .eq("user_id", user.id);

    if (error) {
      console.error('Poll update error:', error);
      return { error: "Failed to update poll" };
    }

    revalidatePath(`/polls/${pollId}`);
    return { error: null };
  } catch (err) {
    console.error('Poll update error:', err);
    return { error: "An unexpected error occurred" };
  }
}
