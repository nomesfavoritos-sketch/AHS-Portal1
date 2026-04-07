import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useListSettings, useUpdateSetting, getListSettingsQueryKey } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader2, Settings as SettingsIcon, Calculator, Save, Info, CreditCard, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function getSetting(settings: { key: string; value: string }[], key: string, fallback: string) {
  return settings.find((s) => s.key === key)?.value ?? fallback;
}

/* ---- Merit Formula ---- */
const formulaSchema = z.object({
  matric_weight: z.coerce.number().min(0).max(100),
  fsc_weight: z.coerce.number().min(0).max(100),
  tie_breaker: z.enum(["fsc_marks", "matric_marks", "date_of_birth"]),
  raw_total: z.coerce.number().min(1).max(200),
});
type FormulaValues = z.infer<typeof formulaSchema>;

/* ---- Fee Settings ---- */
const feeSchema = z.object({
  application_fee_amount: z.coerce.number().min(0),
  fee_receipt_deadline_days: z.coerce.number().min(1).max(365),
  challan_bank_name: z.string().min(1).max(100),
  challan_bank_account: z.string().max(100),
});
type FeeValues = z.infer<typeof feeSchema>;

/* ---- Institution Settings ---- */
const institutionSchema = z.object({
  institution_name: z.string().min(1).max(200),
  institution_short_name: z.string().max(50),
  institution_address: z.string().max(500),
  contact_email: z.string().email().or(z.literal("")),
  contact_phone: z.string().max(50),
  admission_office_hours: z.string().max(200),
});
type InstitutionValues = z.infer<typeof institutionSchema>;

async function saveBatch(
  keys: Record<string, string | number>,
  updateFn: (args: { key: string; data: { value: string } }) => Promise<any>
) {
  await Promise.all(
    Object.entries(keys).map(([key, value]) =>
      updateFn({ key, data: { value: String(value) } })
    )
  );
}

export default function AdminSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useListSettings();
  const updateSetting = useUpdateSetting();

  const settingsList = settings ?? [];

  /* --- Merit form --- */
  const formulaForm = useForm<FormulaValues>({
    resolver: zodResolver(formulaSchema),
    defaultValues: { matric_weight: 10, fsc_weight: 70, tie_breaker: "fsc_marks", raw_total: 80 },
  });

  /* --- Fee form --- */
  const feeForm = useForm<FeeValues>({
    resolver: zodResolver(feeSchema),
    defaultValues: { application_fee_amount: 500, fee_receipt_deadline_days: 7, challan_bank_name: "HBL", challan_bank_account: "" },
  });

  /* --- Institution form --- */
  const institutionForm = useForm<InstitutionValues>({
    resolver: zodResolver(institutionSchema),
    defaultValues: {
      institution_name: "Allied Health College, Nishtar Medical University",
      institution_short_name: "AHS College NMU",
      institution_address: "Nishtar Medical University, Multan, Punjab, Pakistan",
      contact_email: "admissions@ahscollege.edu.pk",
      contact_phone: "",
      admission_office_hours: "Monday–Friday, 8:00am – 2:00pm",
    },
  });

  useEffect(() => {
    if (!settingsList.length) return;
    formulaForm.reset({
      matric_weight: Number(getSetting(settingsList, "matric_weight", "10")),
      fsc_weight: Number(getSetting(settingsList, "fsc_weight", "70")),
      tie_breaker: getSetting(settingsList, "tie_breaker", "fsc_marks") as FormulaValues["tie_breaker"],
      raw_total: Number(getSetting(settingsList, "raw_total", "80")),
    });
    feeForm.reset({
      application_fee_amount: Number(getSetting(settingsList, "application_fee_amount", "500")),
      fee_receipt_deadline_days: Number(getSetting(settingsList, "fee_receipt_deadline_days", "7")),
      challan_bank_name: getSetting(settingsList, "challan_bank_name", "HBL"),
      challan_bank_account: getSetting(settingsList, "challan_bank_account", ""),
    });
    institutionForm.reset({
      institution_name: getSetting(settingsList, "institution_name", "Allied Health College, Nishtar Medical University"),
      institution_short_name: getSetting(settingsList, "institution_short_name", "AHS College NMU"),
      institution_address: getSetting(settingsList, "institution_address", "Nishtar Medical University, Multan, Punjab, Pakistan"),
      contact_email: getSetting(settingsList, "contact_email", "admissions@ahscollege.edu.pk"),
      contact_phone: getSetting(settingsList, "contact_phone", ""),
      admission_office_hours: getSetting(settingsList, "admission_office_hours", "Monday–Friday, 8:00am – 2:00pm"),
    });
  }, [settings]);

  const onSaveFormula = async (data: FormulaValues) => {
    try {
      await saveBatch(data as any, updateSetting.mutateAsync);
      toast({ title: "Merit formula saved" });
      queryClient.invalidateQueries({ queryKey: getListSettingsQueryKey() });
    } catch {
      toast({ title: "Failed to save", variant: "destructive" });
    }
  };

  const onSaveFee = async (data: FeeValues) => {
    try {
      await saveBatch(data as any, updateSetting.mutateAsync);
      toast({ title: "Fee settings saved" });
      queryClient.invalidateQueries({ queryKey: getListSettingsQueryKey() });
    } catch {
      toast({ title: "Failed to save", variant: "destructive" });
    }
  };

  const onSaveInstitution = async (data: InstitutionValues) => {
    try {
      await saveBatch(data as any, updateSetting.mutateAsync);
      toast({ title: "Institution settings saved" });
      queryClient.invalidateQueries({ queryKey: getListSettingsQueryKey() });
    } catch {
      toast({ title: "Failed to save", variant: "destructive" });
    }
  };

  const matricW = formulaForm.watch("matric_weight");
  const fscW = formulaForm.watch("fsc_weight");
  const rawTotal = formulaForm.watch("raw_total");
  const testMatric = 850; const testMatricTotal = 1100;
  const testFsc = 900; const testFscTotal = 1100;
  const testMatricScore = (testMatric / testMatricTotal) * matricW;
  const testFscScore = (testFsc / testFscTotal) * fscW;
  const testRaw = testMatricScore + testFscScore;
  const testNorm = (testRaw / rawTotal) * 100;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Configure merit formula, fee structure, and institution branding.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-6">

          {/* Merit Formula */}
          <Form {...formulaForm}>
            <form onSubmit={formulaForm.handleSubmit(onSaveFormula)}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Merit Formula Weights
                  </CardTitle>
                  <CardDescription>
                    Define how marks contribute to the final merit score. Formula: <strong>(Matric% × weight) + (FSc% × weight) = Raw Score → normalise to 100.</strong>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={formulaForm.control} name="matric_weight" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Matric Weight (%)</FormLabel>
                        <FormControl><Input type="number" min={0} max={100} step={0.5} {...field} /></FormControl>
                        <FormDescription>Contribution of Matric/SSC marks</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={formulaForm.control} name="fsc_weight" render={({ field }) => (
                      <FormItem>
                        <FormLabel>FSc Weight (%)</FormLabel>
                        <FormControl><Input type="number" min={0} max={100} step={0.5} {...field} /></FormControl>
                        <FormDescription>Contribution of FSc/HSSC marks</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={formulaForm.control} name="raw_total" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Raw Total (denominator)</FormLabel>
                        <FormControl><Input type="number" min={1} max={200} step={1} {...field} /></FormControl>
                        <FormDescription>Sum of all weights (used to normalise to 100%)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={formulaForm.control} name="tie_breaker" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tie-Breaker Rule</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="fsc_marks">Higher FSc Marks</SelectItem>
                            <SelectItem value="matric_marks">Higher Matric Marks</SelectItem>
                            <SelectItem value="date_of_birth">Older Candidate (Date of Birth)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>How to resolve equal merit scores</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <Separator />

                  <div className="rounded-lg bg-muted/50 border p-4 space-y-2">
                    <p className="text-sm font-medium flex items-center gap-1.5"><Info className="h-4 w-4 text-muted-foreground" />Live Preview — Sample Calculation</p>
                    <p className="text-xs text-muted-foreground">Student with Matric 850/1100, FSc 900/1100:</p>
                    <div className="text-sm grid grid-cols-2 gap-1">
                      <span className="text-muted-foreground">Matric contribution:</span>
                      <span className="font-mono">({testMatric}/{testMatricTotal}) × {matricW} = <strong>{testMatricScore.toFixed(3)}</strong></span>
                      <span className="text-muted-foreground">FSc contribution:</span>
                      <span className="font-mono">({testFsc}/{testFscTotal}) × {fscW} = <strong>{testFscScore.toFixed(3)}</strong></span>
                      <span className="text-muted-foreground">Raw score:</span>
                      <span className="font-mono"><strong>{testRaw.toFixed(3)}</strong> / {rawTotal}</span>
                      <span className="text-muted-foreground font-semibold">Merit %:</span>
                      <span className="font-mono font-bold text-primary">({testRaw.toFixed(3)}/{rawTotal}) × 100 = {testNorm.toFixed(2)}%</span>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={updateSetting.isPending}>
                      {updateSetting.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Save Formula
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </Form>

          {/* Fee Settings */}
          <Form {...feeForm}>
            <form onSubmit={feeForm.handleSubmit(onSaveFee)}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Fee &amp; Payment Settings
                  </CardTitle>
                  <CardDescription>
                    Configure the application fee amount and challan bank details shown to students.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={feeForm.control} name="application_fee_amount" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Application Fee (PKR)</FormLabel>
                        <FormControl><Input type="number" min={0} step={50} {...field} /></FormControl>
                        <FormDescription>Fee printed on the challan and charged to each applicant</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={feeForm.control} name="fee_receipt_deadline_days" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Receipt Deadline (Days)</FormLabel>
                        <FormControl><Input type="number" min={1} max={365} {...field} /></FormControl>
                        <FormDescription>Days after challan generation before it expires</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={feeForm.control} name="challan_bank_name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank Name</FormLabel>
                        <FormControl><Input placeholder="e.g. HBL" {...field} /></FormControl>
                        <FormDescription>Bank name shown on the challan form</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={feeForm.control} name="challan_bank_account" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank Account Number</FormLabel>
                        <FormControl><Input placeholder="e.g. 01234567890123" {...field} /></FormControl>
                        <FormDescription>Account number where fee is deposited</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" disabled={updateSetting.isPending}>
                      {updateSetting.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Save Fee Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </Form>

          {/* Institution Settings */}
          <Form {...institutionForm}>
            <form onSubmit={institutionForm.handleSubmit(onSaveInstitution)}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Institution &amp; Branding
                  </CardTitle>
                  <CardDescription>
                    Configure institution name, address, and contact information displayed across the portal.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={institutionForm.control} name="institution_name" render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>Full Institution Name</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormDescription>Used in official communications and report headers</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={institutionForm.control} name="institution_short_name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Short Name / Acronym</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormDescription>Abbreviated name for UI headers</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={institutionForm.control} name="contact_email" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Email</FormLabel>
                        <FormControl><Input type="email" placeholder="admissions@ahscollege.edu.pk" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={institutionForm.control} name="contact_phone" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Phone</FormLabel>
                        <FormControl><Input placeholder="+92-61-XXXXXXX" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={institutionForm.control} name="admission_office_hours" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Office Hours</FormLabel>
                        <FormControl><Input placeholder="Mon–Fri, 8am–2pm" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={institutionForm.control} name="institution_address" render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>Institution Address</FormLabel>
                        <FormControl><Textarea rows={2} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" disabled={updateSetting.isPending}>
                      {updateSetting.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Save Institution Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </Form>

        </div>
      )}
    </div>
  );
}
