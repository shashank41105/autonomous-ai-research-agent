import axios from 'axios';

const API_BASE = '/api';

export const researchClient = {
  async startResearch(query: string, template: string = 'DEEP_DIVE', webhookUrl?: string) {
    const { data } = await axios.post(`${API_BASE}/research`, { query, template, webhook_url: webhookUrl || null });
    return data; // { task_id, status }
  },

  async getStatus(taskId: string) {
    const { data } = await axios.get(`${API_BASE}/status/${taskId}`);
    return data; // { status, result: { final_report, sources, logs, current_step } }
  },

  async getHistory() {
    const { data } = await axios.get(`${API_BASE}/history`);
    return data; // Array of { task_id, status, query, result }
  }
};
