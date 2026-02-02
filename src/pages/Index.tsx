import { Bird, Map, Users, TrendingUp, Camera, Database } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { StatCard } from "@/components/dashboard/StatCard";
import { MapPreview } from "@/components/dashboard/MapPreview";
import { TimelineSlider } from "@/components/dashboard/TimelineSlider";
import { SpeciesCard } from "@/components/dashboard/SpeciesCard";
import { ImageAnalysisPreview } from "@/components/dashboard/ImageAnalysisPreview";
import { RecentActivity } from "@/components/dashboard/RecentActivity";

const speciesData = [
  {
    name: "Brown Pelican",
    scientificName: "Pelecanus occidentalis",
    population: 4250,
    trend: "up" as const,
    trendValue: "+12%",
    color: "#D4A574",
  },
  {
    name: "Great Egret",
    scientificName: "Ardea alba",
    population: 2890,
    trend: "stable" as const,
    trendValue: "+2%",
    color: "#E8E8E8",
  },
  {
    name: "Roseate Spoonbill",
    scientificName: "Platalea ajaja",
    population: 1420,
    trend: "down" as const,
    trendValue: "-8%",
    color: "#FFB5C5",
  },
  {
    name: "Royal Tern",
    scientificName: "Thalasseus maximus",
    population: 3650,
    trend: "up" as const,
    trendValue: "+5%",
    color: "#B0C4DE",
  },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-24 pb-12 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-success/5 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 lg:px-8 relative">
          <div className="max-w-4xl mx-auto text-center mb-12 stagger-children">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
              <Bird className="h-4 w-4" />
              <span>Geospatial Wildlife Intelligence</span>
            </div>

            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Monitor & Protect
              <span className="block text-gradient-gold">Louisiana's Avian Heritage</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Transform decades of survey data into actionable conservation insights.
              Specto brings AI-powered analysis to coastal bird colony monitoring.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <a
                href="/data"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-lg shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:scale-[1.02] transition-all"
              >
                <TrendingUp className="h-5 w-5" />
                Explore Data
              </a>
              <a
                href="/map"
                className="inline-flex items-center gap-2 border-2 border-foreground/20 bg-transparent text-foreground font-semibold px-6 py-3 rounded-lg hover:bg-foreground/10 hover:border-foreground/30 transition-all"
              >
                <Map className="h-5 w-5" />
                View Map
              </a>
              <a
                href="/analysis"
                className="inline-flex items-center gap-2 border-2 border-foreground/20 bg-transparent text-foreground font-semibold px-6 py-3 rounded-lg hover:bg-foreground/10 hover:border-foreground/30 transition-all"
              >
                <Camera className="h-5 w-5" />
                Image Analysis
              </a>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            <StatCard
              title="Active Colonies"
              value="156"
              change="+12 this season"
              changeType="positive"
              icon={Bird}
            />
            <StatCard
              title="Species Tracked"
              value="47"
              description="Waterbirds & shorebirds"
              icon={Users}
            />
            <StatCard
              title="Survey Images"
              value="284K"
              change="+8.2K this month"
              changeType="positive"
              icon={Camera}
            />
            <StatCard
              title="Years of Data"
              value="34"
              description="Since 1990"
              icon={Database}
            />
          </div>
        </div>
      </section>

      {/* Main Dashboard Content */}
      <section className="pb-12">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Map Section - Takes 2 columns */}
            <div className="lg:col-span-2 space-y-6">
              <MapPreview />
              <ImageAnalysisPreview />
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              <TimelineSlider />

              {/* Species Overview */}
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-semibold">Top Species</h3>
                  <button className="text-sm text-primary hover:underline">
                    View all
                  </button>
                </div>
                <div className="space-y-3">
                  {speciesData.map((species) => (
                    <SpeciesCard key={species.name} {...species} />
                  ))}
                </div>
              </div>

              <RecentActivity />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                <Bird className="h-4 w-4 text-primary" />
              </div>
              <span className="font-display font-semibold">Specto</span>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Supporting wildlife conservation along Louisiana's coast
            </p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">About</a>
              <a href="#" className="hover:text-foreground transition-colors">Documentation</a>
              <a href="#" className="hover:text-foreground transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
