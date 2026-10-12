'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { tactileAudio } from '@/lib/sound-effects';
import {
  LifeBuoy,
  X,
  Send,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Clock,
  Ticket,
} from 'lucide-react';

interface SupportTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SupportTicketModal({ isOpen, onClose }: SupportTicketModalProps) {
  const { toast } = useToast();
  const [tab, setTab] = useState<'NEW' | 'RECENT'>('NEW');
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('DISPATCH_ASSISTANCE');
  const [severity, setSeverity] = useState('MEDIUM');
  const [description, setDescription] = useState('');
  const [entityId, setEntityId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [recentTickets, setRecentTickets] = useState<any[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  if (!isOpen) return null;

  const loadRecentTickets = async () => {
    setLoadingTickets(true);
    try {
      const res = await fetch('/api/v1/support/tickets');
      if (res.ok) {
        const data = await res.json();
        setRecentTickets(data);
      }
    } catch {}
    finally {
      setLoadingTickets(false);
    }
  };

  const handleTabChange = (newTab: 'NEW' | 'RECENT') => {
    setTab(newTab);
    tactileAudio.playClick();
    if (newTab === 'RECENT') {
      loadRecentTickets();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          category,
          severity,
          description,
          entity_id: entityId.trim() || undefined,
        }),
      });

      if (!res.ok) throw new Error('Failed to submit ticket');
      const data = await res.json();

      tactileAudio.playClick();
      toast({
        title: 'Dispatch Ticket Dispatched',
        message: `Ticket ${data.ticketId || 'TCK'} assigned to Level-2 Operations Support.`,
        type: 'success',
      });

      setSubject('');
      setDescription('');
      setEntityId('');
      onClose();
    } catch (err: any) {
      tactileAudio.playAlert();
      toast({
        title: 'Submission Error',
        message: err.message || 'Could not dispatch support request.',
        type: 'critical',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-white">
                Dispatch Assistance & Operational Support
              </h3>
              <p className="text-xs text-stone-500">
                Direct hotline to regional fleet engineering & dispatch command
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
          <button
            type="button"
            onClick={() => handleTabChange('NEW')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              tab === 'NEW'
                ? 'bg-stone-900 text-white dark:bg-white dark:text-black'
                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            New Request
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('RECENT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              tab === 'RECENT'
                ? 'bg-stone-900 text-white dark:bg-white dark:text-black'
                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            Active Tickets
          </button>
        </div>

        {tab === 'NEW' ? (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-xs font-mono text-stone-600 dark:text-stone-400">
                Subject / Operational Summary
              </label>
              <input
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Auxiliary cooling sensor drift on NX-TRK-109"
                className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-xs font-sans focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-mono text-stone-600 dark:text-stone-400">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-xs font-mono focus:outline-none"
                >
                  <option value="DISPATCH_ASSISTANCE">Dispatch Assistance</option>
                  <option value="HARDWARE_ISSUE">Telemetry / Hardware</option>
                  <option value="ROUTE_OBSTRUCTION">Corridor Obstruction</option>
                  <option value="SYSTEM_BUG">Platform Anomalies</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-stone-600 dark:text-stone-400">
                  Priority Severity
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-xs font-mono focus:outline-none"
                >
                  <option value="LOW">Low (Informational)</option>
                  <option value="MEDIUM">Medium (Non-blocking)</option>
                  <option value="HIGH">High (Active Delay)</option>
                  <option value="CRITICAL">Critical (Safety / Halt)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono text-stone-600 dark:text-stone-400">
                Affected Entity Code / Asset ID (Optional)
              </label>
              <input
                value={entityId}
                onChange={(e) => setEntityId(e.target.value)}
                placeholder="e.g. NX-TRK-109, WH-DED-01, ORD-701"
                className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-xs font-mono focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono text-stone-600 dark:text-stone-400">
                Detailed Incident Description
              </label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe current status, diagnostic readings, or assistance required..."
                className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-xs font-sans focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submitting || !subject.trim() || !description.trim()}
                className="bg-sky-600 hover:bg-sky-700 text-white"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Send className="w-3.5 h-3.5 mr-1.5" />}
                Dispatch Ticket
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {loadingTickets ? (
              <div className="py-8 text-center text-xs font-mono text-stone-500 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
                Loading dispatch queue...
              </div>
            ) : recentTickets.length === 0 ? (
              <div className="py-8 text-center text-xs font-mono text-stone-400">
                No active dispatch tickets logged.
              </div>
            ) : (
              recentTickets.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-xl bg-stone-50 dark:bg-stone-950/40 border border-stone-200 dark:border-stone-800 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
                      {t.id}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        t.status === 'RESOLVED'
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : t.status === 'IN_PROGRESS'
                          ? 'bg-sky-500/10 text-sky-600'
                          : 'bg-amber-500/10 text-amber-600'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-stone-900 dark:text-white">
                    {t.subject}
                  </h4>
                  <p className="text-[11px] text-stone-500 line-clamp-2">
                    {t.description}
                  </p>
                  <div className="text-[10px] font-mono text-stone-400 pt-1 flex items-center justify-between border-t border-stone-200/40 dark:border-stone-800">
                    <span>Target: {t.entity_id || 'System'}</span>
                    <span>{t.created_at?.slice(0, 10)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
