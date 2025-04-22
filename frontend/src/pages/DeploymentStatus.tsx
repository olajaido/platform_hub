import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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
  ListItemText,
  Button,
  Alert,
  IconButton,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import { Grid } from '../components/common/GridWrapper';
import { GridItem } from '../components/common/GridItem';
import { 
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Pending as PendingIcon,
  AccessTime as AccessTimeIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useDeploymentStatus } from '../hooks/useDeploymentStatus';

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

// Component to display Terraform outputs
const OutputsDisplay = ({ outputs }: { outputs: Record<string, any> }) => {
  if (!outputs || Object.keys(outputs).length === 0) {
    return <Typography>No outputs available</Typography>;
  }
  
  return (
    <Card variant="outlined">
      <CardContent>
        <List dense>
          {Object.entries(outputs).map(([key, value]) => (
            <ListItem key={key}>
              <ListItemText 
                primary={key} 
                secondary={String(value)}
                primaryTypographyProps={{ fontWeight: 'bold' }}
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
  const { deploymentId } = useParams<{deploymentId: string}>();
  const navigate = useNavigate();
  
  // Use our custom hook with WebSocket support
  const { status, logs, refetch } = useDeploymentStatus({
    deploymentId: deploymentId || '',
    wsEnabled: true,
    pollingEnabled: true
  });
  
  const isLoading = status?.isLoading || !status;
  const error = status?.error;
  
  const handleRefresh = () => {
    refetch();
  };
  
  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };
  
  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" color="error" gutterBottom>
            Error loading deployment details
          </Typography>
          <Typography variant="body1">
            {error.message}
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            sx={{ mt: 2 }}
            onClick={handleBackToDashboard}
          >
            Back to Dashboard
          </Button>
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
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {isLoading ? (
              <CircularProgress size={24} sx={{ mr: 1 }} />
            ) : (
              status && <StatusChip status={status.status} />
            )}
            
            <IconButton 
              onClick={handleRefresh} 
              sx={{ ml: 1 }}
              aria-label="Refresh"
            >
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        {isLoading && !status ? (
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
              
              {status && status.resource_type && (
                <GridItem xs={12} md={6}>
                  <Typography variant="subtitle1">Resource Type:</Typography>
                  <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                    {status.resource_type}
                  </Typography>
                </GridItem>
              )}
              
              {status && status.name && (
                <GridItem xs={12} md={6}>
                  <Typography variant="subtitle1">Name:</Typography>
                  <Typography variant="body1">
                    {status.name}
                  </Typography>
                </GridItem>
              )}
              
              {status && status.environment && (
                <GridItem xs={12} md={6}>
                  <Typography variant="subtitle1">Environment:</Typography>
                  <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                    {status.environment}
                  </Typography>
                </GridItem>
              )}
              
              {status && status.region && (
                <GridItem xs={12} md={6}>
                  <Typography variant="subtitle1">Region:</Typography>
                  <Typography variant="body1">
                    {status.region}
                  </Typography>
                </GridItem>
              )}
              
              {status && status.created_at && (
                <GridItem xs={12} md={6}>
                  <Typography variant="subtitle1">Created:</Typography>
                  <Typography variant="body1">
                    {new Date(status.created_at).toLocaleString()}
                  </Typography>
                </GridItem>
              )}
              
              {status && status.completed_at && (
                <GridItem xs={12} md={6}>
                  <Typography variant="subtitle1">Completed:</Typography>
                  <Typography variant="body1">
                    {new Date(status.completed_at).toLocaleString()}
                  </Typography>
                </GridItem>
              )}
              
              {status && status.error_message && (
                <GridItem xs={12}>
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {status.error_message}
                  </Alert>
                </GridItem>
              )}
            </Grid>
            
            {/* Deployment Progress Stepper */}
            {status && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Deployment Progress
                </Typography>
                <Stepper activeStep={getStepNumber(status.status)} sx={{ my: 3 }}>
                  <Step completed={status.status !== 'pending'}>
                    <StepLabel>Initiated</StepLabel>
                  </Step>
                  <Step completed={status.status === 'in_progress' || status.status === 'completed'}>
                    <StepLabel>In Progress</StepLabel>
                  </Step>
                  <Step completed={status.status === 'completed'}>
                    <StepLabel>Completed</StepLabel>
                  </Step>
                </Stepper>
              </Box>
            )}
            
            {/* Terraform Outputs */}
            {status && status.outputs && Object.keys(status.outputs).length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Deployment Outputs
                </Typography>
                <OutputsDisplay outputs={status.outputs} />
              </Box>
            )}
            
            <Typography variant="h6" gutterBottom>
              Deployment Logs
            </Typography>
            
            <LogConsole logs={logs} />
            
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                variant="outlined" 
                onClick={handleBackToDashboard}
              >
                Back to Dashboard
              </Button>
            </Box>
          </>
        )}
      </Paper>
    </Container>
  );
};

// Helper function to determine step number
const getStepNumber = (status: string): number => {
  switch (status) {
    case 'pending':
      return 0;
    case 'in_progress':
      return 1;
    case 'completed':
      return 2;
    case 'failed':
      return 1; // Failed stays at the "In Progress" step
    default:
      return 0;
  }
};

export default DeploymentStatus;