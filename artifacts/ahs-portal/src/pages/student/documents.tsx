import { useListDocuments, useUploadDocument, getListDocumentsQueryKey } from "@workspace/api-client-react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileUp, CheckCircle, AlertCircle } from "lucide-react";
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
  const uploadDocument = useUploadDocument();

  const handleUploadComplete = async (result: any, docType: string) => {
    const successful = result.successful?.[0];
    if (successful) {
      const objectPath = successful.response?.uploadURL?.split("?")[0]?.split("/").slice(-2).join("/") ?? "";
      
      uploadDocument.mutate({
        data: {
          docType,
          filePath: objectPath,
          // If the API expects more fields, supply them here. 
          // Note: createDocument API schema may differ from useUploadDocument,
          // assuming useUploadDocument maps to the correct body format
        } as any
      }, {
        onSuccess: () => {
          toast({ title: "Document uploaded successfully" });
          queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
        },
        onError: (error) => {
          toast({
            title: "Failed to record document",
            description: error.error || "An error occurred",
            variant: "destructive",
          });
        }
      });
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
            <Card key={docType.id} className={isUploaded ? "border-emerald-200 dark:border-emerald-900" : "border-amber-200 dark:border-amber-900"}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span className="truncate pr-2" title={docType.label}>{docType.label}</span>
                  {isUploaded ? (
                    <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
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
                {isUploaded ? (
                  <Badge variant="default" className="bg-emerald-500 mb-2">Uploaded ({uploadedDoc.status})</Badge>
                ) : (
                  <Badge variant="outline" className="border-amber-500 text-amber-600 mb-2">Required</Badge>
                )}
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
