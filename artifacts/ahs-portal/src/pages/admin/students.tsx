import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListJoinedStudents,
  getListJoinedStudentsQueryKey,
} from "@workspace/api-client-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  Search,
  Users,
  Download,
  Trash2,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useListPrograms, useListSessions } from "@workspace/api-client-react";

function exportCsv(students: any[]) {
  const header = ["Roll No", "Student Name", "Email", "Program", "Session", "Verifier", "Joined At"];
  const rows = students.map((s) => [
    s.rollNumber ?? "",
    s.user?.fullName ?? "",
    s.user?.email ?? "",
    s.program?.name ?? "",
    s.sessionId ?? "",
    s.verifierName ?? "",
    s.joinedAt ? format(new Date(s.joinedAt), "yyyy-MM-dd") : "",
  ]);
  const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `joined-students-${format(new Date(), "yyyyMMdd")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function RemoveDialog({
  student,
  onClose,
  onConfirm,
  isPending,
}: {
  student: any;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isPending: boolean;
}) {
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState("");
  const name = student.user?.fullName ?? "this student";
  const canSubmit = reason.trim().length >= 10 && confirmed.trim().toLowerCase() === "remove";

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Remove Joined Student
          </DialogTitle>
          <DialogDescription>
            This will revoke <strong>{name}'s</strong> joined status and revert their application to rejected. This action is recorded in the audit log and cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-3 bg-muted/30 rounded-lg text-sm space-y-1.5">
            <div><span className="text-muted-foreground">Student:</span> <strong>{name}</strong></div>
            {student.rollNumber && <div><span className="text-muted-foreground">Roll No:</span> <strong className="font-mono">{student.rollNumber}</strong></div>}
            <div><span className="text-muted-foreground">Program:</span> {student.program?.name}</div>
            <div><span className="text-muted-foreground">Joined:</span> {student.joinedAt ? format(new Date(student.joinedAt), "MMM d, yyyy") : "—"}</div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rem-reason">
              Reason for removal <span className="text-muted-foreground text-xs">(min. 10 characters, required)</span>
            </Label>
            <Textarea
              id="rem-reason"
              placeholder="e.g., Student did not report after joining deadline, fraudulent documents discovered..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
            {reason.trim().length > 0 && reason.trim().length < 10 && (
              <p className="text-xs text-red-500">At least 10 characters required</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rem-confirm">
              Type <strong>REMOVE</strong> to confirm
            </Label>
            <Input
              id="rem-confirm"
              placeholder="REMOVE"
              value={confirmed}
              onChange={(e) => setConfirmed(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => onConfirm(reason.trim())}
            disabled={!canSubmit || isPending}
          >
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Trash2 className="h-4 w-4 mr-2" />
            Confirm Removal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminStudents() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [programFilter, setProgramFilter] = useState("all");
  const [sessionFilter, setSessionFilter] = useState("all");
  const [removeDialog, setRemoveDialog] = useState<any | null>(null);
  const [removing, setRemoving] = useState(false);

  const { data: studentsData, isLoading } = useListJoinedStudents({});
  const { data: programsData } = useListPrograms({});
  const { data: sessionsData } = useListSessions({});

  const students = (studentsData ?? []).filter((s: any) => {
    if (programFilter !== "all" && String(s.programId) !== programFilter) return false;
    if (sessionFilter !== "all" && String(s.sessionId) !== sessionFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        s.user?.fullName?.toLowerCase().includes(q) ||
        s.user?.email?.toLowerCase().includes(q) ||
        s.rollNumber?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleRemove = async (reason: string) => {
    if (!removeDialog) return;
    setRemoving(true);
    try {
      const res = await fetch(`/api/joined-students/${removeDialog.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Removal failed");
      toast({ title: "Student removed successfully" });
      setRemoveDialog(null);
      queryClient.invalidateQueries({ queryKey: getListJoinedStudentsQueryKey() });
    } catch (e: any) {
      toast({ title: "Removal failed", description: e.message, variant: "destructive" });
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Joined Students</h1>
          <p className="text-muted-foreground">
            Roster of students who have completed the admission and joining process.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportCsv(students)}
          disabled={students.length === 0}
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Summary */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-3">
        <Card>
          <CardContent className="pt-4 pb-3 flex items-start gap-3">
            <Users className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <div className="text-2xl font-bold">{studentsData?.length ?? 0}</div>
              <div className="text-xs text-muted-foreground">Total Joined</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-500 mt-0.5" />
            <div>
              <div className="text-2xl font-bold text-emerald-600">
                {studentsData?.filter((s: any) => s.verifierName).length ?? 0}
              </div>
              <div className="text-xs text-muted-foreground">Desk Verified</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
            <div>
              <div className="text-2xl font-bold text-amber-600">
                {studentsData?.filter((s: any) => !s.rollNumber).length ?? 0}
              </div>
              <div className="text-xs text-muted-foreground">No Roll No. Assigned</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Admitted Roster ({students.length})
          </CardTitle>
          <CardDescription>
            Filter, search and manage confirmed joined students.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex gap-3 flex-col sm:flex-row flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search name, email or roll no..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={programFilter} onValueChange={setProgramFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Programs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Programs</SelectItem>
                {programsData?.map((p: any) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sessionFilter} onValueChange={setSessionFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Sessions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sessions</SelectItem>
                {sessionsData?.map((s: any) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm border rounded border-dashed">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
              No joined students found
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Roll No.</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Verifier</TableHead>
                    <TableHead>Joined Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student: any) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        {student.rollNumber ? (
                          <span className="font-mono text-xs font-medium">{student.rollNumber}</span>
                        ) : (
                          <Badge variant="outline" className="text-xs">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{student.user?.fullName ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">{student.user?.email}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{student.program?.name}</div>
                        <div className="text-xs text-muted-foreground font-mono">{student.program?.code}</div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {student.verifierName ? (
                          <span className="flex items-center gap-1.5 text-emerald-700">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            {student.verifierName}
                          </span>
                        ) : (
                          <span className="text-muted-foreground italic text-xs">Manual entry</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {student.joinedAt
                          ? format(new Date(student.joinedAt), "MMM d, yyyy")
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                          onClick={() => setRemoveDialog(student)}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {removeDialog && (
        <RemoveDialog
          student={removeDialog}
          onClose={() => setRemoveDialog(null)}
          onConfirm={handleRemove}
          isPending={removing}
        />
      )}
    </div>
  );
}
