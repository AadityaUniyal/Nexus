"use client";

import * as React from "react";
import {
  Sparkles,
  Send,
  Bot,
  User,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  Cpu,
  ChevronRight,
  Maximize2,
  Minimize2,
  X,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { tactileAudio } from "@/lib/sound-effects";
import { useToast } from "@/components/ui/toast";
import { motion, AnimatePresence } from "motion/react";
import { authFetch } from "@/lib/api/auth-fetch";

interface Message {
  id: string;
  sender: "USER" | "COPILOT";
  content: string;
  toolCalls?: Array<{ tool: string; category: string; result: any }>;
  approvalCard?: any;
  simulationResult?: any;
  citations?: Array<{ type: string; id: string; code: string }>;
  timestamp: string;
}

export function OperationalCopilot({ className }: { className?: string }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [inputPrompt, setInputPrompt] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [messages, setMessages] = React.useState<Message[]>([
    {
      id: "welcome-msg",
      sender: "COPILOT",
      content:
        "Greetings, Operations Commander. I am Nexus Operational Copilot, wired directly to your workspace telemetry, live GIS routing, and simulation engine. How can I assist your fleet decisions today?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputPrompt;
    if (!query.trim() || isLoading) return;

    tactileAudio.playClick();
    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: "USER",
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputPrompt("");
    setIsLoading(true);

    try {
      const data = await authFetch<any>("/api/v1/ai/chat", {
        method: "POST",
        body: JSON.stringify({ prompt: query }),
      });
      tactileAudio.playSuccessChord();

      const copilotMsg: Message = {
        id: data.message_id || `bot-${Date.now()}`,
        sender: "COPILOT",
        content: data.reply,
        toolCalls: data.tool_calls || [],
        approvalCard: data.approval_card,
        simulationResult: data.simulation_result,
        citations: data.citations || [],
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, copilotMsg]);
    } catch (err: any) {
      tactileAudio.playCriticalAlert();
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: "COPILOT",
          content:
            "I encountered a temporary communication failure connecting to the operational cluster. Please ensure your backend is reachable.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcessApproval = async (approvalId: string, decision: "APPROVE" | "REJECT") => {
    tactileAudio.playClick();
    try {
      const updatedAppr = await authFetch<any>(`/api/v1/governance/approvals/${approvalId}/action`, {
        method: "POST",
        body: JSON.stringify({
          decision,
          notes: `${decision === "APPROVE" ? "Approved" : "Rejected"} via Nexus Copilot UI`,
        }),
      });

      tactileAudio.playSuccessChord();
      toast({
        title: decision === "APPROVE" ? "Action Executed" : "Recommendation Rejected",
        message:
          decision === "APPROVE"
            ? "Vehicle reroute dispatched to cab telematics. Immutable audit event logged."
            : "Approval request dismissed. Corridor maintained.",
        type: decision === "APPROVE" ? "success" : "info",
      });

      // Update message card state in UI
      setMessages((prev) =>
        prev.map((m) => {
          if (m.approvalCard && m.approvalCard.approval_id === approvalId) {
            return {
              ...m,
              approvalCard: {
                ...m.approvalCard,
                status: updatedAppr.status,
                approved_by: updatedAppr.approved_by,
              },
            };
          }
          return m;
        })
      );
    } catch (err: any) {
      toast({
        title: "Approval Error",
        message: err.message || "Failed to submit approval action.",
        type: "critical",
      });
    }
  };

  return (
    <>
      {/* Floating Copilot Trigger Button */}
      <Button
        onClick={() => {
          tactileAudio.playClick();
          setIsOpen(!isOpen);
        }}
        className={cn(
          "fixed bottom-6 right-6 z-50 rounded-full shadow-2xl h-14 px-5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white flex items-center gap-2 border border-emerald-400/30 transition-all transform hover:scale-105",
          isOpen && "bg-slate-900 border-slate-700",
          className
        )}
      >
        <Sparkles className="w-5 h-5 text-emerald-200 animate-pulse" />
        <span className="font-semibold text-sm tracking-wide">Nexus AI Copilot</span>
      </Button>

      {/* Slide-over Copilot Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-[460px] max-w-[calc(100vw-32px)] h-[680px] max-h-[calc(100vh-120px)] bg-[#fdfcf9] dark:bg-slate-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-slate-800 flex flex-col overflow-hidden"
          >
            {/* Drawer Header */}
            <div className="p-4 bg-stone-100/80 dark:bg-slate-800/80 border-b border-stone-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                    Nexus Copilot
                    <Badge variant="outline" className="text-[10px] font-mono border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50">
                      FOUNDRY-AGENT
                    </Badge>
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Decision-Support & Controlled Tool Execution
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="rounded-full w-8 h-8 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Quick Action Chips */}
            <div className="px-4 py-2.5 bg-stone-50 dark:bg-slate-900/50 border-b border-stone-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto text-xs no-scrollbar">
              <button
                onClick={() => handleSendMessage("Give me a summary of fleet status and active incidents.")}
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-stone-600 dark:text-stone-300 hover:border-emerald-500 transition-colors"
              >
                📊 Fleet Summary
              </button>
              <button
                onClick={() => handleSendMessage("Which deliveries are at risk of SLA breach?")}
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-stone-600 dark:text-stone-300 hover:border-emerald-500 transition-colors"
              >
                ⚠️ SLA Risks
              </button>
              <button
                onClick={() => handleSendMessage("Simulate route options for vehicle NX-104 to bypass weather.")}
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-stone-600 dark:text-stone-300 hover:border-emerald-500 transition-colors"
              >
                ⚡ Simulate Detour
              </button>
            </div>

            {/* Messages Stream */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "flex flex-col gap-1 text-sm",
                    m.sender === "USER" ? "items-end" : "items-start"
                  )}
                >
                  <div className="flex items-center gap-1.5 text-[11px] text-stone-400 px-1">
                    {m.sender === "USER" ? (
                      <>
                        <span>You</span>
                        <User className="w-3 h-3" />
                      </>
                    ) : (
                      <>
                        <Bot className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <span>Nexus Copilot</span>
                      </>
                    )}
                    <span>• {m.timestamp}</span>
                  </div>

                  <div
                    className={cn(
                      "p-3.5 rounded-2xl max-w-[90%] leading-relaxed",
                      m.sender === "USER"
                        ? "bg-stone-900 text-stone-100 rounded-br-xs dark:bg-stone-100 dark:text-stone-900"
                        : "bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-stone-800 dark:text-stone-200 rounded-bl-xs shadow-xs"
                    )}
                  >
                    {/* Tool Calls Execution Badges */}
                    {m.toolCalls && m.toolCalls.length > 0 && (
                      <div className="mb-2.5 flex flex-wrap gap-1.5 pb-2 border-b border-stone-100 dark:border-slate-700/60">
                        {m.toolCalls.map((tc, idx) => (
                          <span
                            key={idx}
                            className={cn(
                              "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono",
                              tc.category === "ACT"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                                : tc.category === "ANALYZE"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
                                : "bg-stone-100 text-stone-700 dark:bg-slate-700 dark:text-stone-300"
                            )}
                          >
                            <Cpu className="w-2.5 h-2.5" />
                            {tc.category}: {tc.tool}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="whitespace-pre-line">{m.content}</div>

                    {/* Simulation Result Box */}
                    {m.simulationResult && m.simulationResult.simulatedMetrics && (
                      <div className="mt-3 p-3 bg-stone-50 dark:bg-slate-900/80 rounded-xl border border-stone-200 dark:border-slate-700 text-xs space-y-1.5">
                        <div className="font-semibold text-stone-900 dark:text-stone-100 flex items-center justify-between">
                          <span>Scenario Comparison Metrics</span>
                          <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                            {m.simulationResult.simulatedMetrics.verdict || "RECOMMENDED"}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                          <div className="p-1.5 bg-white dark:bg-slate-800 rounded border border-stone-200 dark:border-slate-700">
                            <span className="text-stone-400 block text-[10px]">TIME SAVED</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              +{m.simulationResult.simulatedMetrics.netTimeSavedMins || 135} mins
                            </span>
                          </div>
                          <div className="p-1.5 bg-white dark:bg-slate-800 rounded border border-stone-200 dark:border-slate-700">
                            <span className="text-stone-400 block text-[10px]">SLA BREACH RISK</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              {m.simulationResult.simulatedMetrics.slaBreachRiskPct || 12}% (was 88%)
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Human-in-the-Loop Approval Action Card */}
                    {m.approvalCard && (
                      <div className="mt-3 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs space-y-2">
                        <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-200">
                          <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          <span>Human-in-the-Loop Approval Gate</span>
                        </div>
                        <p className="text-stone-600 dark:text-stone-300 text-[11px]">
                          {m.approvalCard.impact_summary || m.approvalCard.message}
                        </p>

                        {m.approvalCard.status === "PENDING_APPROVAL" || m.approvalCard.status === "PENDING" ? (
                          <div className="flex items-center gap-2 pt-1.5">
                            <Button
                              size="sm"
                              onClick={() => handleProcessApproval(m.approvalCard.approval_id, "APPROVE")}
                              className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500 text-white gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Authorize & Execute Reroute
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleProcessApproval(m.approvalCard.approval_id, "REJECT")}
                              className="h-7 text-xs border-stone-300 dark:border-slate-700 text-stone-600 hover:bg-stone-100 dark:hover:bg-slate-800"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Dismiss
                            </Button>
                          </div>
                        ) : (
                          <div className="pt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Action Authorized by {m.approvalCard.approved_by || "Operations Manager"}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex items-center gap-2 text-xs text-stone-400 p-2">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500 animate-spin" />
                  <span>Nexus AI reasoning across fleet telemetry...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3 bg-white dark:bg-slate-900 border-t border-stone-200 dark:border-slate-800 flex items-center gap-2">
              <Input
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ask Copilot about fleet status, risks, or reroutes..."
                className="text-xs h-10 bg-stone-50 dark:bg-slate-800 border-stone-200 dark:border-slate-700 rounded-xl"
              />
              <Button
                onClick={() => handleSendMessage()}
                disabled={!inputPrompt.trim() || isLoading}
                size="icon"
                className="h-10 w-10 shrink-0 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
