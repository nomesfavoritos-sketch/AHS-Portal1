import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useListJoinedStudents,
  useListApplications,
  useMarkStudentJoined,
  getListJoinedStudentsQueryKey
} from "@workspace/api-client-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Users, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function AdminStudents() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState<number | null>(null);
  const [rollNumber, setRollNumber] = useState("");
  
  const queryParams: any = {};
  if (searchTerm) queryParams.search = searchTerm;

  const { data: studentsData, isLoading } = useListJoinedStudents(queryParams);
  // Fetch admitted applications to mark them as joined
  const { data: admittedAppsData, isLoading: isLoadingApps } = useListApplications({ status: "admitted" });
  
  const markJoined = useMarkStudentJoined();

  const handleOpenJoin = (appId: number) => {
    setSelectedAppId(appId);
    setRollNumber("");
    setIsJoinOpen(true);
  };

  const handleJoinSubmit = () => {
    if (!selectedAppId) return;
    
    markJoined.mutate(
      { data: { applicationId: selectedAppId, rollNumber: rollNumber || null } },
      {
        onSuccess: () => {
          toast({ title: "Student marked as joined successfully" });
          setIsJoinOpen(false);
          queryClient.invalidateQueries({ queryKey: getListJoinedStudentsQueryKey() });
          // Note: In real app we'd invalidate applications too
        },
        onError: (error) => {
          toast({
            title: "Action failed",
            description: error.error || "An error occurred",
            variant: "destructive",
          });
        }
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Joined Students</h1>
          <p className="text-muted-foreground">List of admitted and joined students.</p>
        </div>
      </div>

      {/* Admitted but not joined section */}
      {admittedAppsData?.applications && admittedAppsData.applications.length > 0 && (
        <Card className="border-blue-200 dark:border-blue-900">
          <CardHeader className="pb-3 bg-blue-50/50 dark:bg-blue-950/20">
            <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
              <UserPlus className="h-5 w-5" />
              Pending Join Confirmations
            </CardTitle>
            <CardDescription>Admitted students waiting to be marked as joined.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>App Number</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admittedAppsData.applications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-mono text-xs">{app.applicationNumber}</TableCell>
                      <TableCell className="font-medium">{app.user.fullName}</TableCell>
                      <TableCell className="text-sm">{app.program.name}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" onClick={() => handleOpenJoin(app.id)}>Mark as Joined</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Admitted Roster
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search students..." 
                  className="pl-8" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !studentsData?.length ? (
            <div className="text-center p-8 text-muted-foreground border rounded-lg border-dashed">
              No joined students found.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Roll No.</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>App ID</TableHead>
                    <TableHead>Joined Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentsData.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium font-mono text-xs">
                        {student.rollNumber || <Badge variant="outline">Pending</Badge>}
                      </TableCell>
                      <TableCell>{student.user?.fullName}</TableCell>
                      <TableCell className="text-sm">{student.program?.name}</TableCell>
                      <TableCell className="font-mono text-xs">{student.applicationId}</TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(student.joinedAt), "MMM d, yyyy")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isJoinOpen} onOpenChange={setIsJoinOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Student as Joined</DialogTitle>
            <DialogDescription>
              Assign a roll number and confirm the student has joined.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Roll Number (Optional)</label>
              <Input 
                placeholder="e.g. AHS-2024-001" 
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsJoinOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleJoinSubmit} 
              disabled={markJoined.isPending}
            >
              {markJoined.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirm Join
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
