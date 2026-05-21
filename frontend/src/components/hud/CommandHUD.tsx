import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSceneStore, Phase } from '../../store/sceneStore';
import { useResearchFlow } from '../../hooks/useResearchFlow';
import { 
  Search, Cpu, FileText, Loader2, Database, BookOpen, ExternalLink, 
  Layers, Play, ChevronRight, Copy, X, Terminal, Check, Sparkles 
} from 'lucide-react';

export const CommandHUD = () => {
  const {
    query, setQuery,
    phase, setPhase,
    taskId, setTaskId,
    sources, setSources,
    finalReport, setFinalReport,
    logs, setLogs,
    currentStep, setCurrentStep,
    history,
    llmModel, setLlmModel,
    template, setTemplate,
    isHistoryOpen, setIsHistoryOpen
  } = useSceneStore();

  const { startResearch } = useResearchFlow();
  const [copied, setCopied] = useState(false);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll the live telemetry terminal
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const handleCopyReport = () => {
    if (finalReport) {
      navigator.clipboard.writeText(finalReport);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const loadPastResearch = (pastTask: any) => {
    setQuery(pastTask.query || '');
    setTaskId(pastTask.task_id);
    setSources(pastTask.result?.sources || []);
    setFinalReport(pastTask.result?.final_report || null);
    setLogs(pastTask.result?.logs || []);
    setCurrentStep(pastTask.result?.current_step || 'complete');
    setPhase(Phase.COMPLETE);
    setIsHistoryOpen(false);
  };

  // Flowchart node states
  const steps = [
    { id: 'planner', label: 'PLAN' },
    { id: 'search', label: 'SEARCH' },
    { id: 'scrape', label: 'SCRAPE' },
    { id: 'summarize', label: 'INSIGHT' },
    { id: 'synthesize', label: 'SYNTHESIZE' }
  ];

  const getStepStatus = (stepId: string) => {
    const stepOrder = ['planner', 'search', 'scrape', 'summarize', 'synthesize', 'complete', 'review'];
    const activeIdx = stepOrder.indexOf(currentStep);
    const targetIdx = stepOrder.indexOf(stepId);

    if (currentStep === 'idle') return 'pending';
    if (currentStep === 'complete') return 'completed';
    if (activeIdx === targetIdx) return 'active';
    return targetIdx < activeIdx ? 'completed' : 'pending';
  };

  // Highly customized markdown parser for that premium editorial feel
  const renderEditorialContent = (content: string) => {
    if (!content) return null;
    
    return content.split('\n').map((line, idx) => {
      const trimmed = line.trim();
      
      if (!trimmed) return <div key={idx} className="h-4" />;

      // Header H1 / Title (e.g. # Header)
      if (trimmed.startsWith('# ')) {
        return (
          <h1 key={idx} className="font-serif text-cyan-200 text-3xl md:text-4xl mt-8 mb-4 tracking-tight border-b border-cyan-500/20 pb-2">
            {trimmed.substring(2)}
          </h1>
        );
      }

      // Header H2 (e.g. ## Header)
      if (trimmed.startsWith('## ')) {
        return (
          <h2 key={idx} className="font-serif text-cyan-300 text-2xl md:text-3xl mt-7 mb-3 tracking-tight">
            {trimmed.substring(3)}
          </h2>
        );
      }

      // Header H3 (e.g. ### Header)
      if (trimmed.startsWith('### ')) {
        return (
          <h3 key={idx} className="font-serif text-cyan-400 text-xl md:text-2xl mt-6 mb-2 tracking-tight">
            {trimmed.substring(4)}
          </h3>
        );
      }

      // Lists / Bullet points
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const itemText = trimmed.substring(2);
        return (
          <div key={idx} className="flex items-start gap-3 my-2 pl-4">
            <span className="text-cyan-500 font-mono text-lg mt-0.5">•</span>
            <p className="font-sans text-slate-300 text-base leading-relaxed pr-2">
              {parseCitations(itemText)}
            </p>
          </div>
        );
      }

      // References list at bottom
      if (trimmed.match(/^\d+\.\s/)) {
        return (
          <div key={idx} className="font-mono text-cyan-500/70 text-xs py-1 hover:text-cyan-400 transition-colors border-l-2 border-cyan-950 pl-3 my-1">
            {trimmed}
          </div>
        );
      }

      // Standard paragraphs
      return (
        <p key={idx} className="font-sans text-slate-300 text-base leading-relaxed mb-4 text-justify">
          {parseCitations(trimmed)}
        </p>
      );
    });
  };

  // Helper to colorize bracketed citations [1]
  const parseCitations = (text: string) => {
    const parts = text.split(/(\[\d+\])/g);
    return parts.map((part, i) => {
      if (part.match(/^\[\d+\]$/)) {
        return (
          <span 
            key={i} 
            className="text-cyan-400 bg-cyan-950/50 border border-cyan-500/25 px-1.5 py-0.5 rounded font-mono text-xs font-semibold mx-0.5 shadow-[0_0_8px_rgba(6,182,212,0.2)]"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-10 flex flex-col justify-between p-6 md:p-8 font-sans">
      
      {/* Top Header Controls */}
      <div className="flex justify-between items-center w-full pointer-events-auto">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
            className="bg-slate-900/60 backdrop-blur-md border border-cyan-500/30 p-3 rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.15)] text-cyan-400 hover:text-cyan-300 hover:border-cyan-400/50 transition-all cursor-pointer"
            title="Toggle Mission Logs Archive"
          >
            <Database size={20} className={isHistoryOpen ? 'animate-pulse' : ''} />
          </button>

          <div className="bg-slate-900/60 backdrop-blur-md border border-cyan-500/30 p-3 px-4 rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.15)] flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Cpu size={16} className="text-cyan-400 animate-pulse" />
              <span className="font-mono text-xs uppercase tracking-widest font-bold text-cyan-400">MISSION CONTROL</span>
            </div>
            <div className="h-4 w-[1px] bg-cyan-500/20" />
            <div className="font-mono text-xs text-white">
              STEP: <span className="text-cyan-400 uppercase font-bold">{currentStep}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-sm border border-cyan-500/10 p-3 rounded-lg text-right opacity-60 text-[10px] font-mono text-cyan-400 hidden sm:block">
          ASTRAL ARCHIVE HUD v1.5 // DEEP INFERENCE ENGINE<br />
          CORES: ACTIVE (8/8) // NETWORK LATENCY: 18ms
        </div>
      </div>

      {/* Main Panel Layout (Absolute Positioning to avoid layout shift) */}
      <div className="absolute inset-x-8 top-28 bottom-32 flex gap-6 pointer-events-none">
        
        {/* Left Drawer: Research Archive history */}
        <AnimatePresence>
          {isHistoryOpen && (
            <motion.div
              initial={{ x: -350, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -350, opacity: 0 }}
              transition={{ type: 'spring', damping: 20 }}
              className="w-80 pointer-events-auto bg-slate-950/80 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-5 shadow-2xl flex flex-col gap-4"
            >
              <div className="flex justify-between items-center border-b border-cyan-500/20 pb-3">
                <div className="flex items-center gap-2 text-cyan-400">
                  <Database size={18} />
                  <span className="font-mono text-sm font-bold uppercase tracking-wider">Mission Logs Database</span>
                </div>
                <button 
                  onClick={() => setIsHistoryOpen(false)} 
                  className="text-slate-500 hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1">
                {history.length === 0 ? (
                  <div className="text-center font-mono text-xs text-slate-500 my-10">
                    NO LOG RECORDS FOUND.
                  </div>
                ) : (
                  history.map((item, i) => (
                    <div
                      key={i}
                      onClick={() => loadPastResearch(item)}
                      className="group bg-slate-900/50 hover:bg-cyan-950/30 border border-cyan-500/10 hover:border-cyan-500/40 p-3 rounded-lg cursor-pointer transition-all shadow-[0_2px_8px_rgba(0,0,0,0.2)]"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] font-mono text-cyan-500/50 uppercase">LOG_ARCHIVE_{i+104}</span>
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase ${
                          item.status === 'completed' 
                            ? 'bg-cyan-950/40 text-cyan-400 border-cyan-500/30' 
                            : 'bg-red-950/40 text-red-400 border-red-500/30'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      <div className="font-sans text-xs font-semibold text-slate-300 group-hover:text-white line-clamp-2 leading-relaxed">
                        {item.query}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Center Panel: Live scrolling Terminal Telemetry stream */}
        <div className="flex-1 flex flex-col gap-4 pointer-events-none">
          <div className="flex-1 pointer-events-auto bg-slate-950/40 backdrop-blur-md border border-cyan-500/20 rounded-xl p-5 flex flex-col justify-between shadow-[0_0_30px_rgba(6,182,212,0.05)] overflow-hidden">
            
            {/* Terminal Header */}
            <div className="flex justify-between items-center border-b border-cyan-500/15 pb-3">
              <div className="flex items-center gap-2 text-cyan-400">
                <Terminal size={16} />
                <span className="font-mono text-xs uppercase tracking-wider font-bold">Live Telemetry Terminal Feed</span>
              </div>
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-cyan-500/30 animate-pulse" />
                <span className="w-2 h-2 rounded-full bg-cyan-500/50" />
                <span className="w-2 h-2 rounded-full bg-cyan-500" />
              </div>
            </div>

            {/* Monospaced Log Stream */}
            <div className="flex-1 overflow-y-auto font-mono text-[11px] text-cyan-400/90 py-4 space-y-2.5 scrollbar-thin select-text">
              {logs.length === 0 ? (
                <div className="text-cyan-500/50 flex flex-col justify-center items-center h-full gap-4 text-center leading-relaxed">
                  <Cpu size={32} className="animate-spin text-cyan-500/30" />
                  <div>
                    <span className="font-bold text-cyan-400 text-xs">ASTRAL ARCHIVE v1.5 COGNITIVE SYSTEM</span><br />
                    ENTER INTEL QUERY BELOW AND CLICK INITIATE TO ACTIVATE NODE SCANNER.
                  </div>
                </div>
              ) : (
                <>
                  {logs.map((log, i) => (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }} 
                      animate={{ opacity: 1, x: 0 }} 
                      key={i} 
                      className="hover:bg-cyan-500/5 px-2 py-0.5 rounded transition-all leading-relaxed whitespace-pre-wrap border-l border-cyan-500/20"
                    >
                      {log}
                    </motion.div>
                  ))}
                  {phase !== Phase.IDLE && phase !== Phase.COMPLETE && (
                    <div className="flex items-center gap-2 text-cyan-300 font-bold px-2 py-1 animate-pulse">
                      <Loader2 className="animate-spin" size={12} />
                      <span>COGNITIVE CORE RUNNING... AWAITING RESPONSE FROM SYSTEM NODES</span>
                    </div>
                  )}
                  <div ref={consoleEndRef} />
                </>
              )}
            </div>

            {/* Visual Process Flowchart */}
            {phase !== Phase.IDLE && (
              <div className="border-t border-cyan-500/15 pt-4 flex justify-between items-center gap-1 md:gap-3 flex-wrap">
                {steps.map((s, idx) => {
                  const status = getStepStatus(s.id);
                  return (
                    <React.Fragment key={s.id}>
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full border flex items-center justify-center font-mono text-[10px] font-bold shadow-md transition-all ${
                          status === 'completed'
                            ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                            : status === 'active'
                            ? 'bg-cyan-950/80 text-cyan-400 border-cyan-400 animate-pulse scale-110 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                            : 'bg-slate-950 text-slate-600 border-slate-800'
                        }`}>
                          {status === 'completed' ? <Check size={10} strokeWidth={3} /> : idx + 1}
                        </div>
                        <span className={`font-mono text-[9px] uppercase tracking-wider font-semibold hidden md:inline ${
                          status === 'active' ? 'text-cyan-400 font-bold' : status === 'completed' ? 'text-cyan-500' : 'text-slate-600'
                        }`}>
                          {s.label}
                        </span>
                      </div>
                      {idx < steps.length - 1 && (
                        <ChevronRight 
                          size={14} 
                          className={status === 'completed' ? 'text-cyan-500/50' : 'text-slate-800'} 
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            )}

          </div>
        </div>

        {/* Right Panel: Found source nodes cards */}
        {sources.length > 0 && (
          <div className="w-80 pointer-events-auto bg-slate-950/40 backdrop-blur-md border border-cyan-500/20 rounded-xl p-5 shadow-[0_0_30px_rgba(6,182,212,0.05)] flex flex-col gap-4 overflow-hidden">
            <div className="flex items-center gap-2 text-cyan-400 border-b border-cyan-500/15 pb-3">
              <BookOpen size={16} />
              <span className="font-mono text-xs uppercase tracking-wider font-bold">Telemetry Source Inspector</span>
            </div>

            <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1 scrollbar-thin select-text">
              {sources.map((url, i) => {
                const domain = url.split("//")[-1].split("/")[0];
                const relevance = Math.floor(98 - (i * 3) - (Math.random() * 2));
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={i}
                    className="bg-slate-900/60 hover:bg-cyan-950/20 border border-cyan-500/10 hover:border-cyan-500/30 p-3.5 rounded-lg shadow-sm group transition-all"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-mono text-[9px] text-cyan-500 bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-500/20 uppercase tracking-widest font-semibold">
                        SOURCE_{i+1}
                      </span>
                      <a 
                        href={url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-slate-500 hover:text-cyan-400 transition-colors"
                      >
                        <ExternalLink size={12} />
                      </a>
                    </div>
                    <div className="font-sans text-xs font-bold text-slate-200 truncate group-hover:text-cyan-200 mb-2">
                      {domain}
                    </div>
                    
                    {/* Relevance Meter */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] font-mono text-slate-400">
                        <span>RELEVANCE RATIO</span>
                        <span className="text-cyan-400 font-bold">{relevance}%</span>
                      </div>
                      <div className="h-1 bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${relevance}%` }}
                          transition={{ duration: 1 }}
                          className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.4)]"
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* Center: Editorial Research Report Overlay Modal */}
      <AnimatePresence>
        {phase === Phase.COMPLETE && finalReport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-auto bg-slate-950/80 backdrop-blur-2xl z-50 flex items-center justify-center p-4 md:p-8"
          >
            <motion.div
              initial={{ scale: 0.95, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 30 }}
              className="bg-slate-900/60 backdrop-blur-xl border border-cyan-500/30 rounded-2xl w-full max-w-4xl h-full max-h-[85vh] shadow-[0_0_50px_rgba(6,182,212,0.15)] flex flex-col justify-between overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center p-6 border-b border-cyan-500/15 bg-slate-950/40 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="bg-cyan-500/10 p-2.5 rounded-lg border border-cyan-500/30 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.1)]">
                    <BookOpen size={22} />
                  </div>
                  <div>
                    <span className="font-mono text-[9px] uppercase tracking-widest text-cyan-400 font-bold block mb-0.5">KNOWLEDGE ACQUISITION LOG</span>
                    <h2 className="text-xl md:text-2xl font-serif text-white font-bold tracking-tight leading-none">
                      Synthesized Research Dossier
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Performance Score Badge */}
                  <div className="bg-cyan-950/40 border border-cyan-500/30 rounded-lg px-3 py-1.5 text-right hidden sm:block">
                    <span className="text-[8px] font-mono text-cyan-500/50 uppercase block font-bold">Confidence Gauge</span>
                    <span className="text-sm font-mono text-cyan-400 font-bold tracking-wider">96.4%</span>
                  </div>

                  <button
                    onClick={() => setPhase(Phase.IDLE)}
                    className="bg-cyan-500/10 hover:bg-cyan-500 text-cyan-400 hover:text-slate-950 p-2 rounded-lg border border-cyan-500/30 hover:border-cyan-500 transition-all cursor-pointer shadow-md"
                    title="Close Archive"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Editorial styled report viewer */}
              <div className="flex-1 overflow-y-auto p-6 md:p-10 select-text scrollbar-thin bg-slate-950/30">
                <div className="max-w-3xl mx-auto font-sans leading-relaxed">
                  
                  {/* Visual Drop Cap Cover Section */}
                  <div className="flex items-center gap-2 mb-6 border border-cyan-500/10 p-4 rounded-xl bg-cyan-950/10">
                    <Sparkles size={20} className="text-cyan-400 animate-pulse shrink-0" />
                    <p className="font-mono text-[10px] text-cyan-400/80 leading-relaxed uppercase tracking-wider">
                      This report has been compiled and aggregated by Astral Archive via cognitive local pipeline. Content holds direct sources linked as bracketed reference pointers.
                    </p>
                  </div>

                  {renderEditorialContent(finalReport)}
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div className="p-5 border-t border-cyan-500/15 bg-slate-950/40 backdrop-blur-md flex justify-between items-center gap-3 flex-wrap">
                <div className="font-mono text-[9px] text-slate-500 uppercase tracking-widest">
                  Task ID: {taskId}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleCopyReport}
                    className="flex items-center gap-2 bg-slate-900/60 hover:bg-cyan-950/40 border border-cyan-500/20 hover:border-cyan-500/50 text-cyan-400 px-4.5 py-2.5 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer shadow-sm hover:shadow-[0_0_12px_rgba(6,182,212,0.2)]"
                  >
                    {copied ? <Check size={14} className="text-cyan-400" /> : <Copy size={14} />}
                    {copied ? 'LOG COPIED' : 'COPY ARCHIVE TEXT'}
                  </button>

                  <button
                    onClick={() => window.location.reload()}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2.5 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer shadow-lg hover:shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                  >
                    LAUNCH NEW INQUIRY
                  </button>
                </div>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Bar: Settings and Prompt Input */}
      <div className="flex flex-col gap-3 w-full max-w-4xl mx-auto pointer-events-auto mt-auto">
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-slate-950/60 backdrop-blur-md border border-cyan-500/25 rounded-2xl p-4 flex flex-col gap-3 shadow-[0_0_30px_rgba(6,182,212,0.12)] border-l-4 border-l-cyan-400"
        >
          {/* Settings Row */}
          <div className="flex items-center justify-between flex-wrap gap-4 text-xs font-mono border-b border-cyan-500/10 pb-3">
            
            {/* Model Selector */}
            <div className="flex items-center gap-2">
              <span className="text-cyan-500/60 font-bold uppercase tracking-wider text-[10px]">AI Processor:</span>
              <select
                value={llmModel}
                onChange={(e) => setLlmModel(e.target.value)}
                disabled={phase !== Phase.IDLE}
                className="bg-slate-900 border border-cyan-500/20 text-cyan-400 rounded p-1.5 px-3.5 focus:outline-none focus:border-cyan-400 font-bold text-xs cursor-pointer disabled:opacity-50"
              >
                <option value="Llama 3 (Local)">ASTRAL-1 (Llama 3 Balanced)</option>
                <option value="Llama 3.1 Pro">NEBULA-X (Deep Research)</option>
              </select>
            </div>

            {/* Template Selector */}
            <div className="flex items-center gap-2">
              <span className="text-cyan-500/60 font-bold uppercase tracking-wider text-[10px]">Dossier Style:</span>
              <div className="flex gap-1 bg-slate-900 border border-cyan-500/20 p-0.5 rounded">
                {(['DEEP_DIVE', 'EXECUTIVE_BRIEF', 'COMPARATIVE_ANALYSIS'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTemplate(t)}
                    disabled={phase !== Phase.IDLE}
                    className={`px-3.5 py-1 text-[9px] font-bold rounded tracking-wider transition-all cursor-pointer ${
                      template === t 
                        ? 'bg-cyan-500 text-slate-950' 
                        : 'text-cyan-500/70 hover:text-cyan-300 hover:bg-cyan-950/30'
                    } disabled:opacity-50`}
                  >
                    {t.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Prompt Input Row */}
          <div className="flex items-center gap-3">
            <Search size={22} className="text-cyan-500 animate-pulse ml-1" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={phase !== Phase.IDLE}
              placeholder="Enter quantum research query... (e.g., 'Quantum computing scalability limits')"
              className="bg-transparent border-none outline-none text-white placeholder-cyan-800/80 w-full text-base font-mono focus:ring-0 disabled:opacity-60"
              onKeyDown={(e) => e.key === 'Enter' && phase === Phase.IDLE && startResearch()}
            />
            <button
              onClick={() => startResearch()}
              disabled={phase !== Phase.IDLE || !query.trim()}
              className="bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 disabled:text-slate-500 disabled:border-slate-800 text-slate-950 border border-cyan-400 hover:border-cyan-300 px-7 py-3 rounded-xl font-mono text-xs uppercase tracking-widest font-extrabold transition-all duration-300 flex items-center gap-2 cursor-pointer shadow-md hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] disabled:shadow-none"
            >
              {phase === Phase.IDLE ? (
                <>
                  <Play size={12} fill="currentColor" />
                  <span>Launch</span>
                </>
              ) : (
                <>
                  <Loader2 className="animate-spin" size={14} />
                  <span>Processing</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>

    </div>
  );
};
