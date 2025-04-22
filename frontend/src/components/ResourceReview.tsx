import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  Card,
  CardContent,
  CardHeader,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { GridItem } from './common/GridItem';

interface ResourceReviewProps {
  resources: any[];
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

// Helper function to get region label
const getRegionLabel = (region: string): string => {
  const regions: Record<string, string> = {
    'eu-west-2': 'EU West (London)',
    'us-east-1': 'US East (N. Virginia)',
    'us-west-2': 'US West (Oregon)',
    'eu-west-1': 'EU (Ireland)'
  };
  
  return regions[region] || region;
};

// Helper function to get environment label
const getEnvironmentLabel = (env: string): string => {
  const environments: Record<string, string> = {
    'dev': 'Development',
    'test': 'Testing',
    'staging': 'Staging',
    'prod': 'Production'
  };
  
  return environments[env] || env;
};

// Helper function to get size label
const getSizeLabel = (size: string): string => {
  const sizes: Record<string, string> = {
    'small': 'Small (t2.micro / 1vCPU, 1GB RAM)',
    'medium': 'Medium (t2.small / 1vCPU, 2GB RAM)',
    'large': 'Large (t2.medium / 2vCPU, 4GB RAM)'
  };
  
  return sizes[size] || size;
};

// Helper function to get subnet label
const getSubnetLabel = (subnet: string): string => {
  const subnets: Record<string, string> = {
    'subnet-07759e500cfdfb6b2': 'eu-west-2a (Public)',
    'subnet-0d95a35be6e1fb603': 'eu-west-2b (Public)',
    'subnet-00e88d7e1a6b7c689': 'eu-west-2c (Private)'
  };
  
  return subnets[subnet] || subnet;
};

// Helper function to get dependency description
const getDependencyDescription = (sourceType: string, targetType: string): string => {
  const descriptions: Record<string, Record<string, string>> = {
    'ec2_instance': {
      'security_group': 'Attached to security group',
      'elastic_ip': 'Associated with Elastic IP'
    },
    'rds_instance': {
      'security_group': 'Attached to security group'
    },
    'load_balancer': {
      'security_group': 'Attached to security group',
      'ec2_instance': 'Targets EC2 instance',
      'ecs_service': 'Targets ECS service'
    },
    'ecs_service': {
      'load_balancer': 'Uses load balancer'
    },
    'security_group': {
      'ec2_instance': 'Allows traffic from/to EC2 instance',
      'rds_instance': 'Allows traffic from/to RDS instance',
      'load_balancer': 'Allows traffic from/to load balancer'
    },
    'elastic_ip': {
      'ec2_instance': 'Associated with EC2 instance'
    }
  };
  
  return descriptions[sourceType]?.[targetType] || 'Connected to';
};

// Render EC2 configuration summary
const renderEC2Summary = (configuration: any) => (
  <List dense>
    <ListItem>
      <ListItemText primary="Size" secondary={getSizeLabel(configuration.size)} />
    </ListItem>
    <ListItem>
      <ListItemText primary="Subnet" secondary={getSubnetLabel(configuration.subnet_id)} />
    </ListItem>
    <ListItem>
      <ListItemText 
        primary="Elastic IP" 
        secondary={configuration.assign_eip ? 'Yes' : 'No'} 
      />
    </ListItem>
    {configuration.user_data && (
      <ListItem>
        <ListItemText primary="User Data Script" secondary="Configured" />
      </ListItem>
    )}
  </List>
);

// Render S3 configuration summary
const renderS3Summary = (configuration: any) => (
  <List dense>
    <ListItem>
      <ListItemText 
        primary="Versioning" 
        secondary={configuration.versioning_enabled ? 'Enabled' : 'Disabled'} 
      />
    </ListItem>
    <ListItem>
      <ListItemText 
        primary="Public Access" 
        secondary={configuration.public_access ? 'Allowed' : 'Blocked'} 
      />
    </ListItem>
    <ListItem>
      <ListItemText 
        primary="Encryption" 
        secondary={configuration.encryption_enabled ? 'Enabled' : 'Disabled'} 
      />
    </ListItem>
    <ListItem>
      <ListItemText 
        primary="Static Website" 
        secondary={configuration.static_website ? 'Configured' : 'Not configured'} 
      />
    </ListItem>
  </List>
);

// Render RDS configuration summary
const renderRDSSummary = (configuration: any) => (
  <List dense>
    <ListItem>
      <ListItemText 
        primary="Database Engine" 
        secondary={configuration.engine} 
      />
    </ListItem>
    <ListItem>
      <ListItemText 
        primary="Instance Size" 
        secondary={getSizeLabel(configuration.size)} 
      />
    </ListItem>
    <ListItem>
      <ListItemText 
        primary="Database Name" 
        secondary={configuration.db_name} 
      />
    </ListItem>
    <ListItem>
      <ListItemText 
        primary="Multi-AZ Deployment" 
        secondary={configuration.multi_az ? 'Enabled' : 'Disabled'} 
      />
    </ListItem>
    <ListItem>
      <ListItemText 
        primary="Publicly Accessible" 
        secondary={configuration.publicly_accessible ? 'Yes' : 'No'} 
      />
    </ListItem>
  </List>
);

// Render Security Group configuration summary
const renderSecurityGroupSummary = (configuration: any) => (
  <Box>
    <Typography variant="subtitle2" gutterBottom>
      Description: {configuration.description}
    </Typography>
    
    <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
      Rules:
    </Typography>
    
    <List dense>
      {configuration.rules && configuration.rules.map((rule: any, index: number) => (
        <ListItem key={index}>
          <ListItemText 
            primary={`${rule.type === 'ingress' ? 'Inbound' : 'Outbound'} - ${rule.protocol.toUpperCase()} ${rule.port_range}`} 
            secondary={`Source: ${rule.source}`} 
          />
        </ListItem>
      ))}
    </List>
  </Box>
);

// Render Elastic IP configuration summary
const renderElasticIPSummary = (configuration: any) => (
  <List dense>
    <ListItem>
      <ListItemText 
        primary="Associate on Creation" 
        secondary={configuration.associate_on_creation ? 'Yes' : 'No'} 
      />
    </ListItem>
  </List>
);

// Render Load Balancer configuration summary
const renderLoadBalancerSummary = (configuration: any) => (
  <List dense>
    <ListItem>
      <ListItemText 
        primary="Scheme" 
        secondary={configuration.scheme === 'internet-facing' ? 'Internet-facing' : 'Internal'} 
      />
    </ListItem>
    <ListItem>
      <ListItemText 
        primary="Subnets" 
        secondary={
          configuration.subnets 
            ? configuration.subnets.map((subnet: string) => getSubnetLabel(subnet)).join(', ')
            : 'None selected'
        } 
      />
    </ListItem>
    <ListItem>
      <ListItemText 
        primary="HTTP Port" 
        secondary={configuration.http_port || 80} 
      />
    </ListItem>
    <ListItem>
      <ListItemText 
        primary="HTTPS Enabled" 
        secondary={configuration.https_enabled ? 'Yes' : 'No'} 
      />
    </ListItem>
    <ListItem>
      <ListItemText 
        primary="Deletion Protection" 
        secondary={configuration.enable_deletion_protection ? 'Enabled' : 'Disabled'} 
      />
    </ListItem>
  </List>
);

// Render ECS Service configuration summary
const renderECSSummary = (configuration: any) => (
  <List dense>
    <ListItem>
      <ListItemText 
        primary="Task Definition" 
        secondary={configuration.task_definition} 
      />
    </ListItem>
    <ListItem>
      <ListItemText 
        primary="Desired Count" 
        secondary={configuration.desired_count} 
      />
    </ListItem>
    <ListItem>
      <ListItemText 
        primary="Deployment Strategy" 
        secondary={
          configuration.deployment_strategy === 'rolling' 
            ? 'Rolling Update' 
            : 'Blue/Green Deployment'
        } 
      />
    </ListItem>
    <ListItem>
      <ListItemText 
        primary="Auto Scaling" 
        secondary={configuration.enable_auto_scaling ? 'Enabled' : 'Disabled'} 
      />
    </ListItem>
    <ListItem>
      <ListItemText 
        primary="Load Balancer Required" 
        secondary={configuration.requires_load_balancer ? 'Yes' : 'No'} 
      />
    </ListItem>
    {configuration.requires_load_balancer && (
      <>
        <ListItem>
          <ListItemText 
            primary="Container Port" 
            secondary={configuration.container_port} 
          />
        </ListItem>
        <ListItem>
          <ListItemText 
            primary="Health Check Path" 
            secondary={configuration.health_check_path} 
          />
        </ListItem>
      </>
    )}
  </List>
);

// Get configuration summary based on resource type
const getConfigurationSummary = (resourceType: string, configuration: any) => {
  switch (resourceType) {
    case 'ec2_instance':
      return renderEC2Summary(configuration);
    case 's3_bucket':
      return renderS3Summary(configuration);
    case 'rds_instance':
      return renderRDSSummary(configuration);
    case 'security_group':
      return renderSecurityGroupSummary(configuration);
    case 'elastic_ip':
      return renderElasticIPSummary(configuration);
    case 'load_balancer':
      return renderLoadBalancerSummary(configuration);
    case 'ecs_service':
      return renderECSSummary(configuration);
    default:
      return (
        <Typography color="textSecondary">
          No specific configuration for this resource type
        </Typography>
      );
  }
};

const ResourceReview: React.FC<ResourceReviewProps> = ({ resources }) => {
  return (
    <Box>
      <Alert severity="info" sx={{ mb: 3 }}>
        Review your infrastructure stack before submitting. This will provision all resources with their configurations and dependencies.
      </Alert>
      
      <Typography variant="h6" gutterBottom>
        Resources to be Provisioned ({resources.length})
      </Typography>
      
      {resources.map((resource, index) => {
        // Find resources that depend on this one
        const dependentResources = resources.filter(r => 
          r.dependencies && r.dependencies.includes(resource.id)
        );
        
        // Find resources that this one depends on
        const dependencies = resources.filter(r => 
          resource.dependencies && resource.dependencies.includes(r.id)
        );
        
        return (
          <Accordion key={resource.id} defaultExpanded={index === 0}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box display="flex" alignItems="center">
                <Typography variant="subtitle1">
                  {resource.name || `Resource ${index + 1}`}
                </Typography>
                <Chip 
                  label={getResourceTypeLabel(resource.resourceType)} 
                  size="small" 
                  sx={{ ml: 1 }}
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <GridItem xs={12} md={4}>
                  <Typography variant="subtitle2" gutterBottom>
                    Basic Information
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Name" secondary={resource.name} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Type" secondary={getResourceTypeLabel(resource.resourceType)} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Region" secondary={getRegionLabel(resource.region)} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Environment" secondary={getEnvironmentLabel(resource.environment)} />
                    </ListItem>
                  </List>
                </GridItem>
                
                <GridItem xs={12} md={4}>
                  <Typography variant="subtitle2" gutterBottom>
                    Configuration
                  </Typography>
                  {getConfigurationSummary(resource.resourceType, resource.configuration)}
                </GridItem>
                
                <GridItem xs={12} md={4}>
                  <Typography variant="subtitle2" gutterBottom>
                    Dependencies
                  </Typography>
                  
                  {dependencies.length > 0 ? (
                    <Box>
                      <Typography variant="body2" gutterBottom>
                        This resource depends on:
                      </Typography>
                      <List dense>
                        {dependencies.map(dep => (
                          <ListItem key={dep.id}>
                            <ListItemText 
                              primary={dep.name || `${getResourceTypeLabel(dep.resourceType)} ${resources.indexOf(dep) + 1}`} 
                              secondary={getDependencyDescription(resource.resourceType, dep.resourceType)} 
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="textSecondary">
                      No dependencies
                    </Typography>
                  )}
                  
                  {dependentResources.length > 0 && (
                    <Box mt={2}>
                      <Typography variant="body2" gutterBottom>
                        Resources that depend on this:
                      </Typography>
                      <List dense>
                        {dependentResources.map(dep => (
                          <ListItem key={dep.id}>
                            <ListItemText 
                              primary={dep.name || `${getResourceTypeLabel(dep.resourceType)} ${resources.indexOf(dep) + 1}`} 
                              secondary={getDependencyDescription(dep.resourceType, resource.resourceType)} 
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                </GridItem>
              </Grid>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Box>
  );
};

export default ResourceReview;
