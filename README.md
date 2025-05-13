
# NSBS Learning Platform

A comprehensive text-based learning platform designed for self-paced business education with certification capabilities.

## Features

- Text-based educational content with rich formatting
- Self-paced learning structure with progress tracking
- Distraction-free, minimal UI focused on content
- Secure authentication with Better Auth integration
- Hierarchical course structure (Courses > Modules > Lessons)
- Final exam assessment system with certification
- Stripe payment integration for course purchases
- Responsive design with dark mode support
- WCAG 2.1 AA accessibility compliance

## Technical Stack

- **Frontend**: Next.js with React 19
- **Styling**: Tailwind CSS with shadcn/ui components
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Better Auth
- **Payments**: Stripe
- **State Management**: React Query and Zustand
- **Form Handling**: React Hook Form with Zod validation

## Getting Started

1. Clone this repository
2. Copy `.env.example` to `.env.local` and fill in required values
3. Install dependencies: `npm install`
4. Run database migrations: `npm run db:migrate`
5. Seed the database: `npm run db:seed`
6. Start the development server: `npm run dev`

## Core Requirements

- Text-based content only (no videos, audio, external links)
- No assignments, activities, or interactive exercises
- No social or collaborative features
- No instructor interaction or teaching elements
- No prerequisites between courses
- One-time payments only (no subscriptions)
- No time estimates or deadlines
- Focus on clean, distraction-free UI

## Database Schema

The platform uses a PostgreSQL database with the following core models:
- Users (managed by Better Auth)
- Courses
- Modules
- Lessons
- Enrollments
- Exam Attempts
- Certificates

See `prisma/schema.prisma` for the complete schema definition.
