import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Building2, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="px-6 py-4 border-b flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-2 text-primary">
          <Building2 className="h-6 w-6" />
          <span className="font-bold text-lg tracking-tight">AHS Portal</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost" className="font-medium">Sign in</Button>
          </Link>
          <Link href="/register">
            <Button className="font-medium">Apply Now</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="py-24 px-6 md:py-32 lg:py-40 flex flex-col items-center text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary hover:bg-primary/20 mb-6">
            Admissions Open for 2024-2025
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6 leading-tight">
            Allied Health Sciences <br className="hidden md:block"/>
            <span className="text-primary">Admissions Portal</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
            The official central portal for managing applications, merit lists, and enrollment for all Allied Health programs at Nishtar Medical University.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-base">
                Start Your Application <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-8 text-base">
                Check Application Status
              </Button>
            </Link>
          </div>
        </section>

        <section className="py-16 px-6 bg-muted/30 border-t">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-8 text-center">Important Notices</h2>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[
                { title: "Admissions Schedule Announced", date: "Oct 15, 2024", type: "Admission" },
                { title: "Fee Submission Guidelines", date: "Oct 12, 2024", type: "Payment" },
                { title: "Documents Required for Verification", date: "Oct 10, 2024", type: "General" }
              ].map((notice, i) => (
                <div key={i} className="bg-background rounded-xl p-6 border shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                      {notice.type}
                    </span>
                    <span className="text-xs text-muted-foreground">{notice.date}</span>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{notice.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    Please click here to read the full details of this notification regarding the ongoing admission process.
                  </p>
                  <Button variant="link" className="px-0 mt-4 h-auto text-primary">Read more <ArrowRight className="ml-1 h-3 w-3" /></Button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 px-6 border-t text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Allied Health College, Nishtar Medical University. All rights reserved.</p>
      </footer>
    </div>
  );
}
