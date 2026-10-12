'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { tactileAudio } from '@/lib/sound-effects';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  X,
  Loader2,
  Table,
} from 'lucide-react';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType?: 'VEHICLES' | 'WAREHOUSES' | 'ORDERS';
  onSuccess?: () => void;
}

export function CsvImportModal({
  isOpen,
  onClose,
  entityType = 'VEHICLES',
  onSuccess,
}: CsvImportModalProps) {
  const { toast } = useToast();
  const [selectedType, setSelectedType] = useState<'VEHICLES' | 'WAREHOUSES' | 'ORDERS'>(entityType);
  const [csvContent, setCsvContent] = useState('');
  const [filename, setFilename] = useState('fleet_import.csv');
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [executingImport, setExecutingImport] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFilename(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvContent(text);
      previewFile(text, file.name);
    };
    reader.readAsText(file);
  };

  const previewFile = async (content: string, name: string) => {
    if (!content.trim()) return;
    setLoadingPreview(true);
    try {
      const res = await fetch('/api/v1/import/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_content: content,
          filename: name,
          entity_type: selectedType,
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to parse CSV: ${res.statusText}`);
      }

      const data = await res.json();
      setPreviewData(data);
      tactileAudio.playClick();
      toast({
        title: 'CSV Validated',
        message: `Found ${data.valid_rows_count || data.total_rows || 0} valid entries ready for ingestion.`,
        type: 'success',
      });
    } catch (err: any) {
      tactileAudio.playAlert();
      toast({
        title: 'CSV Parsing Error',
        message: err.message || 'Could not validate CSV file format.',
        type: 'critical',
      });
    } finally {
      setLoadingPreview(false);
    }
  };

  const executeImport = async () => {
    if (!previewData || !csvContent) return;
    setExecutingImport(true);

    try {
      const mapping = previewData.suggested_mapping || {};
      const res = await fetch('/api/v1/import/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_content: csvContent,
          filename: filename,
          entity_type: selectedType,
          column_mapping: mapping,
        }),
      });

      if (!res.ok) {
        throw new Error('Import execution failed');
      }

      tactileAudio.playClick();
      toast({
        title: 'Ingestion Completed',
        message: `Successfully ingested batch ${selectedType.toLowerCase()} into active fleet database.`,
        type: 'success',
      });
      onSuccess?.();
      onClose();
    } catch (err: any) {
      tactileAudio.playAlert();
      toast({
        title: 'Ingestion Error',
        message: err.message || 'Failed to commit data rows.',
        type: 'critical',
      });
    } finally {
      setExecutingImport(false);
    }
  };

  const sampleCsvs: Record<string, string> = {
    VEHICLES: `code,model,driver_name,speed_kmh,battery_pct,lat,lng\nNX-TRK-501,Volvo VNR Electric,Devon Vance,68.5,92,30.3165,78.0322\nNX-TRK-502,Freightliner eCascadia,Elena Rostova,71.0,84,29.9457,78.1642`,
    WAREHOUSES: `code,name,city,state,capacity_units,lat,lng\nWH-PNQ-01,Pune Intermodal Terminal,Pune,Maharashtra,75000,18.5204,73.8567\nWH-BLR-02,Bengaluru Tech Distribution,Bengaluru,Karnataka,90000,12.9716,77.5946`,
    ORDERS: `order_number,customer_name,destination,total_cost,priority,deadline\nORD-9021,Apex Cloud Systems,Haridwar Sector 4,84500.00,HIGH,2026-10-15T18:00:00Z\nORD-9022,Stratos BioPharma,Dehradun Cold Hub,125000.00,CRITICAL,2026-10-14T12:00:00Z`,
  };

  const loadSample = () => {
    const sample = sampleCsvs[selectedType];
    setCsvContent(sample);
    setFilename(`sample_${selectedType.toLowerCase()}.csv`);
    previewFile(sample, `sample_${selectedType.toLowerCase()}.csv`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-stone-900 dark:text-white">
                Bulk Ingestion & CSV Import
              </h3>
              <p className="text-xs text-stone-500">
                Upload or paste comma-separated operational fleet telemetry
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Entity Type Picker */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-mono text-stone-500">Target Entity:</label>
          {(['VEHICLES', 'WAREHOUSES', 'ORDERS'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                setSelectedType(type);
                setPreviewData(null);
                setCsvContent('');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                selectedType === type
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
              }`}
            >
              {type}
            </button>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={loadSample}
            className="ml-auto text-xs font-mono text-emerald-600 hover:text-emerald-700"
          >
            Load Sample Template
          </Button>
        </div>

        {/* File Drag & Drop Area */}
        <div className="border-2 border-dashed border-stone-300 dark:border-stone-700 rounded-xl p-6 text-center hover:border-emerald-500 transition-colors bg-stone-50/50 dark:bg-stone-950/40">
          <input
            type="file"
            accept=".csv,text/csv"
            id="csv-file-input"
            className="hidden"
            onChange={handleFileUpload}
          />
          <label
            htmlFor="csv-file-input"
            className="cursor-pointer flex flex-col items-center gap-2"
          >
            <FileText className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
              Click to select a .csv file from your disk
            </span>
            <span className="text-[11px] text-stone-500 font-mono">
              Accepts RFC 4180 compliant CSV exports
            </span>
          </label>
        </div>

        {/* Or Paste CSV Area */}
        <div className="space-y-1.5">
          <label className="text-xs font-mono text-stone-500">Or Paste Raw CSV Data:</label>
          <textarea
            rows={4}
            value={csvContent}
            onChange={(e) => {
              setCsvContent(e.target.value);
              if (previewData) setPreviewData(null);
            }}
            placeholder="paste csv rows here..."
            className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        {/* Validation Preview Card */}
        {loadingPreview ? (
          <div className="p-4 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center gap-2 text-xs font-mono text-stone-600 dark:text-stone-300">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
            Validating schema and data integrity...
          </div>
        ) : previewData ? (
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Ready for Ingestion
              </span>
              <span className="text-stone-600 dark:text-stone-400">
                {previewData.valid_rows_count || previewData.total_rows || 0} valid rows · {previewData.detected_columns?.length || 0} columns detected
              </span>
            </div>
            {previewData.detected_columns && (
              <div className="flex flex-wrap gap-1 text-[10px] font-mono text-stone-500">
                {previewData.detected_columns.map((col: string) => (
                  <span
                    key={col}
                    className="px-2 py-0.5 rounded bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800"
                  >
                    {col}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200 dark:border-stone-800">
          <Button variant="outline" size="sm" onClick={onClose} disabled={executingImport}>
            Cancel
          </Button>
          {!previewData ? (
            <Button
              size="sm"
              onClick={() => previewFile(csvContent, filename)}
              disabled={!csvContent.trim() || loadingPreview}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {loadingPreview ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
              Validate CSV
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={executeImport}
              disabled={executingImport}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {executingImport ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
              Confirm & Ingest ({previewData.valid_rows_count || previewData.total_rows} Entries)
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
