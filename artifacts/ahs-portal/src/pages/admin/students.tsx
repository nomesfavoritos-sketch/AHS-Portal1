import { useState } from "react";
import { 
  useListJoinedStudents
} from "@workspace/api-client-react";
import { format } from "date-fns";

import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Users } from "lucide-react";

export default function AdminStudents() {
  const [searchTerm, setSearchTerm] = useState("");
  
  const queryParams: any = {};
  if (searchTerm) queryParams.search = searchTerm;

  const { data: studentsData, isLoading } = useListJoinedStudents(queryParams);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Joined Students</h1>
          <p className="text-muted-foreground">List of admitted and joined students.</p>
        </div>
      </div>

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
              No students found.
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
    </div>
  );
}
