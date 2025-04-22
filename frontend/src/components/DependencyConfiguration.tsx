import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select as MuiSelect,
  MenuItem,
  Chip,
  ListItemText,
  Checkbox,
  OutlinedInput,
  SelectChangeEvent,
  Divider,
  Alert,
  Card,
  CardHeader,
  CardContent,
  Tooltip,
  IconButton
} from '@mui/material';
import { Info as InfoIcon } from '@mui/icons-material';
import { GridItem } from './common/GridItem';

interface DependencyConfigurationProps {
  resources: any[];
  setFieldValue: (field: string, value: any) => void;
}

// Helper function to get resource type label
const getResourceTypeLabel = (type: string): string => {
  const resourceTypes: Record<string, string> = {
    'ec2_instance': 'EC2 Instance',
    's3_bucket': 'S3 Bucket',
    'rds_instance': 'RDS Database',
    'security_group': 'Security Group',
    'elastic_ip': 'Elastic IP',
    'load_balancer': 'Load Balancer',
    'ecs_service': 'ECS Service'
  };
  
  return resourceTypes[type] || type;
};

// Helper function to check if a dependency is valid
const isValidDependency = (sourceType: string, targetType: string): boolean => {
  // Define valid dependency relationships
  const validDependencies: Record<string, string[]> = {
    'ec2_instance': ['security_group', 'elastic_ip'],
    'rds_instance': ['security_group'],
    'load_balancer': ['security_group', 'ec2_instance', 'ecs_service'],
    'ecs_service': ['load_balancer'],
    'security_group': ['ec2_instance', 'rds_instance', 'load_balancer'],
    'elastic_ip': ['ec2_instance']
  };
  
  return validDependencies[sourceType]?.includes(targetType) || false;
};

// Helper function to get dependency description
const getDependencyDescription = (sourceType: string, targetType: string): string => {
  const descriptions: Record<string, Record<string, string>> = {
    'ec2_instance': {
      'security_group': 'Attach this security group to the EC2 instance',
      'elastic_ip': 'Associate this Elastic IP with the EC2 instance'
    },
    'rds_instance': {
      'security_group': 'Attach this security group to the RDS instance'
    },
    'load_balancer': {
      'security_group': 'Attach this security group to the load balancer',
      'ec2_instance': 'Register this EC2 instance as a target',
      'ecs_service': 'Register this ECS service as a target'
    },
    'ecs_service': {
      'load_balancer': 'Use this load balancer for the ECS service'
    },
    'security_group': {
      'ec2_instance': 'Allow traffic from/to this EC2 instance',
      'rds_instance': 'Allow traffic from/to this RDS instance',
      'load_balancer': 'Allow traffic from/to this load balancer'
    },
    'elastic_ip': {
      'ec2_instance': 'Associate with this EC2 instance'
    }
  };
  
  return descriptions[sourceType]?.[targetType] || 'Connect these resources';
};

const DependencyConfiguration: React.FC<DependencyConfigurationProps> = ({ 
  resources, 
  setFieldValue 
}) => {
  // Handle dependency selection
  const handleDependencyChange = (resourceIndex: number, selectedIds: string[]) => {
    setFieldValue(`resources.${resourceIndex}.dependencies`, selectedIds);
  };
  
  return (
    <Box>
      <Alert severity="info" sx={{ mb: 3 }}>
        Define how your resources relate to each other. For example, you can attach security groups to EC2 instances,
        associate Elastic IPs, or connect load balancers to ECS services.
      </Alert>
      
      {resources.map((resource, index) => {
        // Get potential dependencies for this resource type
        const potentialDependencies = resources.filter((dep, depIndex) => 
          depIndex !== index && isValidDependency(resource.resourceType, dep.resourceType)
        );
        
        // Skip if no valid dependencies are available
        if (potentialDependencies.length === 0) {
          return null;
        }
        
        // Current selected dependencies
        const selectedDependencies = resource.dependencies || [];
        
        return (
          <Card key={resource.id} sx={{ mb: 3 }}>
            <CardHeader
              title={
                <Box display="flex" alignItems="center">
                  <Typography variant="h6">
                    {resource.name || `${getResourceTypeLabel(resource.resourceType)} ${index + 1}`}
                  </Typography>
                  <Chip 
                    label={getResourceTypeLabel(resource.resourceType)} 
                    size="small" 
                    sx={{ ml: 1 }}
                  />
                </Box>
              }
            />
            <CardContent>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Configure dependencies for this {getResourceTypeLabel(resource.resourceType)}
              </Typography>
              
              <Grid container spacing={3}>
                {potentialDependencies.map((dep) => (
                  <GridItem xs={12} sm={6} md={4} key={dep.id}>
                    <Paper
                      elevation={2}
                      sx={{ 
                        p: 2, 
                        cursor: 'pointer',
                        border: selectedDependencies.includes(dep.id) ? '2px solid #3f51b5' : '1px solid #e0e0e0',
                        backgroundColor: selectedDependencies.includes(dep.id) ? 'rgba(63, 81, 181, 0.08)' : 'transparent'
                      }}
                      onClick={() => {
                        const newDeps = selectedDependencies.includes(dep.id)
                          ? selectedDependencies.filter((id: string) => id !== dep.id)
                          : [...selectedDependencies, dep.id];
                        handleDependencyChange(index, newDeps);
                      }}
                    >
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle1">
                          {dep.name || `${getResourceTypeLabel(dep.resourceType)} ${resources.indexOf(dep) + 1}`}
                        </Typography>
                        <Chip 
                          label={getResourceTypeLabel(dep.resourceType)} 
                          size="small"
                        />
                      </Box>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="body2" color="textSecondary">
                        {getDependencyDescription(resource.resourceType, dep.resourceType)}
                      </Typography>
                      <Box display="flex" justifyContent="flex-end" mt={1}>
                        <Checkbox
                          checked={selectedDependencies.includes(dep.id)}
                          color="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            const newDeps = selectedDependencies.includes(dep.id)
                              ? selectedDependencies.filter((id: string) => id !== dep.id)
                              : [...selectedDependencies, dep.id];
                            handleDependencyChange(index, newDeps);
                          }}
                        />
                      </Box>
                    </Paper>
                  </GridItem>
                ))}
              </Grid>
              
              {potentialDependencies.length === 0 && (
                <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                  No valid dependencies available for this resource type.
                </Typography>
              )}
            </CardContent>
          </Card>
        );
      })}
      
      {resources.every((resource, index) => {
        const potentialDependencies = resources.filter((dep, depIndex) => 
          depIndex !== index && isValidDependency(resource.resourceType, dep.resourceType)
        );
        return potentialDependencies.length === 0;
      }) && (
        <Alert severity="warning">
          No valid dependencies can be configured with the current resource selection. Try adding more varied resources
          such as EC2 instances and security groups to enable dependency configuration.
        </Alert>
      )}
    </Box>
  );
};

export default DependencyConfiguration;
