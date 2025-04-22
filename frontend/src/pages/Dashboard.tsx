import React, { useEffect, useState } from 'react';
import { Container, Typography, Paper, Button, Box, Chip, ButtonGroup, Alert, IconButton } from '@mui/material';
import { Link } from 'react-router-dom';
import { Grid } from '../components/common/GridWrapper';
import { GridItem } from '../components/common/GridItem';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import apiClient from '../api';

// Define type for deployments
interface Deployment {
  id: string;
  resource_type: string;
  status: string;
  created_at: string;
  completed_at?: string;
  region: string;
  name?: string;
  parameters: {
    name: string;
    environment: string;
  };
}

// Type-safe status color mapping
const statusColors: Record<string, "success" | "error" | "warning" | "info" | "default"> = {
  completed: 'success',
  failed: 'error',
  pending: 'warning',
  in_progress: 'info'
};

const Dashboard: React.FC = () => {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');

  const fetchDeployments = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const response = await apiClient.get('/api/deployments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setDeployments(response.data.deployments);
    } catch (error: any) {
      console.error('Failed to fetch deployments:', error);
      setError(error.response?.data?.detail || 'Failed to load deployments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeployments();
  }, []);

  const handleRefresh = () => {
    fetchDeployments();
  };

  // Filter deployments by type
  const filteredDeployments = deployments.filter(deployment => {
    if (filter === 'all') return true;
    return deployment.resource_type === filter;
  });

  // Count resources by type
  const ec2Count = deployments.filter(d => d.resource_type === 'ec2_instance').length;
  const s3Count = deployments.filter(d => d.resource_type === 's3_bucket').length;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Infrastructure Dashboard
        </Typography>
        <IconButton onClick={handleRefresh} disabled={loading}>
          <RefreshIcon />
        </IconButton>
      </Box>
      
      <Grid container spacing={3}>
        <GridItem xs={12} md={6}>
          <Paper
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              height: 240
            }}
          >
            <Typography variant="h5" component="h2" gutterBottom>
              Quick Actions
            </Typography>
            <Box sx={{ flexGrow: 1 }}>
              <Button
                variant="contained"
                component={Link}
                to="/request"
                sx={{ mr: 2 }}
              >
                Request New Resource
              </Button>
            </Box>
          </Paper>
        </GridItem>
        
        <GridItem xs={12} md={6}>
          <Paper
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              height: 240
            }}
          >
            <Typography variant="h5" component="h2" gutterBottom>
              Resource Summary
            </Typography>
            {loading ? (
              <Typography>Loading...</Typography>
            ) : (
              <>
                <Typography variant="body1">
                  {deployments.length} deployments total
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    EC2 Instances: {ec2Count}
                  </Typography>
                  <Typography variant="body2">
                    S3 Buckets: {s3Count}
                  </Typography>
                </Box>
              </>
            )}
          </Paper>
        </GridItem>
        
        <GridItem xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" component="h2" gutterBottom>
                Recent Deployments
              </Typography>
              
              <ButtonGroup variant="outlined" size="small">
                <Button 
                  variant={filter === 'all' ? 'contained' : 'outlined'}
                  onClick={() => setFilter('all')}
                >
                  All
                </Button>
                <Button 
                  variant={filter === 'ec2_instance' ? 'contained' : 'outlined'}
                  onClick={() => setFilter('ec2_instance')}
                >
                  EC2
                </Button>
                <Button 
                  variant={filter === 's3_bucket' ? 'contained' : 'outlined'}
                  onClick={() => setFilter('s3_bucket')}
                >
                  S3
                </Button>
              </ButtonGroup>
            </Box>
            
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            {loading ? (
              <Typography>Loading deployments...</Typography>
            ) : filteredDeployments.length === 0 ? (
              <Typography>No deployments found.</Typography>
            ) : (
              <Box sx={{ mt: 2 }}>
                {filteredDeployments.map((deployment) => (
                  <Paper 
                    key={deployment.id}
                    sx={{ 
                      p: 2, 
                      mb: 2, 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                    elevation={1}
                  >
                    <Box>
                      <Typography variant="subtitle1">
                        {deployment.name || deployment.parameters?.name || deployment.id} 
                        <span style={{ color: '#666', marginLeft: '8px' }}>
                          ({deployment.resource_type})
                        </span>
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Created: {new Date(deployment.created_at).toLocaleString()}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Chip 
                        label={deployment.status} 
                        color={statusColors[deployment.status] || 'default'}
                        size="small"
                        sx={{ mr: 2, textTransform: 'capitalize' }}
                      />
                      <Button 
                        variant="outlined" 
                        size="small"
                        component={Link}
                        to={`/deployments/${deployment.id}`}
                      >
                        Details
                      </Button>
                    </Box>
                  </Paper>
                ))}
              </Box>
            )}
          </Paper>
        </GridItem>
      </Grid>
    </Container>
  );
};

export default Dashboard;