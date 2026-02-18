import { AdminHeader } from "@/components/layout/AdminHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { User, Bell, Database, Shield } from "lucide-react";

export default function AdminSettings() {
    return (
        <div className="min-h-screen bg-background">
            <AdminHeader />

            <main className="container mx-auto px-4 lg:px-8 pt-12 pb-12">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Settings</h1>
                    <p className="text-muted-foreground">Manage admin account and data preferences</p>
                </div>

                <div className="max-w-2xl space-y-6">
                    {/* Profile Settings */}
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Profile
                            </CardTitle>
                            <CardDescription>Update your administrator information</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>First Name</Label>
                                    <Input placeholder="Admin" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Last Name</Label>
                                    <Input placeholder="User" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input type="email" placeholder="admin@example.com" />
                            </div>
                            <Button>Save Changes</Button>
                        </CardContent>
                    </Card>

                    {/* Data Preferences */}
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Database className="h-5 w-5" />
                                Data Preferences
                            </CardTitle>
                            <CardDescription>Configure data handling settings</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[
                                { label: "Auto-validate uploads", description: "Automatically validate data on upload" },
                                { label: "Duplicate detection", description: "Check for duplicate records" },
                                { label: "Backup notifications", description: "Get notified of backup status" },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">{item.label}</p>
                                        <p className="text-sm text-muted-foreground">{item.description}</p>
                                    </div>
                                    <Switch defaultChecked={i < 2} />
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Notifications */}
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bell className="h-5 w-5" />
                                Notifications
                            </CardTitle>
                            <CardDescription>Configure notification preferences</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[
                                { label: "Upload complete", description: "Notify when uploads finish processing" },
                                { label: "Error alerts", description: "Get notified of processing errors" },
                                { label: "Daily summary", description: "Receive daily activity reports" },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">{item.label}</p>
                                        <p className="text-sm text-muted-foreground">{item.description}</p>
                                    </div>
                                    <Switch defaultChecked={i === 0 || i === 1} />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
