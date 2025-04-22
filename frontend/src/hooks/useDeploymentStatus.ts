import { useState, useEffect, useRef } from 'react';
import apiClient from '../api';

interface DeploymentStatus {
  deployment_id: string;
  resource_type: string;
  name: string;
  environment: string;
  region: string;
  status: string;
  outputs: Record<string, any>;
  parameters: Record<string, any>;
  created_at: string;
  completed_at?: string;
  error_message?: string;
  isLoading: boolean;
  error: Error | null;
}

interface UseDeploymentStatusProps {
  deploymentId: string;
  wsEnabled?: boolean; // Whether to use WebSockets (default: true)
  pollingEnabled?: boolean; // Whether to use polling as fallback (default: true)
  pollingInterval?: number; // Milliseconds between polling (default: 5000)
}

/**
 * Custom hook to track deployment status in real-time
 * Uses WebSockets with fallback to polling for older browsers
 */
export const useDeploymentStatus = ({
  deploymentId,
  wsEnabled = true,
  pollingEnabled = true,
  pollingInterval = 5000
}: UseDeploymentStatusProps): {
  status: DeploymentStatus | null;
  logs: string[];
  refetch: () => void;
} => {
  const [status, setStatus] = useState<DeploymentStatus | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isCompletedRef = useRef<boolean>(false);
  
  // Helper to fetch deployment status via REST API
  const fetchDeploymentStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      setIsLoading(true);
      
      const response = await apiClient.get(`/api/deployments/${deploymentId}/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const fetchedStatus = {
        ...response.data,
        isLoading: false,
        error: null
      };
      
      setStatus(fetchedStatus);
      
      // Track if deployment is completed to stop polling
      if (fetchedStatus.status === 'completed' || fetchedStatus.status === 'failed') {
        isCompletedRef.current = true;
        
        // Fetch logs one last time
        fetchDeploymentLogs();
      }
      
      setIsLoading(false);
    } catch (err: any) {
      setError(err);
      setIsLoading(false);
    }
  };
  
  // Helper to fetch deployment logs via REST API
  const fetchDeploymentLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return;
      }
      
      const response = await apiClient.get(`/api/deployments/${deploymentId}/logs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data && response.data.logs) {
        setLogs(response.data.logs);
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    }
  };
  
  // Setup WebSocket connection
  useEffect(() => {
    if (!wsEnabled || !deploymentId) return;
    
    // Determine WebSocket URL (same host as API but ws:// protocol)
    const apiUrl = new URL(apiClient.defaults.baseURL || 'https://platform-hub.onrender.com');
    const wsUrl = `${apiUrl.protocol === 'https:' ? 'wss:' : 'ws:'}//${apiUrl.host}/ws/deployments/${deploymentId}`;
    
    // Create WebSocket connection
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    
    // WebSocket event handlers
    ws.onopen = () => {
      console.log('WebSocket connection established');
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle different message types
        if (data.type === 'status_update' && data.data) {
          // Merge with existing status data
          setStatus((prevStatus) => {
            if (!prevStatus) return null;
            return {
              ...prevStatus,
              ...data.data,
              isLoading: false,
              error: null
            };
          });
          
          // Fetch updated logs when status changes
          fetchDeploymentLogs();
        } else if (data.type === 'deployment_finished') {
          // Final update - deployment is complete
          isCompletedRef.current = true;
          
          // Fetch final status and logs
          fetchDeploymentStatus();
          fetchDeploymentLogs();
        } else if (data.error) {
          console.error('WebSocket error:', data.error);
          setError(new Error(data.error));
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      // Fall back to polling on WebSocket error
      if (pollingEnabled && !pollingIntervalRef.current) {
        startPolling();
      }
    };
    
    ws.onclose = () => {
      console.log('WebSocket connection closed');
      wsRef.current = null;
      
      // Fall back to polling if WebSocket closes unexpectedly
      if (pollingEnabled && !isCompletedRef.current && !pollingIntervalRef.current) {
        startPolling();
      }
    };
    
    // Fetch initial status and logs
    fetchDeploymentStatus();
    fetchDeploymentLogs();
    
    // Cleanup function
    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [deploymentId, wsEnabled]);
  
  // Setup polling as fallback or if WebSockets are disabled
  const startPolling = () => {
    // Initial fetch
    fetchDeploymentStatus();
    fetchDeploymentLogs();
    
    // Start polling interval
    pollingIntervalRef.current = setInterval(() => {
      if (isCompletedRef.current) {
        // Stop polling if deployment is completed
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        return;
      }
      
      fetchDeploymentStatus();
      fetchDeploymentLogs();
    }, pollingInterval);
  };
  
  useEffect(() => {
    if (!wsEnabled && pollingEnabled) {
      startPolling();
    }
    
    return () => {
      // Clean up interval on unmount
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [deploymentId, wsEnabled, pollingEnabled, pollingInterval]);
  
  // Expose refetch method to manually trigger a refresh
  const refetch = () => {
    fetchDeploymentStatus();
    fetchDeploymentLogs();
  };
  
  return { status, logs, refetch };
}; 