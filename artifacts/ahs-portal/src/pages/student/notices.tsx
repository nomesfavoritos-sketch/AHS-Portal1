import { useListNotices } from "@workspace/api-client-react";
import { format } from "date-fns";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Bell } from "lucide-react";

export default function StudentNotices() {
  const { data: noticesData, isLoading } = useListNotices({ active: "true" });

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "urgent": return <Badge variant="destructive">Urgent</Badge>;
      case "admission": return <Badge variant="default" className="bg-blue-600">Admission</Badge>;
      case "merit": return <Badge variant="default" className="bg-purple-600">Merit List</Badge>;
      case "payment": return <Badge variant="outline" className="border-amber-500 text-amber-600">Payment</Badge>;
      default: return <Badge variant="secondary">General</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notices</h1>
          <p className="text-muted-foreground">Stay updated with official announcements.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !noticesData?.length ? (
        <Card>
          <CardContent className="text-center p-12 text-muted-foreground border-dashed">
            <Bell className="h-8 w-8 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-1">No active notices</h3>
            <p className="text-sm max-w-sm mx-auto">
              There are currently no active announcements from the administration.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {noticesData.map((notice) => (
            <Card key={notice.id} className={notice.category === 'urgent' ? 'border-destructive/50 shadow-sm' : ''}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{notice.title}</CardTitle>
                    <CardDescription>
                      Published on {notice.publishedAt ? format(new Date(notice.publishedAt), "MMM d, yyyy") : format(new Date(notice.createdAt), "MMM d, yyyy")}
                    </CardDescription>
                  </div>
                  {getCategoryBadge(notice.category)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap text-sm text-foreground/90 leading-relaxed">
                  {notice.content}
                </div>
                {notice.expiresAt && (
                  <p className="text-xs text-muted-foreground mt-4 pt-4 border-t">
                    Valid until: {format(new Date(notice.expiresAt), "MMM d, yyyy")}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
