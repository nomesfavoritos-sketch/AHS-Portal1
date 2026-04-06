import { useListDocuments } from "@workspace/api-client-react";
import { format } from "date-fns";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileUp } from "lucide-react";

export default function StudentDocuments() {
  const { data: documentsData, isLoading } = useListDocuments();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="secondary">Pending Review</Badge>;
      case "accepted": return <Badge variant="default" className="bg-emerald-500">Accepted</Badge>;
      case "rejected": return <Badge variant="destructive">Rejected</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDocType = (type: string) => {
    return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground">Manage your uploaded academic documents.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileUp className="h-5 w-5" />
            Uploaded Documents
          </CardTitle>
          <CardDescription>Track verification status of your submissions.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !documentsData?.length ? (
            <div className="text-center p-8 text-muted-foreground border rounded-lg border-dashed">
              No documents uploaded yet. Note: Document upload feature is managed during application process.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>App ID</TableHead>
                    <TableHead>File Name</TableHead>
                    <TableHead>Uploaded At</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documentsData.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">{formatDocType(doc.docType)}</TableCell>
                      <TableCell>{doc.applicationId}</TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate" title={doc.fileName}>{doc.fileName}</TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(doc.uploadedAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(doc.status)}
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
