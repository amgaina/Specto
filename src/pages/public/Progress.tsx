import { PublicHeader } from "@/components/layout/PublicHeader";
import Achievements from "./Achievements";
import VolunteerHours from "./Volunteer";

export default function Progress() {
    return (
        <div className="min-h-screen bg-background">
            <PublicHeader />
            <main className="container mx-auto px-4 lg:px-8 pt-12 pb-12 space-y-8">
                <div>
                    <h1 className="text-xl font-bold mb-1">My Progress</h1>
                    <p className="text-sm text-muted-foreground">Track your badges, achievements, and volunteer contributions</p>
                </div>
                <Achievements embedded />
                <VolunteerHours embedded />
            </main>
        </div>
    );
}
