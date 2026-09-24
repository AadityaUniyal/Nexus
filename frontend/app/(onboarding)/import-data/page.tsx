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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ImportDataPage() {
  const router = useRouter();
  const [dragActive, setDragActive] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [importing, setImporting] = React.useState(false);
  const [step, setStep] = React.useState<"upload" | "mapping" | "preview" | "success">(
    "upload"
  );

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
      if (droppedFile.type === "text/csv" || droppedFile.name.endsWith(".csv")) {
        setFile(droppedFile);
        setStep("mapping");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStep("mapping");
    }
  };

  const handleImport = async () => {
    setImporting(true);
    // Simulate import
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setStep("success");
    setImporting(false);
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
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-nexus-on-surface tracking-tight mb-3">
            Import Your Fleet Data
          </h1>
          <p className="text-base text-nexus-on-surface-variant">
            Upload a CSV file with your vehicles, routes, or warehouses to get started.
          </p>
        </div>

        {step === "upload" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
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
                  Drop your CSV file here
                </h3>
                <p className="text-sm text-nexus-on-surface-variant mb-6">
                  or click to browse your files
                </p>

                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button variant="primary" className="font-mono-data">
                    <span>
                      <FileText className="h-4 w-4 mr-2" />
                      Select CSV File
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
                    Don't have a CSV file ready?
                  </p>
                  <p className="text-xs text-nexus-on-surface-variant">
                    Download our template to get started
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="font-mono-data text-xs">
                Download Template
              </Button>
            </div>
          </motion.div>
        )}

        {step === "mapping" && file && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="p-6 rounded-2xl bg-nexus-surface-container-lowest border border-nexus-outline-variant/40 shadow-tactile">
              {/* File info */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-nexus-outline-variant/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-nexus-secondary/10">
                    <FileText className="h-5 w-5 text-nexus-secondary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-nexus-on-surface">
                      {file.name}
                    </p>
                    <p className="text-xs text-nexus-on-surface-variant">
                      {(file.size / 1024).toFixed(1)} KB
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

              {/* Column mapping preview */}
              <div className="space-y-3 mb-6">
                <h4 className="text-sm font-bold text-nexus-on-surface">
                  Column Mapping (Auto-detected)
                </h4>
                {[
                  { csv: "vehicle_code", maps: "Vehicle ID" },
                  { csv: "driver_name", maps: "Driver Name" },
                  { csv: "latitude", maps: "Latitude" },
                  { csv: "longitude", maps: "Longitude" },
                ].map((mapping, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-lg bg-nexus-surface-container text-sm"
                  >
                    <span className="font-mono-data text-nexus-on-surface-variant">
                      {mapping.csv}
                    </span>
                    <ArrowRight className="h-4 w-4 text-nexus-on-surface-variant" />
                    <span className="font-medium text-nexus-on-surface">
                      {mapping.maps}
                    </span>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  </div>
                ))}
              </div>

              {/* Validation status */}
              <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 flex items-center gap-2 mb-6">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <p className="text-xs text-nexus-on-surface">
                  All columns validated successfully. Ready to import 42 vehicles.
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3">
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
                <Button
                  variant="primary"
                  onClick={handleImport}
                  isLoading={importing}
                  className="font-mono-data"
                >
                  Import Data
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {step === "success" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="mb-6 inline-flex p-6 rounded-full bg-emerald-500/10">
              <CheckCircle2 className="h-16 w-16 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-extrabold text-nexus-on-surface mb-3">
              Import Successful!
            </h2>
            <p className="text-base text-nexus-on-surface-variant mb-8">
              42 vehicles have been imported and are now live in your fleet dashboard.
            </p>
            <Button
              variant="primary"
              size="lg"
              onClick={handleComplete}
              className="font-mono-data shadow-tactile-lg"
            >
              Go to Dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
