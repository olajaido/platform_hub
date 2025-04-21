import React, { useState, useEffect } from 'react';
import apiClient from '../api';
import { useParams } from 'react-router-dom';
import { 
  Container, 
  Paper, 
  Typography, 
  Box, 
  Chip, 
  Divider,
  CircularProgress,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { GridItem } from './../components/common/GridItem';
import Grid from '@mui/material/Grid';
import { 
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Pending as PendingIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import { useQuery } from 'react-query';

// Custom log display component
const LogConsole = ({ logs = [] }: { logs?: string[] }) => {
  return (
    <Box
      sx={{
        maxHeight: '400px',
        overflow: 'auto',
        p: 2,
        backgroundColor: '#000',
        color: '#fff',
        fontFamily: 'monospace',
        borderRadius: 1
      }}
    >
      {logs.length === 0 ? (
        <Typography variant="body2">Waiting for logs...</Typography>
      ) : (
        logs.map((log, index) => (
          <Typography key={index} variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
            {log}
          </Typography>
        ))
      )}
    </Box>
  );
};

// Status chip component
const StatusChip = ({ status }: { status: string }) => {
  let icon = <PendingIcon />;
  let color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' = 'default';
  
  switch (status) {
    case 'completed':
      icon = <CheckCircleIcon />;
      color = 'success';
      break;
    case 'failed':
      icon = <ErrorIcon />;
      color = 'error';
      break;
    case 'in_progress':
    case 'pending':
      icon = <AccessTimeIcon />;
      color = 'primary';
      break;
    default:
      icon = <PendingIcon />;
      color = 'default';
  }
  
  return (
    <Chip 
      icon={icon} 
      label={status.replace('_', ' ').toUpperCase()} 
      color={color}
      sx={{ textTransform: 'capitalize' }}
    />
  );
};

// Terraform outputs display component
const OutputsDisplay = ({ outputs }: { outputs: Record<string, any> | null }) => {
  if (!outputs || Object.keys(outputs).length === 0) {
    return (
      <Typography variant="body2">No outputs available yet.</Typography>
    );
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <List dense>
          {Object.entries(outputs).map(([key, value]) => (
            <ListItem key={key}>
              <ListItemText 
                primary={<Typography variant="subtitle2">{key}</Typography>}
                secondary={<Typography variant="body2">{typeof value === 'object' ? JSON.stringify(value) : value}</Typography>}
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

// Main component
const DeploymentStatus = () => {
  const { deploymentId } = useParams();
  const [logs, setLogs] = useState<string[]>([]);
  
  // Fetch deployment status with enhanced polling
  const { data: deploymentData, isLoading: statusLoading, error: statusError, refetch } = useQuery<any, Error>(
    ['deployment', deploymentId],
    async () => {
      const response = await apiClient.get(`/api/deployments/${deploymentId}/status`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      return response.data;
    },
    { 
      refetchInterval: (data) => {
        // Stop polling if deployment is completed or failed
        if (data?.status === 'completed' || data?.status === 'failed') {
          return false;
        }
        return 5000; // Poll every 5 seconds for in-progress deployments
      } 
    }
  );
  
  // Fetch deployment logs
  const { data: logsData, isLoading: logsLoading, error: logsError } = useQuery(
    ['logs', deploymentId],
    async () => {
      const response = await apiClient.get(`/api/deployments/${deploymentId}/logs`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      return response.data;
    },
    { refetchInterval: 3000 }
  );
  
  useEffect(() => {
    if (logsData && logsData.logs) {
      setLogs(logsData.logs);
    }

    // Set up automatic refresh for in-progress deployments
    const intervalId = setInterval(() => {
      if (deploymentData?.status === 'pending' || deploymentData?.status === 'in_progress') {
        refetch();
      }
    }, 5000);
    
    return () => clearInterval(intervalId);
  }, [logsData, deploymentData, refetch]);
  
  const isLoading = statusLoading || logsLoading;
  const error = statusError || logsError;
  
  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" color="error" gutterBottom>
            Error loading deployment details
          </Typography>
          <Typography variant="body1">
            {(error as any).response?.data?.detail || (error as Error).message}
          </Typography>
        </Paper>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Deployment Status
          </Typography>
          
          {isLoading ? (
            <CircularProgress size={24} />
          ) : (
            deploymentData && <StatusChip status={deploymentData.status} />
          )}
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <GridItem xs={12} md={6}>
                <Typography variant="subtitle1">Deployment ID:</Typography>
                <Typography variant="body1">{deploymentId}</Typography>
              </GridItem>
              
              {deploymentData && deploymentData.resource_type && (
                <GridItem xs={12} md={6}>
                  <Typography variant="subtitle1">Resource Type:</Typography>
                  <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                    {deploymentData.resource_type}
                  </Typography>
                </GridItem>
              )}
              
              {deploymentData && deploymentData.created_at && (
                <GridItem xs={12} md={6}>
                  <Typography variant="subtitle1">Created:</Typography>
                  <Typography variant="body1">
                    {new Date(deploymentData.created_at).toLocaleString()}
                  </Typography>
                </GridItem>
              )}
              
              {deploymentData && deploymentData.completed_at && (
                <GridItem xs={12} md={6}>
                  <Typography variant="subtitle1">Completed:</Typography>
                  <Typography variant="body1">
                    {new Date(deploymentData.completed_at).toLocaleString()}
                  </Typography>
                </GridItem>
              )}
            </Grid>
            
            {/* Terraform Outputs */}
            {deploymentData && deploymentData.outputs && Object.keys(deploymentData.outputs).length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Deployment Outputs
                </Typography>
                <OutputsDisplay outputs={deploymentData.outputs} />
              </Box>
            )}
            
            <Typography variant="h6" gutterBottom>
              Deployment Logs
            </Typography>
            
            <LogConsole logs={logs} />
          </>
        )}
      </Paper>
    </Container>
  );
};

export default DeploymentStatus;