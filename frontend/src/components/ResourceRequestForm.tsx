import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import apiClient from '../api';
import { GridItem } from '././common/GridItem';
import { 
  Container, 
  Paper, 
  Typography, 
  MenuItem,
  Button, 
  Box,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Alert
} from '@mui/material';
import { Grid } from './common/GridWrapper';
import { TextField, Select } from 'formik-mui';
import axios from 'axios';

interface FormValues {
  resourceType: string;
  size: string;
  region: string;
  parameters: {
    name: string;
    environment: string;
    subnet_id?: string;
    engine?: string;
    engine_version?: string;
    container_image?: string;
    vpc_id?: string;
  };
}

// Validation schema
const ResourceSchema = Yup.object().shape({
  resourceType: Yup.string().required('Resource type is required'),
  size: Yup.string().required('Size is required'),
  region: Yup.string().required('Region is required'),
  parameters: Yup.object().shape({
    name: Yup.string().required('Name is required'),
    environment: Yup.string().required('Environment is required'),
  }),
});

// Resource options
const resourceTypes = [
  { value: 'ec2_instance', label: 'EC2 Instance' },
  { value: 's3_bucket', label: 'S3 Bucket' },
  { value: 'rds_instance', label: 'RDS Database' },
  { value: 'ecs_service', label: 'ECS Service' },
  { value: 'alb', label: 'Application Load Balancer' },
  { value: 'security_group', label: 'Security Group' },
];

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

// Subnet options for EC2
const subnets = [
  { value: 'subnet-07759e500cfdfb6b2', label: 'eu-west-2a' },
  { value: 'subnet-0d95a35be6e1fb603', label: 'eu-west-2b' },
  { value: 'subnet-00e88d7e1a6b7c689', label: 'eu-west-2c' },
];

// Steps for the stepper
const steps = ['Resource Selection', 'Configuration', 'Review'];

// Function to map size to instance type
function getSizeMapping(size: string, type?: string): string {
  const mapping: Record<string, string> = {
    'small': 't2.micro',
    'medium': 't2.small',
    'large': 't2.medium'
  };
  if (type === 'db') {
    const dbMapping: Record<string, string> = {
      'small': 'db.t2.micro',
      'medium': 'db.t2.small',
      'large': 'db.t2.medium'
    };
    return dbMapping[size] || 'db.t2.micro';
  }
  return mapping[size] || 't2.micro';
}

const ResourceRequestForm = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSubmit = async (values: FormValues, { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }) => {
    setLoading(true);
    setError(null);
    
    try {
      // Base request parameters
      const request = {
        resource_type: values.resourceType,
        name: values.parameters.name,
        environment: values.parameters.environment,
        region: values.region,
        parameters: {}
      };
      
      // Add resource-specific parameters
      switch(values.resourceType) {
        case 'ec2_instance':
          request.parameters = {
            instance_type: getSizeMapping(values.size),
            volume_size: "20",
            subnet_id: values.parameters.subnet_id || "subnet-07759e500cfdfb6b2"
          };
          break;
        case 's3_bucket':
          request.parameters = {
            versioning_enabled: values.size !== 'small' ? "true" : "false"
          };
          break;
        case 'rds_instance':
          request.parameters = {
            engine: values.parameters.engine || "mysql",
            engine_version: values.parameters.engine_version || "8.0",
            instance_class: getSizeMapping(values.size, 'db'),
            allocated_storage: values.size === 'small' ? "20" : values.size === 'medium' ? "50" : "100",
            master_username: "admin",
            multi_az: values.size === 'large' ? "true" : "false",
            subnet_id: values.parameters.subnet_id || "subnet-07759e500cfdfb6b2"
          };
          break;
        case 'ecs_service':
          request.parameters = {
            container_image: values.parameters.container_image || "nginx:latest",
            container_port: "80",
            cpu: values.size === 'small' ? "256" : values.size === 'medium' ? "512" : "1024",
            memory: values.size === 'small' ? "512" : values.size === 'medium' ? "1024" : "2048",
            launch_type: "FARGATE",
            subnet_id: values.parameters.subnet_id || "subnet-07759e500cfdfb6b2"
          };
          break;
        case 'alb':
          request.parameters = {
            internal: "false",
            subnet_id: values.parameters.subnet_id || "subnet-07759e500cfdfb6b2"
          };
          break;
        case 'security_group':
          request.parameters = {
            sg_description: `Security group for ${values.parameters.name} in ${values.parameters.environment}`,
            vpc_id: "vpc-12345678"
          };
          break;
      }
   
      // Send to backend - now using the new deployments/create endpoint
      const response = await apiClient.post('/api/deployments/create', request, {
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
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
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
            resourceType: 'ec2_instance',
            size: 'medium',
            region: 'eu-west-2',
            parameters: {
              name: '',
              environment: 'dev',
              subnet_id: 'subnet-07759e500cfdfb6b2',
              engine: 'mysql',
              engine_version: '8.0',
              container_image: 'nginx:latest',
              vpc_id: 'vpc-12345678'
            },
          }}
          validationSchema={ResourceSchema}
          onSubmit={handleSubmit}
        >
          {({ values, isValid, dirty }) => (
            
            <Form>
              {activeStep === 0 && (
                <Grid container spacing={3}>
                  <GridItem xs={12} >
                    <Field
                      component={Select}
                      name="resourceType"
                      label="Resource Type"
                      fullWidth
                      variant="outlined"
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
                      component={Select}
                      name="size"
                      label="Size"
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
                      name="region"
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
              )}
              
              {activeStep === 1 && (
                <Grid container spacing={3}>
                  <GridItem xs={12}>
                    <Field
                      component={TextField}
                      name="parameters.name"
                      label="Resource Name"
                      fullWidth
                      variant="outlined"
                    />
                  </GridItem>
                  
                  <GridItem xs={12}>
                    <Field
                      component={Select}
                      name="parameters.environment"
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
                  
                  {values.resourceType === 'ec2_instance' && (
                    <GridItem xs={12}>
                      <Field
                        component={Select}
                        name="parameters.subnet_id"
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
                  )}

                  {values.resourceType === 'rds_instance' && (
                    <>
                      <GridItem xs={12} sm={6}>
                        <Field
                          component={Select}
                          name="parameters.engine"
                          label="Database Engine"
                          fullWidth
                          variant="outlined"
                          initialValue="mysql"
                        >
                          <MenuItem value="mysql">MySQL</MenuItem>
                          <MenuItem value="postgres">PostgreSQL</MenuItem>
                          <MenuItem value="mariadb">MariaDB</MenuItem>
                        </Field>
                      </GridItem>
                      <GridItem xs={12} sm={6}>
                        <Field
                          component={TextField}
                          name="parameters.engine_version"
                          label="Engine Version"
                          fullWidth
                          variant="outlined"
                          placeholder="e.g. 8.0"
                        />
                      </GridItem>
                      <GridItem xs={12}>
                        <Field
                          component={Select}
                          name="parameters.subnet_id"
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
                    </>
                  )}

                  {values.resourceType === 'ecs_service' && (
                    <>
                      <GridItem xs={12}>
                        <Field
                          component={TextField}
                          name="parameters.container_image"
                          label="Container Image"
                          fullWidth
                          variant="outlined"
                          placeholder="e.g. nginx:latest"
                        />
                      </GridItem>
                      <GridItem xs={12}>
                        <Field
                          component={Select}
                          name="parameters.subnet_id"
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
                    </>
                  )}

                  {values.resourceType === 'alb' && (
                    <GridItem xs={12}>
                      <Field
                        component={Select}
                        name="parameters.subnet_id"
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
                  )}
                </Grid>
              )}
              
              {activeStep === 2 && (
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    Review Your Request
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <GridItem xs={6}>
                      <Typography variant="subtitle1">Resource Type:</Typography>
                    </GridItem>
                    <GridItem xs={6}>
                      <Typography variant="body1">
                        {resourceTypes.find(r => r.value === values.resourceType)?.label || values.resourceType}
                      </Typography>
                    </GridItem>
                    
                    <GridItem xs={6}>
                      <Typography variant="subtitle1">Size:</Typography>
                    </GridItem>
                    <GridItem xs={6}>
                      <Typography variant="body1">
                        {sizes.find(s => s.value === values.size)?.label || values.size}
                      </Typography>
                    </GridItem>
                    
                    <GridItem xs={6}>
                      <Typography variant="subtitle1">Region:</Typography>
                    </GridItem>
                    <GridItem xs={6}>
                      <Typography variant="body1">
                        {regions.find(r => r.value === values.region)?.label || values.region}
                      </Typography>
                    </GridItem>
                    
                    <GridItem xs={6}>
                      <Typography variant="subtitle1">Name:</Typography>
                    </GridItem>
                    <GridItem xs={6}>
                      <Typography variant="body1">{values.parameters.name}</Typography>
                    </GridItem>
                    
                    <GridItem xs={6}>
                      <Typography variant="subtitle1">Environment:</Typography>
                    </GridItem>
                    <GridItem xs={6}>
                      <Typography variant="body1">
                        {environments.find(e => e.value === values.parameters.environment)?.label || values.parameters.environment}
                      </Typography>
                    </GridItem>
                    
                    {/* EC2 specific parameters */}
                    {values.resourceType === 'ec2_instance' && values.parameters.subnet_id && (
                      <>
                        <GridItem xs={6}>
                          <Typography variant="subtitle1">Subnet:</Typography>
                        </GridItem>
                        <GridItem xs={6}>
                          <Typography variant="body1">
                            {subnets.find(s => s.value === values.parameters.subnet_id)?.label || values.parameters.subnet_id}
                          </Typography>
                        </GridItem>
                        <GridItem xs={6}>
                          <Typography variant="subtitle1">Instance Type:</Typography>
                        </GridItem>
                        <GridItem xs={6}>
                          <Typography variant="body1">{getSizeMapping(values.size)}</Typography>
                        </GridItem>
                      </>
                    )}
                    
                    {/* S3 specific parameters */}
                    {values.resourceType === 's3_bucket' && (
                      <>
                        <GridItem xs={6}>
                          <Typography variant="subtitle1">Versioning:</Typography>
                        </GridItem>
                        <GridItem xs={6}>
                          <Typography variant="body1">{values.size !== 'small' ? 'Enabled' : 'Disabled'}</Typography>
                        </GridItem>
                      </>
                    )}
                    
                    {/* RDS specific parameters */}
                    {values.resourceType === 'rds_instance' && (
                      <>
                        <GridItem xs={6}>
                          <Typography variant="subtitle1">Database Engine:</Typography>
                        </GridItem>
                        <GridItem xs={6}>
                          <Typography variant="body1">
                            {(values.parameters as any).engine || "MySQL"}
                          </Typography>
                        </GridItem>
                        <GridItem xs={6}>
                          <Typography variant="subtitle1">Engine Version:</Typography>
                        </GridItem>
                        <GridItem xs={6}>
                          <Typography variant="body1">
                            {(values.parameters as any).engine_version || "8.0"}
                          </Typography>
                        </GridItem>
                        <GridItem xs={6}>
                          <Typography variant="subtitle1">Instance Class:</Typography>
                        </GridItem>
                        <GridItem xs={6}>
                          <Typography variant="body1">{getSizeMapping(values.size, 'db')}</Typography>
                        </GridItem>
                        <GridItem xs={6}>
                          <Typography variant="subtitle1">Storage:</Typography>
                        </GridItem>
                        <GridItem xs={6}>
                          <Typography variant="body1">
                            {values.size === 'small' ? "20GB" : values.size === 'medium' ? "50GB" : "100GB"}
                          </Typography>
                        </GridItem>
                        <GridItem xs={6}>
                          <Typography variant="subtitle1">Multi-AZ:</Typography>
                        </GridItem>
                        <GridItem xs={6}>
                          <Typography variant="body1">{values.size === 'large' ? "Yes" : "No"}</Typography>
                        </GridItem>
                      </>
                    )}
                    
                    {/* ECS specific parameters */}
                    {values.resourceType === 'ecs_service' && (
                      <>
                        <GridItem xs={6}>
                          <Typography variant="subtitle1">Container Image:</Typography>
                        </GridItem>
                        <GridItem xs={6}>
                          <Typography variant="body1">
                            {(values.parameters as any).container_image || "nginx:latest"}
                          </Typography>
                        </GridItem>
                        <GridItem xs={6}>
                          <Typography variant="subtitle1">Container Port:</Typography>
                        </GridItem>
                        <GridItem xs={6}>
                          <Typography variant="body1">80</Typography>
                        </GridItem>
                        <GridItem xs={6}>
                          <Typography variant="subtitle1">CPU:</Typography>
                        </GridItem>
                        <GridItem xs={6}>
                          <Typography variant="body1">
                            {values.size === 'small' ? "256" : values.size === 'medium' ? "512" : "1024"} CPU units
                          </Typography>
                        </GridItem>
                        <GridItem xs={6}>
                          <Typography variant="subtitle1">Memory:</Typography>
                        </GridItem>
                        <GridItem xs={6}>
                          <Typography variant="body1">
                            {values.size === 'small' ? "512" : values.size === 'medium' ? "1024" : "2048"} MB
                          </Typography>
                        </GridItem>
                        <GridItem xs={6}>
                          <Typography variant="subtitle1">Launch Type:</Typography>
                        </GridItem>
                        <GridItem xs={6}>
                          <Typography variant="body1">FARGATE</Typography>
                        </GridItem>
                      </>
                    )}
                    
                    {/* ALB specific parameters */}
                    {values.resourceType === 'alb' && (
                      <>
                        <GridItem xs={6}>
                          <Typography variant="subtitle1">Scheme:</Typography>
                        </GridItem>
                        <GridItem xs={6}>
                          <Typography variant="body1">Internet-facing</Typography>
                        </GridItem>
                        <GridItem xs={6}>
                          <Typography variant="subtitle1">Subnet:</Typography>
                        </GridItem>
                        <GridItem xs={6}>
                          <Typography variant="body1">
                            {subnets.find(s => s.value === values.parameters.subnet_id)?.label || values.parameters.subnet_id || "Default subnet"}
                          </Typography>
                        </GridItem>
                      </>
                    )}
                    
                    {/* Security Group specific parameters */}
                    {values.resourceType === 'security_group' && (
                      <>
                        <GridItem xs={6}>
                          <Typography variant="subtitle1">Description:</Typography>
                        </GridItem>
                        <GridItem xs={6}>
                          <Typography variant="body1">
                            Security group for {values.parameters.name} in {values.parameters.environment}
                          </Typography>
                        </GridItem>
                        <GridItem xs={6}>
                          <Typography variant="subtitle1">VPC:</Typography>
                        </GridItem>
                        <GridItem xs={6}>
                          <Typography variant="body1">Default VPC</Typography>
                        </GridItem>
                      </>
                    )}
                  </Grid>
                </Box>
              )}
              
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
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={loading || !isValid || !dirty}
                    >
                      {loading ? <CircularProgress size={24} /> : "Submit Request"}
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleNext}
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

export default ResourceRequestForm;