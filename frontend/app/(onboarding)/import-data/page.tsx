"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Download,
  X,
  Truck,
  Users,
  Building,
  Package,
  Warehouse,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { authFetch } from "@/lib/api/auth-fetch";

type EntityType = "VEHICLES" | "DRIVERS" | "CUSTOMERS" | "ORDERS" | "WAREHOUSES";

interface ValidationResult {
  total_rows: number;
  valid_rows_count: number;
  error_rows_count: number;
  errors: Array<{ row_index: number; error: string; row_data?: any }>;
  preview: Array<Record<string, any>>;
  detected_columns: string[];
  suggested_mapping: Record<string, string>;
}

const TEMPLATES: Record<EntityType, { filename: string; content: string }> = {
  VEHICLES: { filename: "voyage_vehicles_template.csv", content: "code,name,model,driver_name,status,lat,lng,speed_kmh,heading,battery_pct,health_score\n" },
  DRIVERS: { filename: "voyage_drivers_template.csv", content: "code,name,license_number,phone,email,license_class,duty_status,total_hours_today\n" },
  CUSTOMERS: { filename: "voyage_customers_template.csv", content: "code,name,email,contact_name,phone,sla_tier\n" },
  ORDERS: { filename: "voyage_orders_template.csv", content: "order_number,customer_name,destination,deadline,priority,status,total_cost,vehicle_code\n" },
  WAREHOUSES: { filename: "voyage_warehouses_template.csv", content: "code,name,city,state,lat,lng,capacity_units,dock_count\n" },
};

const IMPORT_FIELDS: Record<EntityType, string[]> = {
  VEHICLES: ["code", "name", "model", "driver_name", "status", "lat", "lng", "speed_kmh", "heading", "battery_pct", "health_score"],
  DRIVERS: ["code", "name", "license_number", "phone", "email", "license_class", "duty_status", "total_hours_today"],
  CUSTOMERS: ["code", "name", "email", "contact_name", "phone", "sla_tier"],
  ORDERS: ["order_number", "customer_name", "destination", "deadline", "priority", "status", "total_cost", "vehicle_code"],
  WAREHOUSES: ["code", "name", "city", "state", "lat", "lng", "capacity_units", "dock_count"],
};

export default function ImportDataPage() {
  const router = useRouter();
  const [entityType, setEntityType] = React.useState<EntityType>("VEHICLES");
  const [dragActive, setDragActive] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [fileContent, setFileContent] = React.useState<string>("");
  const [validating, setValidating] = React.useState(false);
  const [importing, setImporting] = React.useState(false);
  const [previewResult, setPreviewResult] = React.useState<ValidationResult | null>(null);
  const [columnMapping, setColumnMapping] = React.useState<Record<string, string>>({});
  const [mappingDirty, setMappingDirty] = React.useState(false);
  const [importedStats, setImportedStats] = React.useState<{ count: number; entity: string }>({
    count: 0,
    entity: "VEHICLES",
  });
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [step, setStep] = React.useState<"upload" | "mapping" | "success">("upload");

  const handleDownloadTemplate = () => {
    const tpl = TEMPLATES[entityType];
    const blob = new Blob([tpl.content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", tpl.filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const processFile = async (selectedFile: File) => {
    const lowerName = selectedFile.name.toLowerCase();
    if (!lowerName.endsWith(".csv") && !lowerName.endsWith(".json")) {
      setErrorMessage("Choose a CSV or JSON file.");
      return;
    }
    if (selectedFile.size > 10_000_000) {
      setErrorMessage("Files must be 10 MB or smaller.");
      return;
    }

    setFile(selectedFile);
    setErrorMessage(null);
    setValidating(true);

    try {
      const text = await selectedFile.text();
      setFileContent(text);

      const preview = await authFetch<ValidationResult>("/api/v1/import/preview", {
        method: "POST",
        body: JSON.stringify({
          file_content: text,
          filename: selectedFile.name,
          entity_type: entityType,
        }),
      });

      setPreviewResult(preview);
      setColumnMapping(preview.suggested_mapping || {});
      setMappingDirty(false);
      setStep("mapping");
    } catch (err: any) {
      console.error("Preview failed:", err);
      setPreviewResult(null);
      setErrorMessage(err?.message || "The import service could not validate this file. Retry when the service is available.");
    } finally {
      setValidating(false);
    }
  };

  const revalidateMapping = async () => {
    if (!file || !fileContent) return;
    setValidating(true);
    setErrorMessage(null);
    try {
      const preview = await authFetch<ValidationResult>("/api/v1/import/preview", {
        method: "POST",
        body: JSON.stringify({
          file_content: fileContent,
          filename: file.name,
          entity_type: entityType,
          custom_mapping: columnMapping,
        }),
      });
      setPreviewResult(preview);
      setMappingDirty(false);
    } catch (err: any) {
      setErrorMessage(err?.message || "The mapping could not be checked.");
    } finally {
      setValidating(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith(".csv") || droppedFile.name.endsWith(".json")) {
        processFile(droppedFile);
      } else {
        setErrorMessage("Please select a .csv or .json data file.");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!file || !fileContent) return;
    setImporting(true);
    setErrorMessage(null);

    try {
      const result = await authFetch<any>("/api/v1/import/execute", {
        method: "POST",
        body: JSON.stringify({
          file_content: fileContent,
          filename: file.name,
          entity_type: entityType,
          column_mapping: columnMapping,
        }),
      });

      if (result.errors && result.errors.length > 0 && (!result.imported_count || result.imported_count === 0)) {
        setErrorMessage(`Import failed with ${result.errors.length} validation errors: ${result.errors[0]?.message || 'Invalid row data'}`);
        return;
      }

      setImportedStats({
        count: result.imported_count || 0,
        entity: entityType,
      });
      setStep("success");
    } catch (err: any) {
      console.error("Import execution failed:", err);
      const msg = err?.message || err?.error?.message || "Failed to execute import. Please check CSV format and network connection.";
      setErrorMessage(msg);
    } finally {
      setImporting(false);
    }
  };

  const handleComplete = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("nexus_onboarding_completed", "true");
      localStorage.setItem("nexus_use_sample_data", "false");
    }
    router.push("/overview");
  };

  return (
    <div className="min-h-screen bg-nexus-surface flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-3xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-nexus-surface-container border border-nexus-outline-variant/40 mb-3 text-xs font-mono text-nexus-secondary">
            <span>DATA INGESTION PIPELINE</span>
          </div>
          <h1 className="text-3xl font-extrabold text-nexus-on-surface tracking-tight mb-2">
            Import Fleet & Logistics Data
          </h1>
          <p className="text-base text-nexus-on-surface-variant max-w-xl mx-auto">
            Upload CSV or JSON files. Automatic field mapping and schema validation powered by NEXUS Ingestion Engine.
          </p>
        </div>

        {/* Entity Type Selector */}
        {step === "upload" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-6">
            {[
              { id: "VEHICLES" as EntityType, label: "Vehicles / Fleet", icon: Truck },
              { id: "WAREHOUSES" as EntityType, label: "Hubs & Docks", icon: Warehouse },
              { id: "DRIVERS" as EntityType, label: "Drivers / CDL", icon: Users },
              { id: "CUSTOMERS" as EntityType, label: "Customers", icon: Building },
              { id: "ORDERS" as EntityType, label: "Freight Orders", icon: Package },
            ].map((t) => {
              const Icon = t.icon;
              const isSelected = entityType === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setEntityType(t.id)}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all text-sm font-medium ${
                    isSelected
                      ? "border-nexus-secondary bg-nexus-secondary/10 text-nexus-secondary shadow-tactile"
                      : "border-nexus-outline-variant hover:border-nexus-outline bg-nexus-surface-container-lowest text-nexus-on-surface-variant"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-600 text-sm">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {step === "upload" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Upload zone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative p-12 rounded-2xl border-2 border-dashed transition-all ${
                dragActive
                  ? "border-nexus-secondary bg-nexus-secondary/5"
                  : "border-nexus-outline-variant hover:border-nexus-outline bg-nexus-surface-container-lowest"
              }`}
            >
              <div className="text-center">
                <Upload className="h-12 w-12 mx-auto mb-4 text-nexus-on-surface-variant" />
                <h3 className="text-lg font-bold text-nexus-on-surface mb-2">
                  Drop your {entityType.toLowerCase()} CSV file here
                </h3>
                <p className="text-sm text-nexus-on-surface-variant mb-6">
                  or browse your computer for CSV or JSON files
                </p>

                <input
                  type="file"
                  accept=".csv,.json"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button variant="primary" className="font-mono-data" isLoading={validating}>
                    <span>
                      <FileText className="h-4 w-4 mr-2" />
                      Select {entityType} File
                    </span>
                  </Button>
                </label>
              </div>
            </div>

            {/* Template download */}
            <div className="mt-6 p-4 rounded-xl bg-nexus-surface-container-lowest border border-nexus-outline-variant/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Download className="h-5 w-5 text-nexus-secondary" />
                <div>
                  <p className="text-sm font-medium text-nexus-on-surface">
                    Need a formatted {entityType.toLowerCase()} template?
                  </p>
                  <p className="text-xs text-nexus-on-surface-variant">
                    Download our verified CSV format with column headers
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadTemplate}
                className="font-mono-data text-xs gap-1"
              >
                <Download className="h-3.5 w-3.5" /> Download Template
              </Button>
            </div>
          </motion.div>
        )}

        {step === "mapping" && file && previewResult && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="p-6 rounded-2xl bg-nexus-surface-container-lowest border border-nexus-outline-variant/40 shadow-tactile space-y-6">
              {/* File info */}
              <div className="flex items-center justify-between pb-4 border-b border-nexus-outline-variant/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-nexus-secondary/10">
                    <FileText className="h-5 w-5 text-nexus-secondary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-nexus-on-surface">{file.name}</p>
                    <p className="text-xs text-nexus-on-surface-variant">
                      {(file.size / 1024).toFixed(1)} KB · Entity: {entityType}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setFile(null);
                    setStep("upload");
                  }}
                  className="p-2 rounded-lg hover:bg-nexus-surface-container text-nexus-on-surface-variant hover:text-nexus-on-surface transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Validation Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-nexus-surface-container text-center">
                  <p className="text-xs text-nexus-on-surface-variant">Total Rows</p>
                  <p className="text-xl font-bold font-mono text-nexus-on-surface">
                    {previewResult.total_rows}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">Valid Rows</p>
                  <p className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
                    {previewResult.valid_rows_count}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                    <p className="text-xs text-amber-700 dark:text-amber-400">Rows to fix</p>
                  <p className="text-xl font-bold font-mono text-amber-700 dark:text-amber-400">
                    {previewResult.error_rows_count}
                  </p>
                </div>
              </div>

              {/* Column Mapping Preview */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-nexus-on-surface">
                    Review column mapping
                  </h4>
                  <Badge variant={mappingDirty ? "attention" : "healthy"} size="sm">
                    {Object.keys(columnMapping).length} Mapped
                  </Badge>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {Object.entries(columnMapping).map(([sourceCol, targetField], i) => (
                    <div
                      key={i}
                      className="flex flex-wrap items-center gap-2 p-2.5 rounded-lg bg-nexus-surface-container text-xs"
                    >
                      <span className="min-w-28 flex-1 font-mono text-nexus-on-surface-variant font-medium">
                        {sourceCol}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-nexus-on-surface-variant shrink-0" />
                      <label className="flex min-w-44 flex-1 items-center gap-2">
                        <span className="sr-only">Map {sourceCol} to a field</span>
                        <select
                          value={targetField}
                          onChange={(event) => {
                            setColumnMapping((current) => ({ ...current, [sourceCol]: event.target.value }));
                            setMappingDirty(true);
                          }}
                          className="min-h-10 w-full rounded-md border border-nexus-outline-variant bg-nexus-surface-lowest px-2 text-sm text-nexus-on-surface"
                        >
                          <option value="">Ignore this column</option>
                          {IMPORT_FIELDS[entityType].map((field) => <option key={field} value={field}>{field}</option>)}
                        </select>
                      </label>
                      {targetField && <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setFile(null);
                    setStep("upload");
                  }}
                  className="font-mono-data"
                >
                  Cancel
                </Button>
                {mappingDirty && (
                  <Button variant="outline" onClick={() => void revalidateMapping()} isLoading={validating}>
                    Recheck mapping
                  </Button>
                )}
                <Button
                  variant="primary"
                  onClick={handleImport}
                  isLoading={importing || validating}
                  disabled={mappingDirty || previewResult.error_rows_count > 0 || previewResult.valid_rows_count === 0 || validating}
                  className="font-mono-data"
                >
                  Commit {previewResult.valid_rows_count} {entityType} to Database
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {step === "success" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center p-8 rounded-2xl bg-nexus-surface-container-lowest border border-nexus-outline-variant/40 shadow-tactile-lg"
          >
            <div className="mb-6 inline-flex p-6 rounded-full bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 className="h-16 w-16" />
            </div>
            <h2 className="text-2xl font-extrabold text-nexus-on-surface mb-2">
              Import Completed Successfully
            </h2>
            <p className="text-base text-nexus-on-surface-variant mb-6 max-w-md mx-auto">
              <span className="font-bold text-nexus-on-surface">{importedStats.count}</span>{" "}
              {importedStats.entity.toLowerCase()} records have been transactionally inserted into
              your workspace database.
            </p>
            <Button
              variant="primary"
              size="lg"
              onClick={handleComplete}
              className="font-mono-data shadow-tactile-lg"
            >
              Enter Operations Command Center
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
