import { useState } from "react";
import { 
  useListAuditLogs
} from "@workspace/api-client-react";
import { format } from "date-fns";

import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, History } from "lucide-react";

export default function AdminAuditLogs() {
  const [actionFilter, setActionFilter] = useState<string>("all");
  
  const queryParams: any = { limit: 100 };
  if (actionFilter !== "all") queryParams.action = actionFilter;

  const { data: logsData, isLoading } = useListAuditLogs(queryParams);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground">System-wide activity and security logs.</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Activity History
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Action Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !logsData?.logs.length ? (
            <div className="text-center p-8 text-muted-foreground border rounded-lg border-dashed">
              No audit logs found.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logsData.logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs font-mono">
                        {format(new Date(log.createdAt), "yyyy-MM-dd HH:mm:ss")}
                      </TableCell>
                      <TableCell>{log.userId || "System"}</TableCell>
                      <TableCell className="font-medium text-xs uppercase">{log.action}</TableCell>
                      <TableCell className="text-sm">{log.entityType} {log.entityId ? `#${log.entityId}` : ""}</TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate" title={log.details || ""}>{log.details}</TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">{log.ipAddress}</TableCell>
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
