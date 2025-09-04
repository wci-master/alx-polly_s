# ALX Polly: A Polling Application

Welcome to ALX Polly, a full-stack polling application built with Next.js, TypeScript, and Supabase. This project serves as a practical learning ground for modern web development concepts, with a special focus on identifying and fixing common security vulnerabilities.

## About the Application

ALX Polly allows authenticated users to create, share, and vote on polls. It's a simple yet powerful application that demonstrates key features of modern web development:

-   **Authentication**: Secure user sign-up and login.
-   **Poll Management**: Users can create, view, and delete their own polls.
-   **Voting System**: A straightforward system for casting and viewing votes.
-   **User Dashboard**: A personalized space for users to manage their polls.

The application is built with a modern tech stack:

-   **Framework**: [Next.js](https://nextjs.org/) (App Router)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Backend & Database**: [Supabase](https://supabase.io/)
-   **UI**: [Tailwind CSS](https://tailwindcss.com/) with [shadcn/ui](https://ui.shadcn.com/)
-   **State Management**: React Server Components and Client Components

---

## 🚀 The Challenge: Security Audit & Remediation

As a developer, writing functional code is only half the battle. Ensuring that the code is secure, robust, and free of vulnerabilities is just as critical. This version of ALX Polly has been intentionally built with several security flaws, providing a real-world scenario for you to practice your security auditing skills.

**Your mission is to act as a security engineer tasked with auditing this codebase.**

### Your Objectives:

1.  **Identify Vulnerabilities**:
    -   Thoroughly review the codebase to find security weaknesses.
    -   Pay close attention to user authentication, data access, and business logic.
    -   Think about how a malicious actor could misuse the application's features.

2.  **Understand the Impact**:
    -   For each vulnerability you find, determine the potential impact.Query your AI assistant about it. What data could be exposed? What unauthorized actions could be performed?

3.  **Propose and Implement Fixes**:
    -   Once a vulnerability is identified, ask your AI assistant to fix it.
    -   Write secure, efficient, and clean code to patch the security holes.
    -   Ensure that your fixes do not break existing functionality for legitimate users.

### Where to Start?

A good security audit involves both static code analysis and dynamic testing. Here's a suggested approach:

1.  **Familiarize Yourself with the Code**:
    -   Start with `app/lib/actions/` to understand how the application interacts with the database.
    -   Explore the page routes in the `app/(dashboard)/` directory. How is data displayed and managed?
    -   Look for hidden or undocumented features. Are there any pages not linked in the main UI?

2.  **Use Your AI Assistant**:
    -   This is an open-book test. You are encouraged to use AI tools to help you.
    -   Ask your AI assistant to review snippets of code for security issues.
    -   Describe a feature's behavior to your AI and ask it to identify potential attack vectors.
    -   When you find a vulnerability, ask your AI for the best way to patch it.

## 🔒 Security Audit Results

The following security vulnerabilities were identified and fixed in the ALX Polly application:

### Authentication System Vulnerabilities

#### 1. Lack of Input Validation

**Vulnerability**: The authentication system did not properly validate user inputs, making it susceptible to various injection attacks and malformed data.

**Impact**: Attackers could potentially bypass authentication, cause application errors, or inject malicious data.

**Fix**: Implemented comprehensive input validation for all authentication functions:
- Added email format validation
- Added password strength requirements
- Sanitized and validated all user inputs before processing

#### 2. User Enumeration

**Vulnerability**: The login function returned specific error messages that could reveal whether a username exists in the system.

**Impact**: Attackers could use this information to enumerate valid usernames, making brute force attacks more effective.

**Fix**: Implemented generic error messages that do not reveal whether the username or password was incorrect:
- Changed specific error messages to generic "Invalid credentials" messages
- Ensured consistent response times regardless of whether the user exists

#### 3. Missing CSRF Protection

**Vulnerability**: The authentication forms lacked Cross-Site Request Forgery (CSRF) protection.

**Impact**: Attackers could trick authenticated users into submitting unauthorized requests that change their account state.

**Fix**: Implemented CSRF protection across all authentication forms:
- Added CSRF token generation on form load
- Added token validation on form submission
- Implemented token rotation after successful authentication

### Poll Management System Vulnerabilities

#### 1. Insufficient Authorization Checks

**Vulnerability**: The poll deletion and update functions did not properly verify ownership before allowing modifications.

**Impact**: Users could potentially modify or delete polls they did not own.

**Fix**: Implemented strict ownership verification:
- Added user ID checks before any poll modification
- Implemented double-checking of ownership as a defense-in-depth measure
- Added logging of unauthorized modification attempts

#### 2. Missing Input Validation

**Vulnerability**: Poll creation and voting functions lacked proper input validation.

**Impact**: Malicious users could submit invalid data, potentially causing application errors or data corruption.

**Fix**: Added comprehensive input validation:
- Validated poll IDs against UUID format
- Checked for empty or duplicate poll options
- Validated vote submissions against available options
- Sanitized all user inputs

#### 3. No Protection Against Duplicate Votes

**Vulnerability**: The voting system did not adequately prevent users from voting multiple times on the same poll.

**Impact**: Poll results could be manipulated by submitting multiple votes.

**Fix**: Implemented robust duplicate vote prevention:
- Added database checks for existing votes from the same user
- Implemented proper error messages for duplicate vote attempts
- Added timestamps to vote records for audit purposes

#### 4. Missing CSRF Protection in Poll Operations

**Vulnerability**: Poll creation, voting, and deletion forms lacked CSRF protection.

**Impact**: Attackers could trick users into performing unwanted poll operations.

**Fix**: Added CSRF protection to all poll-related forms:
- Implemented token generation and validation
- Added token rotation after successful operations
- Disabled form submission without valid tokens

### Client-Side Security Improvements

#### 1. Improved Form Validation

**Vulnerability**: Client-side validation was minimal or non-existent.

**Impact**: Users could submit invalid data, leading to poor user experience and potential server-side issues.

**Fix**: Enhanced client-side validation:
- Added real-time validation for form inputs
- Implemented clear error messages
- Disabled submission of invalid forms

#### 2. Secure Form Handling

**Vulnerability**: Form submissions did not properly handle errors or provide feedback.

**Impact**: Users might not know if their actions succeeded or failed, leading to confusion and potential duplicate submissions.

**Fix**: Improved form handling:
- Added loading states during submissions
- Implemented clear success and error messages
- Added proper redirection after successful operations

---

## Getting Started

To begin your security audit, you'll need to get the application running on your local machine.

### 1. Prerequisites

-   [Node.js](https://nodejs.org/) (v20.x or higher recommended)
-   [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
-   A [Supabase](https://supabase.io/) account (the project is pre-configured, but you may need your own for a clean slate).

### 2. Installation

Clone the repository and install the dependencies:

```bash
git clone <repository-url>
cd alx-polly
npm install
```

### 3. Environment Variables

The project uses Supabase for its backend. An environment file `.env.local` is needed.Use the keys you created during the Supabase setup process.

### 4. Running the Development Server

Start the application in development mode:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

Good luck, engineer! This is your chance to step into the shoes of a security professional and make a real impact on the quality and safety of this application. Happy hunting!
