/**
 * Landing Page Component
 * 
 * @description
 * The main landing page for the Todo Tracking Application. Displays a hero section
 * with app branding, call-to-action buttons for registration and login, and feature
 * highlights showcasing the app's core capabilities.
 * 
 * @usage
 * This component is automatically rendered at the root route ("/") of the application.
 * It serves as the entry point for unauthenticated users.
 * 
 * @example
 * // Accessed via browser at: http://localhost:3000/
 * // No props required - this is a Next.js page component
 * 
 * @features
 * - Hero section with app title and description
 * - "Get Started" button linking to registration page
 * - "Sign In" button linking to login page
 * - Three feature cards highlighting:
 *   1. Create Lists - Organize tasks into multiple lists
 *   2. Collaborate - Share lists with team members
 *   3. Track Progress - Monitor completion rates
 * 
 * @navigation
 * - /register - Redirects to user registration page
 * - /login - Redirects to user login page
 * 
 * @styling
 * - Responsive design with mobile-first approach
 * - Gradient background (blue-50 to indigo-100 in light mode)
 * - Dark mode support with automatic theme switching
 * - Uses Tailwind CSS for styling
 * - Uses shadcn/ui Button component
 * 
 * @returns Landing page with hero section and feature highlights
 */

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <main className="flex w-full max-w-4xl flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-8 flex items-center justify-center">
          <div className="rounded-full bg-blue-600 p-3">
            <CheckCircle2 className="h-8 w-8 text-white" />
          </div>
        </div>

        <h1 className="mb-4 text-5xl font-bold tracking-tight text-gray-900 dark:text-white">
          Todo Tracking App
        </h1>
        
        <p className="mb-8 max-w-2xl text-xl text-gray-600 dark:text-gray-300">
          Organize your tasks, collaborate with your team, and get things done efficiently.
        </p>

        <div className="mb-12 flex flex-col gap-4 sm:flex-row">
          <Button asChild size="lg" className="min-w-[160px]">
            <Link href="/register">Get Started</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="min-w-[160px]">
            <Link href="/login">Sign In</Link>
          </Button>
        </div>

        <div className="grid max-w-3xl gap-8 sm:grid-cols-3">
          <div className="flex flex-col items-center">
            <div className="mb-3 rounded-lg bg-blue-100 p-3 dark:bg-blue-900">
              <CheckCircle2 className="h-6 w-6 text-blue-600 dark:text-blue-300" />
            </div>
            <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">
              Create Lists
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Organize tasks into multiple lists for different projects
            </p>
          </div>

          <div className="flex flex-col items-center">
            <div className="mb-3 rounded-lg bg-blue-100 p-3 dark:bg-blue-900">
              <CheckCircle2 className="h-6 w-6 text-blue-600 dark:text-blue-300" />
            </div>
            <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">
              Collaborate
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Share lists with team members and work together
            </p>
          </div>

          <div className="flex flex-col items-center">
            <div className="mb-3 rounded-lg bg-blue-100 p-3 dark:bg-blue-900">
              <CheckCircle2 className="h-6 w-6 text-blue-600 dark:text-blue-300" />
            </div>
            <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">
              Track Progress
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Monitor completion rates and stay on top of your goals
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
