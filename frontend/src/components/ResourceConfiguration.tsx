import React from 'react';
import { Field } from 'formik';
import { 
  Grid, 
  MenuItem, 
  Typography,
  FormControlLabel,
  Divider,
  IconButton,
  Box,
  Tooltip,
  Paper
} from '@mui/material';
import { TextField, Select, CheckboxWithLabel } from 'formik-mui';
import { GridItem } from './common/GridItem';
import { 
  Add as AddIcon,
  Delete as DeleteIcon,
  Info as InfoIcon
} from '@mui/icons-material';

// Resource options
const sizes = [
  { value: 'small', label: 'Small (t2.micro / 1vCPU, 1GB RAM)' },
  { value: 'medium', label: 'Medium (t2.small / 1vCPU, 2GB RAM)' },
  { value: 'large', label: 'Large (t2.medium / 2vCPU, 4GB RAM)' },
];

// EC2 specific options
const subnets = [
  { value: 'subnet-07759e500cfdfb6b2', label: 'eu-west-2a (Public)' },
  { value: 'subnet-0d95a35be6e1fb603', label: 'eu-west-2b (Public)' },
  { value: 'subnet-00e88d7e1a6b7c689', label: 'eu-west-2c (Private)' },
];

// RDS specific options
const dbEngines = [
  { value: 'mysql', label: 'MySQL 8.0' },
  { value: 'postgres', label: 'PostgreSQL 13' },
  { value: 'aurora-mysql', label: 'Aurora MySQL' },
  { value: 'aurora-postgresql', label: 'Aurora PostgreSQL' },
];

// Security group protocols
const protocols = [
  { value: 'tcp', label: 'TCP' },
  { value: 'udp', label: 'UDP' },
  { value: 'icmp', label: 'ICMP' },
];

// Common ports
const commonPorts = [
  { value: '22', label: 'SSH (22)' },
  { value: '80', label: 'HTTP (80)' },
  { value: '443', label: 'HTTPS (443)' },
  { value: '3306', label: 'MySQL (3306)' },
  { value: '5432', label: 'PostgreSQL (5432)' },
  { value: '1433', label: 'MSSQL (1433)' },
  { value: 'custom', label: 'Custom Port' },
];

// ECS specific options
const deploymentStrategies = [
  { value: 'rolling', label: 'Rolling Update' },
  { value: 'blue-green', label: 'Blue/Green Deployment' },
];

// Load balancer schemes
const lbSchemes = [
  { value: 'internet-facing', label: 'Internet-facing' },
  { value: 'internal', label: 'Internal' },
];

interface ResourceConfigurationProps {
  resourceType: string;
  index: number;
  values: any;
  setFieldValue: (field: string, value: any) => void;
}

const ResourceConfiguration: React.FC<ResourceConfigurationProps> = ({ 
  resourceType, 
  index, 
  values,
  setFieldValue
}) => {
  // Base path for configuration fields
  const basePath = `resources.${index}.configuration`;
  
  // Render EC2 Instance configuration
  const renderEC2Configuration = () => (
    <Grid container spacing={3}>
      <GridItem xs={12} sm={6}>
        <Field
          component={Select}
          name={`${basePath}.size`}
          label="Instance Size"
          fullWidth
          variant="outlined"
        >
          {sizes.map(option => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Field>
      </GridItem>
      
      <GridItem xs={12} sm={6}>
        <Field
          component={Select}
          name={`${basePath}.subnet_id`}
          label="Subnet"
          fullWidth
          variant="outlined"
        >
          {subnets.map(option => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Field>
      </GridItem>
      
      <GridItem xs={12}>
        <Field
          component={CheckboxWithLabel}
          type="checkbox"
          name={`${basePath}.assign_eip`}
          Label={{ label: 'Assign Elastic IP' }}
        />
        <Tooltip title="Allocate and associate an Elastic IP address with this instance for static public IP addressing">
          <IconButton size="small">
            <InfoIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </GridItem>
      
      <GridItem xs={12}>
        <Field
          component={TextField}
          name={`${basePath}.user_data`}
          label="User Data Script (Optional)"
          fullWidth
          multiline
          rows={4}
          variant="outlined"
          placeholder="#!/bin/bash\n# Your initialization script here"
        />
      </GridItem>
    </Grid>
  );
  
  // Render S3 Bucket configuration
  const renderS3Configuration = () => (
    <Grid container spacing={3}>
      <GridItem xs={12}>
        <Field
          component={CheckboxWithLabel}
          type="checkbox"
          name={`${basePath}.versioning_enabled`}
          Label={{ label: 'Enable Versioning' }}
        />
        <Tooltip title="Keep multiple versions of objects in the bucket">
          <IconButton size="small">
            <InfoIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </GridItem>
      
      <GridItem xs={12}>
        <Field
          component={CheckboxWithLabel}
          type="checkbox"
          name={`${basePath}.public_access`}
          Label={{ label: 'Allow Public Access' }}
        />
        <Tooltip title="Allow objects to be publicly accessible (not recommended for sensitive data)">
          <IconButton size="small">
            <InfoIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </GridItem>
      
      <GridItem xs={12}>
        <Field
          component={CheckboxWithLabel}
          type="checkbox"
          name={`${basePath}.encryption_enabled`}
          Label={{ label: 'Enable Server-Side Encryption' }}
        />
      </GridItem>
      
      <GridItem xs={12}>
        <Field
          component={CheckboxWithLabel}
          type="checkbox"
          name={`${basePath}.static_website`}
          Label={{ label: 'Configure as Static Website' }}
        />
      </GridItem>
    </Grid>
  );
  
  // Render RDS Database configuration
  const renderRDSConfiguration = () => (
    <Grid container spacing={3}>
      <GridItem xs={12} sm={6}>
        <Field
          component={Select}
          name={`${basePath}.engine`}
          label="Database Engine"
          fullWidth
          variant="outlined"
        >
          {dbEngines.map(option => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Field>
      </GridItem>
      
      <GridItem xs={12} sm={6}>
        <Field
          component={Select}
          name={`${basePath}.size`}
          label="Instance Size"
          fullWidth
          variant="outlined"
        >
          {sizes.map(option => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Field>
      </GridItem>
      
      <GridItem xs={12} sm={6}>
        <Field
          component={TextField}
          name={`${basePath}.db_name`}
          label="Database Name"
          fullWidth
          variant="outlined"
        />
      </GridItem>
      
      <GridItem xs={12} sm={6}>
        <Field
          component={TextField}
          name={`${basePath}.master_username`}
          label="Master Username"
          fullWidth
          variant="outlined"
        />
      </GridItem>
      
      <GridItem xs={12}>
        <Field
          component={CheckboxWithLabel}
          type="checkbox"
          name={`${basePath}.multi_az`}
          Label={{ label: 'Enable Multi-AZ Deployment' }}
        />
        <Tooltip title="Provides high availability and failover support">
          <IconButton size="small">
            <InfoIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </GridItem>
      
      <GridItem xs={12}>
        <Field
          component={CheckboxWithLabel}
          type="checkbox"
          name={`${basePath}.publicly_accessible`}
          Label={{ label: 'Publicly Accessible' }}
        />
        <Tooltip title="Allow connections from outside the VPC (not recommended for production)">
          <IconButton size="small">
            <InfoIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </GridItem>
    </Grid>
  );
  
  // Render Security Group configuration
  const renderSecurityGroupConfiguration = () => {
    const rules = values.resources[index].configuration.rules || [];
    
    return (
      <Grid container spacing={3}>
        <GridItem xs={12}>
          <Field
            component={TextField}
            name={`${basePath}.description`}
            label="Security Group Description"
            fullWidth
            variant="outlined"
          />
        </GridItem>
        
        <GridItem xs={12}>
          <Typography variant="subtitle1" gutterBottom>
            Inbound Rules
          </Typography>
          
          {rules.map((rule: any, ruleIndex: number) => (
            <Paper key={ruleIndex} sx={{ p: 2, mb: 2 }}>
              <Grid container spacing={2}>
                <GridItem xs={12} sm={3}>
                  <Field
                    component={Select}
                    name={`${basePath}.rules.${ruleIndex}.type`}
                    label="Type"
                    fullWidth
                    variant="outlined"
                  >
                    <MenuItem value="ingress">Inbound</MenuItem>
                    <MenuItem value="egress">Outbound</MenuItem>
                  </Field>
                </GridItem>
                
                <GridItem xs={12} sm={3}>
                  <Field
                    component={Select}
                    name={`${basePath}.rules.${ruleIndex}.protocol`}
                    label="Protocol"
                    fullWidth
                    variant="outlined"
                  >
                    {protocols.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Field>
                </GridItem>
                
                <GridItem xs={12} sm={3}>
                  <Field
                    component={Select}
                    name={`${basePath}.rules.${ruleIndex}.port_range`}
                    label="Port"
                    fullWidth
                    variant="outlined"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const value = e.target.value;
                      setFieldValue(`${basePath}.rules.${ruleIndex}.port_range`, value);
                      if (value === 'custom') {
                        // Reset to empty for custom input
                        setTimeout(() => {
                          setFieldValue(`${basePath}.rules.${ruleIndex}.port_range`, '');
                        }, 0);
                      }
                    }}
                  >
                    {commonPorts.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Field>
                </GridItem>
                
                {rules[ruleIndex].port_range === 'custom' && (
                  <GridItem xs={12} sm={3}>
                    <Field
                      component={TextField}
                      name={`${basePath}.rules.${ruleIndex}.port_range`}
                      label="Custom Port Range"
                      fullWidth
                      variant="outlined"
                      placeholder="e.g., 8080 or 8000-9000"
                    />
                  </GridItem>
                )}
                
                <GridItem xs={12} sm={3}>
                  <Field
                    component={TextField}
                    name={`${basePath}.rules.${ruleIndex}.source`}
                    label="Source"
                    fullWidth
                    variant="outlined"
                    placeholder="0.0.0.0/0 or sg-xxx"
                  />
                </GridItem>
                
                <GridItem xs={12} display="flex" justifyContent="flex-end">
                  <IconButton 
                    color="error"
                    onClick={() => {
                      const newRules = [...rules];
                      newRules.splice(ruleIndex, 1);
                      setFieldValue(`${basePath}.rules`, newRules);
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </GridItem>
              </Grid>
            </Paper>
          ))}
          
          <Box display="flex" justifyContent="center" mt={2}>
            <Button
              startIcon={<AddIcon />}
              variant="outlined"
              onClick={() => {
                const newRule = {
                  type: 'ingress',
                  protocol: 'tcp',
                  port_range: '80',
                  source: '0.0.0.0/0'
                };
                setFieldValue(`${basePath}.rules`, [...rules, newRule]);
              }}
            >
              Add Rule
            </Button>
          </Box>
        </GridItem>
      </Grid>
    );
  };
  
  // Render Elastic IP configuration
  const renderElasticIPConfiguration = () => (
    <Grid container spacing={3}>
      <GridItem xs={12}>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          An Elastic IP is a static IPv4 address designed for dynamic cloud computing.
        </Typography>
      </GridItem>
      
      <GridItem xs={12}>
        <Field
          component={CheckboxWithLabel}
          type="checkbox"
          name={`${basePath}.associate_on_creation`}
          Label={{ label: 'Associate with EC2 on creation' }}
        />
      </GridItem>
    </Grid>
  );
  
  // Render Load Balancer configuration
  const renderLoadBalancerConfiguration = () => (
    <Grid container spacing={3}>
      <GridItem xs={12} sm={6}>
        <Field
          component={Select}
          name={`${basePath}.scheme`}
          label="Load Balancer Scheme"
          fullWidth
          variant="outlined"
        >
          {lbSchemes.map(option => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Field>
      </GridItem>
      
      <GridItem xs={12}>
        <Typography variant="subtitle1" gutterBottom>
          Subnets
        </Typography>
        
        {subnets.map(subnet => (
          <Field
            key={subnet.value}
            component={CheckboxWithLabel}
            type="checkbox"
            name={`${basePath}.subnets`}
            value={subnet.value}
            Label={{ label: subnet.label }}
          />
        ))}
      </GridItem>
      
      <GridItem xs={12}>
        <Typography variant="subtitle1" gutterBottom>
          Listeners
        </Typography>
        
        <Grid container spacing={2}>
          <GridItem xs={12} sm={6}>
            <Field
              component={TextField}
              name={`${basePath}.http_port`}
              label="HTTP Port"
              type="number"
              fullWidth
              variant="outlined"
              defaultValue={80}
            />
          </GridItem>
          
          <GridItem xs={12} sm={6}>
            <Field
              component={CheckboxWithLabel}
              type="checkbox"
              name={`${basePath}.https_enabled`}
              Label={{ label: 'Enable HTTPS (Port 443)' }}
            />
          </GridItem>
        </Grid>
      </GridItem>
      
      <GridItem xs={12}>
        <Field
          component={CheckboxWithLabel}
          type="checkbox"
          name={`${basePath}.enable_deletion_protection`}
          Label={{ label: 'Enable Deletion Protection' }}
        />
      </GridItem>
    </Grid>
  );
  
  // Render ECS Service configuration
  const renderECSConfiguration = () => (
    <Grid container spacing={3}>
      <GridItem xs={12} sm={6}>
        <Field
          component={TextField}
          name={`${basePath}.task_definition`}
          label="Task Definition"
          fullWidth
          variant="outlined"
          placeholder="e.g., my-app:1"
        />
      </GridItem>
      
      <GridItem xs={12} sm={6}>
        <Field
          component={TextField}
          name={`${basePath}.desired_count`}
          label="Desired Count"
          type="number"
          fullWidth
          variant="outlined"
        />
      </GridItem>
      
      <GridItem xs={12} sm={6}>
        <Field
          component={Select}
          name={`${basePath}.deployment_strategy`}
          label="Deployment Strategy"
          fullWidth
          variant="outlined"
        >
          {deploymentStrategies.map(option => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Field>
      </GridItem>
      
      <GridItem xs={12}>
        <Field
          component={CheckboxWithLabel}
          type="checkbox"
          name={`${basePath}.enable_auto_scaling`}
          Label={{ label: 'Enable Auto Scaling' }}
        />
      </GridItem>
      
      <GridItem xs={12}>
        <Field
          component={CheckboxWithLabel}
          type="checkbox"
          name={`${basePath}.requires_load_balancer`}
          Label={{ label: 'Requires Load Balancer' }}
        />
      </GridItem>
      
      {values.resources[index].configuration.requires_load_balancer && (
        <>
          <GridItem xs={12} sm={6}>
            <Field
              component={TextField}
              name={`${basePath}.container_port`}
              label="Container Port"
              type="number"
              fullWidth
              variant="outlined"
              defaultValue={80}
            />
          </GridItem>
          
          <GridItem xs={12} sm={6}>
            <Field
              component={TextField}
              name={`${basePath}.health_check_path`}
              label="Health Check Path"
              fullWidth
              variant="outlined"
              defaultValue="/"
            />
          </GridItem>
        </>
      )}
    </Grid>
  );
  
  // Render configuration based on resource type
  const renderConfiguration = () => {
    switch (resourceType) {
      case 'ec2_instance':
        return renderEC2Configuration();
      case 's3_bucket':
        return renderS3Configuration();
      case 'rds_instance':
        return renderRDSConfiguration();
      case 'security_group':
        return renderSecurityGroupConfiguration();
      case 'elastic_ip':
        return renderElasticIPConfiguration();
      case 'load_balancer':
        return renderLoadBalancerConfiguration();
      case 'ecs_service':
        return renderECSConfiguration();
      default:
        return (
          <Typography color="error">
            Configuration not available for this resource type
          </Typography>
        );
    }
  };
  
  return (
    <Box>
      {renderConfiguration()}
    </Box>
  );
};

// Helper Button component
const Button = ({ children, ...props }: any) => (
  <button
    type="button"
    className="MuiButtonBase-root MuiButton-root MuiButton-outlined"
    {...props}
  >
    {children}
  </button>
);

export default ResourceConfiguration;
