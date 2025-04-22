import React from 'react';
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
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent
} from '@mui/lab';
import { GridItem } from './../components/common/GridItem';
import Grid from '@mui/material/Grid';
import { 
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Pending as PendingIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import { useQuery } from 'react-query';

// Status chip component (reused from DeploymentStatus)
const StatusChip = ({ status }: { status: string }) => {
  let color: "success" | "error" | "warning" | "default" = "default";
  let icon = <PendingIcon />;
  
  switch (status) {
    case 'completed':
      color = 'success';
      icon = <CheckCircleIcon />;
      break;
    case 'failed':
      color = 'error';
      icon = <ErrorIcon />;
      break;
    case 'in_progress':
      color = 'warning';
      icon = <AccessTimeIcon />;
      break;
    case 'pending':
    default:
      color = 'default';
      icon = <PendingIcon />;
  }
  
  return (
    <Chip 
      icon={icon}
      label={status.replace('_', ' ')}
      color={color}
      variant="outlined"
      sx={{ textTransform: 'capitalize' }}
    />
  );
};

// Resource dependency visualization
const ResourceDependencyTimeline = ({ resources }: { resources: any[] }) => {
  // Create a map of resource IDs to their dependencies (used for visualization)
  resources.reduce((map, resource) => {
    map[resource.id] = resource.dependencies || [];
    return map;
  }, {} as Record<string, string[]>);
  
  // Create a map of resource IDs to their details
  const resourceMap = resources.reduce((map, resource) => {
    map[resource.id] = resource;
    return map;
  }, {} as Record<string, any>);
  
  // Sort resources by dependencies
  const sortedResources = [...resources].sort((a, b) => {
    // If A depends on B, B should come first
    if ((a.dependencies || []).includes(b.id)) return 1;
    // If B depends on A, A should come first
    if ((b.dependencies || []).includes(a.id)) return -1;
    // Otherwise, sort by name
    return a.name.localeCompare(b.name);
  });
  
  return (
    <Timeline position="alternate">
      {sortedResources.map((resource, index) => (
        <TimelineItem key={resource.id}>
          <TimelineOppositeContent color="text.secondary">
            {resource.resource_type}
          </TimelineOppositeContent>
          <TimelineSeparator>
            <TimelineDot color={
              resource.status === 'completed' ? 'success' :
              resource.status === 'failed' ? 'error' :
              resource.status === 'in_progress' ? 'primary' : 'grey'
            }>
              {resource.status === 'completed' ? <CheckCircleIcon /> :
               resource.status === 'failed' ? <ErrorIcon /> :
               resource.status === 'in_progress' ? <AccessTimeIcon /> : <PendingIcon />}
            </TimelineDot>
            {index < sortedResources.length - 1 && <TimelineConnector />}
          </TimelineSeparator>
          <TimelineContent>
            <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" component="span">
                {resource.name}
              </Typography>
              <Typography>Status: <StatusChip status={resource.status || 'pending'} /></Typography>
              {resource.dependencies && resource.dependencies.length > 0 && (
                <Box mt={1}>
                  <Typography variant="body2">Dependencies:</Typography>
                  <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
                    {resource.dependencies.map((depId: string) => (
                      <Chip 
                        key={depId}
                        size="small"
                        label={resourceMap[depId]?.name || depId}
                        color={
                          resourceMap[depId]?.status === 'completed' ? 'success' :
                          resourceMap[depId]?.status === 'failed' ? 'error' : 'default'
                        }
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Paper>
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  );
};

// Outputs display component (reused from DeploymentStatus)
const OutputsDisplay = ({ outputs }: { outputs: Record<string, any> | null }) => {
  if (!outputs || Object.keys(outputs).length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No outputs available yet
      </Typography>
    );
  }
  
  return (
    <List dense>
      {Object.entries(outputs).map(([key, value]) => (
        <ListItem key={key}>
          <ListItemText 
            primary={key} 
            secondary={typeof value === 'object' ? JSON.stringify(value) : String(value)}
          />
        </ListItem>
      ))}
    </List>
  );
};

// Main component
const StackDeploymentStatus = () => {
  const { stackId } = useParams();
  
  // Fetch stack deployment status with polling
  const { data: stackData, isLoading, error, refetch } = useQuery<any, Error>(
    ['stack', stackId],
    async () => {
      const response = await apiClient.get(`/api/stacks/${stackId}/status`, {
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
  
  // Set up automatic refresh for in-progress deployments
  React.useEffect(() => {
    const intervalId = setInterval(() => {
      if (stackData?.status === 'pending' || stackData?.status === 'in_progress') {
        refetch();
      }
    }, 5000);
    
    return () => clearInterval(intervalId);
  }, [stackData, refetch]);
  
  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" color="error" gutterBottom>
            Error Loading Stack Deployment
          </Typography>
          <Typography>{error.message}</Typography>
        </Paper>
      </Container>
    );
  }
  
  if (!stackData) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Stack Deployment Not Found
          </Typography>
          <Typography>The requested stack deployment could not be found.</Typography>
        </Paper>
      </Container>
    );
  }
  
  const { stack_id, status, created_at, completed_at, outputs, resources } = stackData;
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Stack Deployment Status
        </Typography>
        
        <Grid container spacing={3}>
          <GridItem xs={12} md={6}>
            <Typography variant="subtitle1">Stack ID</Typography>
            <Typography variant="body1" gutterBottom>{stack_id}</Typography>
          </GridItem>
          
          <GridItem xs={12} md={6}>
            <Typography variant="subtitle1">Status</Typography>
            <StatusChip status={status} />
          </GridItem>
          
          <GridItem xs={12} md={6}>
            <Typography variant="subtitle1">Created</Typography>
            <Typography variant="body1" gutterBottom>
              {created_at ? new Date(created_at).toLocaleString() : 'N/A'}
            </Typography>
          </GridItem>
          
          <GridItem xs={12} md={6}>
            <Typography variant="subtitle1">Completed</Typography>
            <Typography variant="body1" gutterBottom>
              {completed_at ? new Date(completed_at).toLocaleString() : 'In progress...'}
            </Typography>
          </GridItem>
        </Grid>
        
        <Divider sx={{ my: 3 }} />
        
        <Typography variant="h5" gutterBottom>
          Resources
        </Typography>
        
        {resources && resources.length > 0 ? (
          <Box mt={3}>
            <ResourceDependencyTimeline resources={resources} />
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No resources found in this stack
          </Typography>
        )}
        
        <Divider sx={{ my: 3 }} />
        
        <Typography variant="h5" gutterBottom>
          Stack Outputs
        </Typography>
        
        <Card variant="outlined" sx={{ mt: 2 }}>
          <CardContent>
            <OutputsDisplay outputs={outputs} />
          </CardContent>
        </Card>
      </Paper>
    </Container>
  );
};

export default StackDeploymentStatus;
