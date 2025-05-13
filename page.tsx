
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/auth';

export default async function Home() {
  const session = await auth.getSession();
  
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="container py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold">NSBS Platform</span>
          </div>
          <nav>
            {session?.user ? (
              <Link href="/dashboard">
                <Button>Dashboard</Button>
              </Link>
            ) : (
              <div className="flex items-center space-x-4">
                <Link href="/login">
                  <Button variant="outline">Log in</Button>
                </Link>
                <Link href="/register">
                  <Button>Register</Button>
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>
      
      <main className="flex-1">
        <section className="py-20 md:py-32">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Professional Business Education
              </h1>
              <p className="text-xl mb-10 text-muted-foreground">
                Text-based courses with real-world applications. Self-paced learning designed for professionals.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                {session?.user ? (
                  <Link href="/dashboard">
                    <Button size="lg">Continue Learning</Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/register">
                      <Button size="lg">Get Started</Button>
                    </Link>
                    <Link href="/courses">
                      <Button size="lg" variant="outline">Browse Courses</Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
        
        <section className="py-16 bg-slate-50 dark:bg-slate-900">
          <div className="container">
            <h2 className="text-3xl font-bold text-center mb-12">
              Featured Courses
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Course previews would go here */}
              <div className="border rounded-lg overflow-hidden bg-white dark:bg-slate-950">
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">Strategic Planning and Execution</h3>
                  <p className="text-muted-foreground mb-4">
                    Master the art of strategic planning and execution in business environments.
                  </p>
                  <Link href="/courses">
                    <Button variant="outline" className="w-full">Learn More</Button>
                  </Link>
                </div>
              </div>
              
              <div className="border rounded-lg overflow-hidden bg-white dark:bg-slate-950">
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">Project Management Fundamentals</h3>
                  <p className="text-muted-foreground mb-4">
                    Essential project management principles for delivering successful business initiatives.
                  </p>
                  <Link href="/courses">
                    <Button variant="outline" className="w-full">Learn More</Button>
                  </Link>
                </div>
              </div>
              
              <div className="border rounded-lg overflow-hidden bg-white dark:bg-slate-950">
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">Financial Management for Non-Financial Managers</h3>
                  <p className="text-muted-foreground mb-4">
                    Essential financial concepts for managers without a financial background.
                  </p>
                  <Link href="/courses">
                    <Button variant="outline" className="w-full">Learn More</Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <footer className="border-t py-8">
        <div className="container text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} NSBS Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
