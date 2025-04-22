import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form, Field, FieldArray } from 'formik';
import * as Yup from 'yup';
import apiClient from '../api';
import { GridItem } from './common/GridItem';
import { 
  Container, 
  Paper, 
  Typography, 
  Grid, 
  MenuItem,
  Button, 
  Box,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Divider,
  Chip,
  FormControlLabel,
  Checkbox,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip
} from '@mui/material';
import { TextField, Select, CheckboxWithLabel } from 'formik-mui';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon
} from '@mui/icons-material';

// Resource type definitions
const resourceTypes = [
  { value: 'ec2_instance', label: 'EC2 Instance' },
  { value: 's3_bucket', label: 'S3 Bucket' },
  { value: 'rds_instance', label: 'RDS Database' },
  { value: 'security_group', label: 'Security Group' },
  { value: 'elastic_ip', label: 'Elastic IP' },
  { value: 'load_balancer', label: 'Application Load Balancer' },
  { value: 'ecs_service', label: 'ECS Service' }
];

// Common options
const sizes = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
];

const regions = [
  { value: 'eu-west-2', label: 'EU West (London)' },
  { value: 'us-east-1', label: 'US East (N. Virginia)' },
  { value: 'us-west-2', label: 'US West (Oregon)' },
  { value: 'eu-west-1', label: 'EU (Ireland)' },
];

const environments = [
  { value: 'dev', label: 'Development' },
  { value: 'test', label: 'Testing' },
  { value: 'staging', label: 'Staging' },
  { value: 'prod', label: 'Production' },
];

// EC2 specific options
const subnets = [
  { value: 'subnet-07759e500cfdfb6b2', label: 'eu-west-2a' },
  { value: 'subnet-0d95a35be6e1fb603', label: 'eu-west-2b' },
  { value: 'subnet-00e88d7e1a6b7c689', label: 'eu-west-2c' },
];

// RDS specific options
const dbEngines = [
  { value: 'mysql', label: 'MySQL' },
  { value: 'postgres', label: 'PostgreSQL' },
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

// Steps for the stepper
const steps = ['Resource Selection', 'Configuration', 'Dependencies', 'Review'];

// Initial empty resource
const emptyResource = {
  id: '',
  resourceType: '',
  name: '',
  region: 'eu-west-2',
  environment: 'dev',
  configuration: {}
};

// Function to generate a unique ID
const generateId = () => `resource-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

// Validation schemas for different resource types
const resourceValidationSchemas = {
  ec2_instance: Yup.object().shape({
    name: Yup.string().required('Name is required'),
    size: Yup.string().required('Size is required'),
    subnet_id: Yup.string().required('Subnet is required'),
    assign_eip: Yup.boolean(),
    security_groups: Yup.array().of(Yup.string())
  }),
  s3_bucket: Yup.object().shape({
    name: Yup.string().required('Bucket name is required'),
    versioning_enabled: Yup.boolean(),
    public_access: Yup.boolean()
  }),
  rds_instance: Yup.object().shape({
    name: Yup.string().required('Database name is required'),
    engine: Yup.string().required('Database engine is required'),
    size: Yup.string().required('Instance size is required'),
    multi_az: Yup.boolean(),
    security_groups: Yup.array().of(Yup.string())
  }),
  security_group: Yup.object().shape({
    name: Yup.string().required('Security group name is required'),
    description: Yup.string().required('Description is required'),
    rules: Yup.array().of(
      Yup.object().shape({
        type: Yup.string().required('Rule type is required'),
        protocol: Yup.string().required('Protocol is required'),
        port_range: Yup.string().test(
          'conditional-required',
          'Port range is required for non-ICMP protocols',
          function(value) {
            // Skip validation if protocol is ICMP
            if (this.parent.protocol === 'icmp') return true;
            // Otherwise require a value
            return !!value;
          }
        ),
        source: Yup.string().required('Source is required')
      })
    )
  }),
  elastic_ip: Yup.object().shape({
    name: Yup.string().required('Name is required'),
    associate_with: Yup.string()
  }),
  load_balancer: Yup.object().shape({
    name: Yup.string().required('Name is required'),
    scheme: Yup.string().required('Scheme is required'),
    security_groups: Yup.array().of(Yup.string()),
    subnets: Yup.array().of(Yup.string()).min(2, 'At least 2 subnets are required')
  }),
  ecs_service: Yup.object().shape({
    name: Yup.string().required('Service name is required'),
    task_definition: Yup.string().required('Task definition is required'),
    desired_count: Yup.number().required('Desired count is required').min(1),
    deployment_strategy: Yup.string().required('Deployment strategy is required'),
    load_balancer: Yup.string()
  })
};

// Main validation schema
const ResourceSchema = Yup.object().shape({
  resources: Yup.array().of(
    Yup.object().shape({
      id: Yup.string().required(),
      resourceType: Yup.string().required('Resource type is required'),
      name: Yup.string().required('Name is required'),
      region: Yup.string().required('Region is required'),
      environment: Yup.string().required('Environment is required'),
      configuration: Yup.object()
    })
  ).min(1, 'At least one resource is required')
});

// Function to get configuration schema based on resource type
const getConfigSchema = (resourceType: string) => {
  return resourceValidationSchemas[resourceType as keyof typeof resourceValidationSchemas] || Yup.object();
};

// Main component
const EnhancedResourceRequestForm: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Handle step navigation
  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  // Get default configuration based on resource type
  const getDefaultConfiguration = (resourceType: string) => {
    switch (resourceType) {
      case 'ec2_instance':
        return {
          size: 'medium',
          subnet_id: 'subnet-07759e500cfdfb6b2',
          assign_eip: false,
          security_groups: []
        };
      case 's3_bucket':
        return {
          versioning_enabled: false,
          public_access: false
        };
      case 'rds_instance':
        return {
          engine: 'mysql',
          size: 'medium',
          multi_az: false,
          security_groups: []
        };
      case 'security_group':
        return {
          description: '',
          rules: [
            {
              type: 'ingress',
              protocol: 'tcp',
              port_range: '22',
              source: '0.0.0.0/0'
            }
          ]
        };
      case 'elastic_ip':
        return {
          associate_with: ''
        };
      case 'load_balancer':
        return {
          scheme: 'internet-facing',
          security_groups: [],
          subnets: ['subnet-07759e500cfdfb6b2', 'subnet-0d95a35be6e1fb603']
        };
      case 'ecs_service':
        return {
          task_definition: '',
          desired_count: 1,
          deployment_strategy: 'rolling',
          load_balancer: ''
        };
      default:
        return {};
    }
  };

  // Handle form submission
  const handleSubmit = async (values: any, { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }) => {
    setLoading(true);
    setError(null);
    
    try {
      // Format the request for the enhanced endpoint
      const request = {
        resources: values.resources.map((resource: any) => ({
          resource_type: resource.resourceType,
          name: resource.name,
          environment: resource.environment,
          region: resource.region,
          parameters: resource.configuration,
          dependencies: resource.dependencies || []
        }))
      };
   
      // Send to backend
      const response = await apiClient.post('/api/deployments/create-stack', request, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Navigate to the deployment status page
      navigate(`/deployments/${response.data.request_id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit resource request');
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Request Infrastructure Resources
        </Typography>
        
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Formik
          initialValues={{
            resources: [
              {
                id: generateId(),
                resourceType: 'ec2_instance',
                name: '',
                region: 'eu-west-2',
                environment: 'dev',
                configuration: getDefaultConfiguration('ec2_instance'),
                dependencies: []
              }
            ]
          }}
          validationSchema={ResourceSchema}
          onSubmit={handleSubmit}
        >
          {({ values, isValid, dirty, setFieldValue }) => (
            <Form>
              {/* Step 1: Resource Selection */}
              {activeStep === 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Select Resources to Provision
                  </Typography>
                  
                  <FieldArray name="resources">
                    {({ push, remove }) => (
                      <Box>
                        {values.resources.map((resource, index) => (
                          <Card key={resource.id} sx={{ mb: 3 }}>
                            <CardHeader
                              title={`Resource ${index + 1}`}
                              action={
                                values.resources.length > 1 && (
                                  <IconButton onClick={() => remove(index)}>
                                    <DeleteIcon />
                                  </IconButton>
                                )
                              }
                            />
                            <CardContent>
                              <Grid container spacing={3}>
                                <GridItem xs={12}>
                                  <Field
                                    component={Select}
                                    name={`resources.${index}.resourceType`}
                                    label="Resource Type"
                                    fullWidth
                                    variant="outlined"
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                      const newType = e.target.value;
                                      setFieldValue(`resources.${index}.resourceType`, newType);
                                      setFieldValue(
                                        `resources.${index}.configuration`, 
                                        getDefaultConfiguration(newType)
                                      );
                                    }}
                                  >
                                    {resourceTypes.map(option => (
                                      <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                      </MenuItem>
                                    ))}
                                  </Field>
                                </GridItem>
                                
                                <GridItem xs={12} sm={6}>
                                  <Field
                                    component={TextField}
                                    name={`resources.${index}.name`}
                                    label="Resource Name"
                                    fullWidth
                                    variant="outlined"
                                  />
                                </GridItem>
                                
                                <GridItem xs={12} sm={6}>
                                  <Field
                                    component={Select}
                                    name={`resources.${index}.environment`}
                                    label="Environment"
                                    fullWidth
                                    variant="outlined"
                                  >
                                    {environments.map(option => (
                                      <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                      </MenuItem>
                                    ))}
                                  </Field>
                                </GridItem>
                                
                                <GridItem xs={12}>
                                  <Field
                                    component={Select}
                                    name={`resources.${index}.region`}
                                    label="Region"
                                    fullWidth
                                    variant="outlined"
                                  >
                                    {regions.map(option => (
                                      <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                      </MenuItem>
                                    ))}
                                  </Field>
                                </GridItem>
                              </Grid>
                            </CardContent>
                          </Card>
                        ))}
                        
                        <Button
                          startIcon={<AddIcon />}
                          variant="outlined"
                          onClick={() => {
                            const newResource = {
                              ...emptyResource,
                              id: generateId(),
                              resourceType: 'ec2_instance',
                              configuration: getDefaultConfiguration('ec2_instance')
                            };
                            push(newResource);
                          }}
                        >
                          Add Resource
                        </Button>
                      </Box>
                    )}
                  </FieldArray>
                </Box>
              )}
              
              {/* Step 2: Resource Configuration */}
              {activeStep === 1 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Configure Resources
                  </Typography>
                  
                  {values.resources.map((resource, index) => (
                    <Accordion key={resource.id} defaultExpanded={index === 0}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography>
                          {resource.name || `${resourceTypes.find(r => r.value === resource.resourceType)?.label || 'Resource'} ${index + 1}`}
                        </Typography>
                        <Chip 
                          label={resourceTypes.find(r => r.value === resource.resourceType)?.label} 
                          size="small" 
                          sx={{ ml: 1 }}
                        />
                      </AccordionSummary>
                      <AccordionDetails>
                        <ResourceConfiguration 
                          resourceType={resource.resourceType} 
                          index={index} 
                          values={values}
                          setFieldValue={setFieldValue}
                        />
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
              )}
              
              {/* Step 3: Resource Dependencies */}
              {activeStep === 2 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Configure Dependencies
                  </Typography>
                  
                  <Alert severity="info" sx={{ mb: 3 }}>
                    Define how your resources relate to each other. For example, connect EC2 instances to security groups or associate Elastic IPs.
                  </Alert>
                  
                  <DependencyConfiguration 
                    resources={values.resources}
                    setFieldValue={setFieldValue}
                  />
                </Box>
              )}
              
              {/* Step 4: Review */}
              {activeStep === 3 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Review Your Infrastructure Stack
                  </Typography>
                  
                  <ResourceReview resources={values.resources} />
                </Box>
              )}
              
              {/* Navigation Buttons */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                <Button
                  disabled={activeStep === 0}
                  onClick={handleBack}
                  variant="outlined"
                >
                  Back
                </Button>
                
                <Box>
                  {activeStep === steps.length - 1 ? (
                    <Button
                      variant="contained"
                      color="primary"
                      type="submit"
                      disabled={!isValid || loading}
                      startIcon={loading && <CircularProgress size={20} />}
                    >
                      {loading ? 'Submitting...' : 'Submit Request'}
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      disabled={!isValid}
                    >
                      Next
                    </Button>
                  )}
                </Box>
              </Box>
            </Form>
          )}
        </Formik>
      </Paper>
    </Container>
  );
};

// Placeholder components to be implemented
const ResourceConfiguration: React.FC<{
  resourceType: string;
  index: number;
  values: any;
  setFieldValue: (field: string, value: any) => void;
}> = ({ resourceType, index, values, setFieldValue }) => {
  // This will be implemented in the next step
  return (
    <Typography>Configuration for {resourceType} will be implemented</Typography>
  );
};

const DependencyConfiguration: React.FC<{
  resources: any[];
  setFieldValue: (field: string, value: any) => void;
}> = ({ resources, setFieldValue }) => {
  // This will be implemented in the next step
  return (
    <Typography>Dependency configuration will be implemented</Typography>
  );
};

const ResourceReview: React.FC<{
  resources: any[];
}> = ({ resources }) => {
  // This will be implemented in the next step
  return (
    <Typography>Resource review will be implemented</Typography>
  );
};

export default EnhancedResourceRequestForm;
