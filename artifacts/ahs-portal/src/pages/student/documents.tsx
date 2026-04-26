import { useListDocuments, getListDocumentsQueryKey } from "@workspace/api-client-react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileUp, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import { ObjectUploader } from "@workspace/object-storage-web";
import { useToast } from "@/hooks/use-toast";

const REQUIRED_DOCUMENTS = [
  { id: "matricCertificate", label: "Matriculation Certificate" },
  { id: "intermediateCertificate", label: "Intermediate Certificate" },
  { id: "domicile", label: "Domicile Certificate" },
  { id: "nidCopy", label: "CNIC / B-Form Copy" },
  { id: "passportPhoto", label: "Passport Size Photograph" },
  { id: "medicalFitness", label: "Medical Fitness Certificate" },
  { id: "characterCertificate", label: "Character Certificate" },
];

export default function StudentDocuments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: documentsData, isLoading } = useListDocuments();

  const handleUploadComplete = async (result: any, docType: string) => {
    const successful = result.successful?.[0];
    if (!successful) return;

    const uploadURL: string = successful.response?.uploadURL ?? "";
    const objectPath = uploadURL.split("?")[0].split("/").slice(-2).join("/");
    const fileName: string = successful.name ?? successful.data?.name ?? objectPath.split("/").pop() ?? "document";
    const mimeType: string = successful.type ?? successful.data?.type ?? "application/octet-stream";

    const baseUrl = (window as any).__BASE_URL__ ?? import.meta.env.BASE_URL ?? "/";
    try {
      const res = await fetch(`${baseUrl}api/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ docType, fileName, filePath: objectPath, mimeType }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Server error ${res.status}`);
      }
      toast({ title: "Document uploaded successfully" });
      queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
    } catch (e: any) {
      toast({ title: "Failed to record document", description: e.message || "An error occurred", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
        <p className="text-muted-foreground">Upload all required academic and personal documents.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {REQUIRED_DOCUMENTS.map((docType) => {
          const uploadedDoc = documentsData?.find(d => d.docType === docType.id);
          const isUploaded = !!uploadedDoc;

          return (
            <Card key={docType.id} className={isUploaded ? "border-yellow-200 dark:border-yellow-900" : "border-amber-200 dark:border-amber-900"}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span className="truncate pr-2" title={docType.label}>{docType.label}</span>
                  {isUploaded ? (
                    <CheckCircle className="h-5 w-5 text-yellow-500 shrink-0" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
                  )}
                </CardTitle>
                <CardDescription>
                  {isUploaded 
                    ? `Uploaded on ${format(new Date(uploadedDoc.uploadedAt), "MMM d, yyyy")}` 
                    : "Pending upload"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-2">
                  {isUploaded ? (
                    <Badge variant="default" className="bg-yellow-500">Uploaded</Badge>
                  ) : (
                    <Badge variant="outline" className="border-amber-500 text-amber-600">Required</Badge>
                  )}
                  {isUploaded && uploadedDoc.filePath && (
                    <a
                      href={`${import.meta.env.BASE_URL}api/storage/objects/${uploadedDoc.filePath}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      <ExternalLink className="h-3 w-3" /> View
                    </a>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  Accepted formats: PDF, JPG, PNG. Max size: 5MB.
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <ObjectUploader
                  maxNumberOfFiles={1}
                  maxFileSize={5242880}
                  buttonClassName="w-full"
                  onGetUploadParameters={async (file) => {
                    const res = await fetch(`${import.meta.env.BASE_URL}api/storage/uploads/request-url`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      credentials: "include",
                      body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type || "application/octet-stream" })
                    });
                    const data = await res.json();
                    return { method: "PUT" as const, url: data.uploadURL, headers: { "Content-Type": file.type || "application/octet-stream" } };
                  }}
                  onComplete={(result) => handleUploadComplete(result, docType.id)}
                >
                  <div className={`flex items-center justify-center gap-2 w-full h-9 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isUploaded 
                      ? "bg-secondary text-secondary-foreground hover:bg-secondary/80" 
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  }`}>
                    <FileUp className="h-4 w-4" /> {isUploaded ? "Replace Document" : "Upload Document"}
                  </div>
                </ObjectUploader>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
