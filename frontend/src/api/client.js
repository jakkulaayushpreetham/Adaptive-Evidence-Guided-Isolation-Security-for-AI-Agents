const API_BASE = '/api';

export async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error ${response.status}: ${errorText}`);
  }
  return response.json();
}

export const api = {
  getHealth: () => fetchJson('/health'),
  createTask: (description) => fetchJson(`${API_BASE}/tasks`, {
    method: 'POST',
    body: JSON.stringify({ description }),
  }),
  getTask: (taskId) => fetchJson(`${API_BASE}/tasks/${taskId}`),
  runTask: (taskId) => fetchJson(`${API_BASE}/tasks/${taskId}/run`, { method: 'POST' }),
  getCapabilities: (taskId) => fetchJson(`${API_BASE}/tasks/${taskId}/capabilities`),
  getTrustState: (taskId) => fetchJson(`${API_BASE}/tasks/${taskId}/trust`),
  getTrustHistory: (taskId) => fetchJson(`${API_BASE}/trust/task/${taskId}/history`),
  getEvents: (taskId) => fetchJson(`${API_BASE}/tasks/${taskId}/events`),
  getTimeline: (taskId) => fetchJson(`${API_BASE}/tasks/${taskId}/timeline`),
  simulateOperation: (agentId, taskId, operation, resource) => fetchJson(`${API_BASE}/security/simulate`, {
    method: 'POST',
    body: JSON.stringify({
      agent_id: agentId,
      task_id: taskId,
      operation,
      resource,
    }),
  }),
};
