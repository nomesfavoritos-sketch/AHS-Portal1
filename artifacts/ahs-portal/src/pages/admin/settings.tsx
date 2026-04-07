import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useListSettings, useUpdateSetting, getListSettingsQueryKey } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader2, Settings as SettingsIcon, Calculator, Save, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const formulaSchema = z.object({
  matric_weight: z.coerce.number().min(0).max(100),
  fsc_weight: z.coerce.number().min(0).max(100),
  tie_breaker: z.enum(["fsc_marks", "matric_marks", "date_of_birth"]),
  raw_total: z.coerce.number().min(1).max(200),
});
type FormulaValues = z.infer<typeof formulaSchema>;

function buildDefaultsFromSettings(settings: { key: string; value: string }[]) {
  const get = (k: string, fallback: string) => settings.find((s) => s.key === k)?.value ?? fallback;
  return {
    matric_weight: Number(get("matric_weight", "10")),
    fsc_weight: Number(get("fsc_weight", "70")),
    tie_breaker: (get("tie_breaker", "fsc_marks")) as FormulaValues["tie_breaker"],
    raw_total: Number(get("raw_total", "80")),
  };
}

export default function AdminSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useListSettings();
  const updateSetting = useUpdateSetting();

  const form = useForm<FormulaValues>({
    resolver: zodResolver(formulaSchema),
    defaultValues: { matric_weight: 10, fsc_weight: 70, tie_breaker: "fsc_marks", raw_total: 80 },
  });

  useEffect(() => {
    if (settings?.length) {
      form.reset(buildDefaultsFromSettings(settings));
    }
  }, [settings]);

  const onSave = async (data: FormulaValues) => {
    const updates = Object.entries(data) as [string, string | number][];
    try {
      await Promise.all(
        updates.map(([key, value]) =>
          updateSetting.mutateAsync({ key, data: { value: String(value) } })
        )
      );
      toast({ title: "Settings saved" });
      queryClient.invalidateQueries({ queryKey: getListSettingsQueryKey() });
    } catch {
      toast({ title: "Failed to save settings", variant: "destructive" });
    }
  };

  const matricW = form.watch("matric_weight");
  const fscW = form.watch("fsc_weight");
  const rawTotal = form.watch("raw_total");
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
        <p className="text-muted-foreground">Configure the merit formula and portal behaviour.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSave)} className="space-y-6">
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
                  <FormField control={form.control} name="matric_weight" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Matric Weight (%)</FormLabel>
                      <FormControl><Input type="number" min={0} max={100} step={0.5} {...field} /></FormControl>
                      <FormDescription>Contribution of Matric/SSC marks</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="fsc_weight" render={({ field }) => (
                    <FormItem>
                      <FormLabel>FSc Weight (%)</FormLabel>
                      <FormControl><Input type="number" min={0} max={100} step={0.5} {...field} /></FormControl>
                      <FormDescription>Contribution of FSc/HSSC marks</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="raw_total" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Raw Total (denominator)</FormLabel>
                      <FormControl><Input type="number" min={1} max={200} step={1} {...field} /></FormControl>
                      <FormDescription>Sum of all weights (used to normalise to 100%)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="tie_breaker" render={({ field }) => (
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
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" disabled={updateSetting.isPending}>
                {updateSetting.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Settings
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}
