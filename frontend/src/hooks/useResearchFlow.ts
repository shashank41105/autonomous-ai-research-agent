import { useEffect } from 'react';
import { useSceneStore, Phase } from '../store/sceneStore';
import { researchClient } from '../api/researchClient';

export const useResearchFlow = () => {
  const {
    phase, setPhase,
    query, setQuery,
    taskId, setTaskId,
    sources, setSources,
    finalReport, setFinalReport,
    logs, setLogs,
    currentStep, setCurrentStep,
    setHistory,
    template,
    webhookUrl
  } = useSceneStore();

  const fetchHistory = async () => {
    try {
      const data = await researchClient.getHistory();
      setHistory(data || []);
    } catch (e) {
      console.error("Failed to fetch history", e);
    }
  };

  const startResearch = async (searchQuery?: string) => {
    const activeQuery = searchQuery || query;
    if (!activeQuery) return;

    if (searchQuery) {
      setQuery(searchQuery);
    }

    setPhase(Phase.EXPANDING);
    setLogs([]);
    setSources([]);
    setFinalReport(null);
    setCurrentStep("idle");

    try {
      const data = await researchClient.startResearch(activeQuery, template, webhookUrl);
      setTaskId(data.task_id);
      setPhase(Phase.SEARCHING);
    } catch (e) {
      console.error("Research start failed", e);
      setPhase(Phase.IDLE);
    }
  };

  const pollStatus = async () => {
    if (!taskId || phase === Phase.COMPLETE) return;

    try {
      const data = await researchClient.getStatus(taskId);
      
      // Update logs, sources and steps live!
      if (data.result) {
        if (data.result.logs) {
          setLogs(data.result.logs);
        }
        if (data.result.sources) {
          setSources(data.result.sources);
        }
        if (data.result.current_step) {
          setCurrentStep(data.result.current_step);
        }
      }

      if (data.status === 'completed') {
        setSources(data.result.sources || []);
        setFinalReport(data.result.final_report);
        setPhase(Phase.CONVERGING);

        // Transition to COMPLETE after convergence animation finishes
        setTimeout(() => {
          setPhase(Phase.COMPLETE);
          fetchHistory(); // Refresh history list
        }, 1500);
      } else if (data.status === 'failed') {
        const errorMsg = data.result?.error || 'Task failed';
        setLogs([...logs, `[CRITICAL CORE EXCEPTION] ${errorMsg}`]);
        setPhase(Phase.IDLE);
        setTaskId(null);
      }
    } catch (e) {
      console.error("Polling failed", e);
    }
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (taskId && phase !== Phase.COMPLETE) {
      interval = setInterval(pollStatus, 1500); // Snappy polling
    }
    return () => clearInterval(interval);
  }, [taskId, phase]);

  useEffect(() => {
    fetchHistory();
  }, []);

  return { startResearch, fetchHistory };
};
