import { useState } from "react";
import { Header } from "@/components/layout/Header";
import {
  User,
  Bell,
  Map,
  Database,
  Shield,
  Palette,
  ChevronRight,
  Save,
  Mail,
  Phone,
  Building,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const settingsSections = [
  { id: "profile", name: "Profile", icon: User },
  { id: "notifications", name: "Notifications", icon: Bell },
  { id: "map", name: "Map Preferences", icon: Map },
  { id: "data", name: "Data & Export", icon: Database },
  { id: "security", name: "Security", icon: Shield },
  { id: "appearance", name: "Appearance", icon: Palette },
];

export default function Settings() {
  const [activeSection, setActiveSection] = useState("profile");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-16">
        <div className="container mx-auto px-4 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
              Settings
            </h1>
            <p className="text-muted-foreground">
              Manage your account preferences and application settings
            </p>
          </div>

          <div className="grid lg:grid-cols-4 gap-6">
            {/* Sidebar Navigation */}
            <aside className="lg:col-span-1">
              <nav className="glass-card p-2 space-y-1">
                {settingsSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors",
                      activeSection === section.id
                        ? "bg-primary/10 text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    )}
                  >
                    <section.icon className="h-5 w-5" />
                    <span className="font-medium">{section.name}</span>
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 ml-auto transition-transform",
                        activeSection === section.id && "rotate-90"
                      )}
                    />
                  </button>
                ))}
              </nav>
            </aside>

            {/* Settings Content */}
            <div className="lg:col-span-3">
              {activeSection === "profile" && (
                <div className="glass-card p-6 animate-fade-in">
                  <h2 className="font-display text-xl font-semibold mb-6">
                    Profile Settings
                  </h2>

                  <div className="space-y-6">
                    {/* Avatar */}
                    <div className="flex items-center gap-6">
                      <div className="h-20 w-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <User className="h-10 w-10 text-primary" />
                      </div>
                      <div>
                        <Button variant="outline" size="sm">
                          Change Avatar
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">
                          JPG, PNG or GIF. Max size 2MB.
                        </p>
                      </div>
                    </div>

                    {/* Form Fields */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Full Name
                        </label>
                        <input
                          type="text"
                          defaultValue="Dr. Sarah Mitchell"
                          className="w-full px-4 py-2 bg-background/50 border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Job Title
                        </label>
                        <input
                          type="text"
                          defaultValue="Wildlife Biologist"
                          className="w-full px-4 py-2 bg-background/50 border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email Address
                      </label>
                      <input
                        type="email"
                        defaultValue="s.mitchell@ldwf.gov"
                        className="w-full px-4 py-2 bg-background/50 border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Phone
                        </label>
                        <input
                          type="tel"
                          defaultValue="+1 (504) 555-0123"
                          className="w-full px-4 py-2 bg-background/50 border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          Organization
                        </label>
                        <input
                          type="text"
                          defaultValue="Louisiana Dept. of Wildlife"
                          className="w-full px-4 py-2 bg-background/50 border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Timezone
                      </label>
                      <select className="w-full px-4 py-2 bg-background/50 border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50">
                        <option>Central Time (US & Canada)</option>
                        <option>Eastern Time (US & Canada)</option>
                        <option>Pacific Time (US & Canada)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "notifications" && (
                <div className="glass-card p-6 animate-fade-in">
                  <h2 className="font-display text-xl font-semibold mb-6">
                    Notification Preferences
                  </h2>

                  <div className="space-y-6">
                    {[
                      {
                        title: "Survey Completion Alerts",
                        description: "Get notified when new surveys are processed",
                        enabled: true,
                      },
                      {
                        title: "Population Decline Warnings",
                        description:
                          "Receive alerts when significant population declines are detected",
                        enabled: true,
                      },
                      {
                        title: "Weekly Summary Reports",
                        description: "Receive weekly email summaries of colony activity",
                        enabled: false,
                      },
                      {
                        title: "System Updates",
                        description: "Be notified about new features and improvements",
                        enabled: true,
                      },
                    ].map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{item.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.description}
                          </p>
                        </div>
                        <button
                          className={cn(
                            "relative h-6 w-11 rounded-full transition-colors",
                            item.enabled ? "bg-primary" : "bg-muted"
                          )}
                        >
                          <span
                            className={cn(
                              "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform",
                              item.enabled && "translate-x-5"
                            )}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeSection === "map" && (
                <div className="glass-card p-6 animate-fade-in">
                  <h2 className="font-display text-xl font-semibold mb-6">
                    Map Preferences
                  </h2>

                  <div className="space-y-6">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Default Map Style
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {["Satellite", "Terrain", "Standard"].map((style) => (
                          <button
                            key={style}
                            className={cn(
                              "p-4 rounded-lg border text-center transition-colors",
                              style === "Satellite"
                                ? "border-primary bg-primary/10"
                                : "border-border/50 hover:border-primary/50"
                            )}
                          >
                            <div className="h-12 w-full rounded bg-secondary/50 mb-2" />
                            <span className="text-sm font-medium">{style}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Default Region
                      </label>
                      <select className="w-full px-4 py-2 bg-background/50 border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50">
                        <option>All Louisiana Coast</option>
                        <option>Barataria-Terrebonne Basin</option>
                        <option>Mississippi River Delta</option>
                        <option>Chenier Plain</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                      <div>
                        <p className="font-medium">Show Colony Labels</p>
                        <p className="text-sm text-muted-foreground">
                          Display colony names on the map
                        </p>
                      </div>
                      <button className="relative h-6 w-11 rounded-full bg-primary transition-colors">
                        <span className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white translate-x-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "data" && (
                <div className="glass-card p-6 animate-fade-in">
                  <h2 className="font-display text-xl font-semibold mb-6">
                    Data & Export Settings
                  </h2>

                  <div className="space-y-6">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Default Export Format
                      </label>
                      <select className="w-full px-4 py-2 bg-background/50 border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50">
                        <option>CSV (Comma Separated Values)</option>
                        <option>GeoJSON</option>
                        <option>Shapefile</option>
                        <option>KML</option>
                      </select>
                    </div>

                    <div className="p-4 bg-secondary/30 rounded-lg">
                      <h3 className="font-medium mb-2">Data Usage</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Storage Used</span>
                          <span className="font-medium">2.4 GB / 10 GB</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full w-1/4 bg-primary rounded-full" />
                        </div>
                      </div>
                    </div>

                    <Button variant="outline" className="w-full">
                      <Database className="h-4 w-4 mr-2" />
                      Export All Data
                    </Button>
                  </div>
                </div>
              )}

              {activeSection === "security" && (
                <div className="glass-card p-6 animate-fade-in">
                  <h2 className="font-display text-xl font-semibold mb-6">
                    Security Settings
                  </h2>

                  <div className="space-y-6">
                    <div className="p-4 bg-secondary/30 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="font-medium">Two-Factor Authentication</p>
                          <p className="text-sm text-muted-foreground">
                            Add an extra layer of security
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          Enable
                        </Button>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-3">Change Password</h3>
                      <div className="space-y-3">
                        <input
                          type="password"
                          placeholder="Current Password"
                          className="w-full px-4 py-2 bg-background/50 border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                        <input
                          type="password"
                          placeholder="New Password"
                          className="w-full px-4 py-2 bg-background/50 border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                        <input
                          type="password"
                          placeholder="Confirm New Password"
                          className="w-full px-4 py-2 bg-background/50 border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-3">Active Sessions</h3>
                      <div className="p-3 bg-secondary/30 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded bg-primary/20 flex items-center justify-center">
                            <Globe className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Current Session</p>
                            <p className="text-xs text-muted-foreground">
                              Chrome on macOS • New Orleans, LA
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-success">Active Now</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "appearance" && (
                <div className="glass-card p-6 animate-fade-in">
                  <h2 className="font-display text-xl font-semibold mb-6">
                    Appearance Settings
                  </h2>

                  <div className="space-y-6">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Color Theme
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { name: "Coastal Dark", color: "#27383E" },
                          { name: "Ocean Blue", color: "#1a365d" },
                          { name: "Forest Green", color: "#22543d" },
                        ].map((theme) => (
                          <button
                            key={theme.name}
                            className={cn(
                              "p-4 rounded-lg border text-center transition-colors",
                              theme.name === "Coastal Dark"
                                ? "border-primary bg-primary/10"
                                : "border-border/50 hover:border-primary/50"
                            )}
                          >
                            <div
                              className="h-8 w-full rounded mb-2"
                              style={{ backgroundColor: theme.color }}
                            />
                            <span className="text-sm font-medium">
                              {theme.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Font Size
                      </label>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">Aa</span>
                        <input
                          type="range"
                          min="12"
                          max="18"
                          defaultValue="14"
                          className="flex-1"
                        />
                        <span className="text-lg">Aa</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                      <div>
                        <p className="font-medium">Reduced Motion</p>
                        <p className="text-sm text-muted-foreground">
                          Minimize animations for accessibility
                        </p>
                      </div>
                      <button className="relative h-6 w-11 rounded-full bg-muted transition-colors">
                        <span className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="mt-6 flex items-center justify-end gap-4">
                <Button variant="ghost">Cancel</Button>
                <Button variant="hero" onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  {saved ? "Saved!" : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
