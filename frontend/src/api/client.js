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
    let detail = errorText;
    try {
      const payload = JSON.parse(errorText);
      detail = payload.detail || payload.message || errorText;
    } catch {
      // Preserve non-JSON server errors as-is.
    }
    throw new Error(`API Error ${response.status}: ${detail}`);
  }
  return response.json();
}

export const api = {
  getHealth: () => fetchJson('/health'),
  createTask: (description, capabilities) => fetchJson(`${API_BASE}/tasks`, {
    method: 'POST',
    body: JSON.stringify({ description, capabilities }),
  }),
  analyzeTask: ({ taskDescription }) => fetchJson(`${API_BASE}/tasks/analyze`, {
    method: 'POST',
    body: JSON.stringify({ task_description: taskDescription }),
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
