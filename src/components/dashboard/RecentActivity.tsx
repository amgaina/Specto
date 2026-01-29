import { Clock, Upload, AlertTriangle, CheckCircle, Camera } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityItem {
  id: string;
  type: "upload" | "alert" | "success" | "survey";
  title: string;
  description: string;
  time: string;
}

const activities: ActivityItem[] = [
  {
    id: "1",
    type: "survey",
    title: "New aerial survey completed",
    description: "Queen Bess Island - 847 images captured",
    time: "2 hours ago",
  },
  {
    id: "2",
    type: "alert",
    title: "Population decline detected",
    description: "Roseate Spoonbill colony at Elmer's Island",
    time: "5 hours ago",
  },
  {
    id: "3",
    type: "success",
    title: "Analysis complete",
    description: "Rabbit Island Colony - 2,450 individuals identified",
    time: "Yesterday",
  },
  {
    id: "4",
    type: "upload",
    title: "Historical data imported",
    description: "1998-2002 survey records added to database",
    time: "2 days ago",
  },
  {
    id: "5",
    type: "success",
    title: "Breeding success confirmed",
    description: "Great Egret nesting at Isle au Pitre - 89% success rate",
    time: "3 days ago",
  },
];

const iconMap = {
  upload: Upload,
  alert: AlertTriangle,
  success: CheckCircle,
  survey: Camera,
};

const colorMap = {
  upload: "text-primary bg-primary/10 border-primary/20",
  alert: "text-destructive bg-destructive/10 border-destructive/20",
  success: "text-success bg-success/10 border-success/20",
  survey: "text-accent bg-accent/10 border-accent/20",
};

export function RecentActivity() {
  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-semibold">Recent Activity</h3>
            <p className="text-sm text-muted-foreground">
              Latest updates and alerts
            </p>
          </div>
        </div>
        <button className="text-sm text-primary hover:underline">
          View all
        </button>
      </div>

      <div className="space-y-4">
        {activities.map((activity, index) => {
          const Icon = iconMap[activity.type];
          return (
            <div
              key={activity.id}
              className={cn(
                "flex items-start gap-4 p-3 rounded-lg transition-colors hover:bg-secondary/50 cursor-pointer animate-fade-up",
              )}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg border flex-shrink-0",
                colorMap[activity.type]
              )}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{activity.title}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {activity.description}
                </p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {activity.time}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
