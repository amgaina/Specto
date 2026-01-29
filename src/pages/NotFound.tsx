import { Link } from "react-router-dom";
import { Bird, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="relative inline-block mb-8">
          <div className="h-24 w-24 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
            <Bird className="h-12 w-12 text-primary" />
          </div>
          <div className="absolute -inset-4 rounded-3xl bg-primary/5 blur-xl -z-10" />
        </div>

        {/* Text */}
        <h1 className="font-display text-6xl font-bold mb-4">404</h1>
        <h2 className="font-display text-2xl font-semibold mb-4">
          Page Not Found
        </h2>
        <p className="text-muted-foreground mb-8">
          The page you're looking for seems to have flown away. Let's get you back on track.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button variant="hero" asChild>
            <Link to="/">
              <Home className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}
