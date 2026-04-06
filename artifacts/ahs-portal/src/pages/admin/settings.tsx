import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon } from "lucide-react";

export default function AdminSettings() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Portal configuration and preferences.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            General Settings
          </CardTitle>
          <CardDescription>System-wide settings are currently managed via environment variables.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center p-12 text-muted-foreground border rounded-lg border-dashed">
            <SettingsIcon className="h-8 w-8 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-1">Configuration Mode</h3>
            <p className="text-sm max-w-sm mx-auto">
              System settings are currently managed by the technical team through server configuration to ensure stability.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
