import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import apiClient from '../api';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Paper,
  Container,
  Grid,
  Alert,
  CircularProgress
} from '@mui/material';

// Import resource type specific forms
import ResourceTypeSelection from './wizard/ResourceTypeSelection';
import EC2ConfigForm from './wizard/EC2ConfigForm';
import S3ConfigForm from './wizard/S3ConfigForm';
import RDSConfigForm from './wizard/RDSConfigForm';
import ECSConfigForm from './wizard/ECSConfigForm';
import SecurityGroupForm from './wizard/SecurityGroupForm';
import ALBConfigForm from './wizard/ALBConfigForm';
import ResourceReview from './wizard/ResourceReview';

// Define the steps based on resource type
const getSteps = (resourceType: string) => {
  const baseSteps = ['Resource Selection'];
  
  switch (resourceType) {
    case 'ec2_instance':
      return [...baseSteps, 'EC2 Configuration', 'Security Group', 'Review'];
    case 's3_bucket':
      return [...baseSteps, 'S3 Configuration', 'Review'];
    case 'rds_instance':
      return [...baseSteps, 'RDS Configuration', 'Security Group', 'Review'];
    case 'ecs_service':
      return [...baseSteps, 'ECS Configuration', 'Load Balancer', 'Security Group', 'Review'];
    default:
      return [...baseSteps, 'Configuration', 'Review'];
  }
};

// Initial form values
const initialValues = {
  resourceType: '',
  name: '',
  environment: 'dev',
  region: 'eu-west-2',
  
  // EC2 specific
  ec2: {
    instanceType: 't2.micro',
    volumeSize: 20,
    subnetId: 'subnet-07759e500cfdfb6b2',
    assignEip: true,
    ami: 'ami-0ad97c80f2dfe623b', // Amazon Linux 2
    userData: '',
  },
  
  // S3 specific
  s3: {
    bucketName: '',
    versioning: false,
    publicAccess: false,
    encryption: true,
  },
  
  // RDS specific
  rds: {
    engine: 'mysql',
    engineVersion: '8.0',
    instanceClass: 'db.t3.micro',
    allocatedStorage: 20,
    multiAZ: false,
    databaseName: '',
    masterUsername: 'admin',
    masterPassword: '',
  },
  
  // ECS specific
  ecs: {
    clusterName: '',
    serviceName: '',
    containerPort: 80,
    cpu: 256,
    memory: 512,
    desiredCount: 1,
    imageUrl: '',
    launchType: 'FARGATE',
  },
  
  // Security Group
  securityGroup: {
    name: '',
    description: 'Created via Infrastructure Platform',
    ingressRules: [
      { protocol: 'tcp', fromPort: 22, toPort: 22, cidrBlock: '0.0.0.0/0', description: 'SSH' }
    ],
  },
  
  // ALB specific
  alb: {
    name: '',
    internal: false,
    targetPort: 80,
    healthCheckPath: '/',
    healthCheckPort: '80',
    protocol: 'HTTP',
  },
  
  // Dependency configuration
  dependencies: {
    connectToRds: false,
    frontWithAlb: false,
    rdsSecurityGroupId: '',
    albSecurityGroupId: '',
  }
};

// Validation schemas for each step
const resourceTypeSchema = Yup.object().shape({
  resourceType: Yup.string().required('Resource type is required'),
});

const EnhancedResourceWizard = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = async (values: any) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Format API request based on resource type
      const request = formatRequestPayload(values);
      
      // Send to backend API
      const response = await apiClient.post('/api/deployments/create', request, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Navigate to deployment status page
      navigate(`/deployments/${response.data.request_id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit resource request');
      setIsSubmitting(false);
    }
  };

  // Format the API request payload based on the form values and resource type
  const formatRequestPayload = (values: any) => {
    const { resourceType, name, environment, region } = values;
    
    // Base request object
    const request: any = {
      resource_type: resourceType,
      name,
      environment,
      region,
      parameters: {}
    };
    
    // Add resource-specific parameters
    switch (resourceType) {
      case 'ec2_instance':
        request.parameters = {
          instance_type: values.ec2.instanceType,
          volume_size: values.ec2.volumeSize.toString(),
          subnet_id: values.ec2.subnetId,
          assign_eip: values.ec2.assignEip,
          ami_id: values.ec2.ami,
          user_data: values.ec2.userData,
          security_group: values.securityGroup,
        };
        break;
        
      case 's3_bucket':
        request.parameters = {
          bucket_name: values.s3.bucketName,
          versioning_enabled: values.s3.versioning,
          block_public_access: values.s3.publicAccess,
          encryption_enabled: values.s3.encryption,
        };
        break;
        
      case 'rds_instance':
        request.parameters = {
          engine: values.rds.engine,
          engine_version: values.rds.engineVersion,
          instance_class: values.rds.instanceClass,
          allocated_storage: values.rds.allocatedStorage,
          multi_az: values.rds.multiAZ,
          database_name: values.rds.databaseName,
          master_username: values.rds.masterUsername,
          master_password: values.rds.masterPassword,
          security_group: values.securityGroup,
        };
        break;
        
      case 'ecs_service':
        request.parameters = {
          cluster_name: values.ecs.clusterName,
          service_name: values.ecs.serviceName,
          container_port: values.ecs.containerPort,
          cpu: values.ecs.cpu,
          memory: values.ecs.memory,
          desired_count: values.ecs.desiredCount,
          image_url: values.ecs.imageUrl,
          launch_type: values.ecs.launchType,
          security_group: values.securityGroup,
          alb_config: values.dependencies.frontWithAlb ? values.alb : null,
        };
        break;
    }
    
    // Add dependency configurations if they exist
    if (values.dependencies.connectToRds) {
      request.parameters.rds_security_group_id = values.dependencies.rdsSecurityGroupId;
    }
    
    return request;
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Request Infrastructure Resources
        </Typography>
        
        <Formik
          initialValues={initialValues}
          onSubmit={handleSubmit}
          validationSchema={resourceTypeSchema}
          validateOnMount
        >
          {({ values, isValid, errors, touched }) => {
            const steps = getSteps(values.resourceType);
            
            // Determine which form to show based on activeStep and resourceType
            const getStepContent = (step: number) => {
              // Always show resource selection for first step
              if (step === 0) {
                return <ResourceTypeSelection />;
              }
              
              // For subsequent steps, determine based on resource type
              switch (values.resourceType) {
                case 'ec2_instance':
                  if (step === 1) return <EC2ConfigForm />;
                  if (step === 2) return <SecurityGroupForm />;
                  if (step === 3) return <ResourceReview values={values} />;
                  break;
                  
                case 's3_bucket':
                  if (step === 1) return <S3ConfigForm />;
                  if (step === 2) return <ResourceReview values={values} />;
                  break;
                  
                case 'rds_instance':
                  if (step === 1) return <RDSConfigForm />;
                  if (step === 2) return <SecurityGroupForm />;
                  if (step === 3) return <ResourceReview values={values} />;
                  break;
                  
                case 'ecs_service':
                  if (step === 1) return <ECSConfigForm />;
                  if (step === 2) return <ALBConfigForm />;
                  if (step === 3) return <SecurityGroupForm />;
                  if (step === 4) return <ResourceReview values={values} />;
                  break;
                  
                default:
                  return <Typography>Please select a resource type first</Typography>;
              }
            };
            
            return (
              <Form>
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
                
                <Box sx={{ mt: 2, mb: 4 }}>
                  {getStepContent(activeStep)}
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
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
                        disabled={isSubmitting || !isValid}
                      >
                        {isSubmitting ? <CircularProgress size={24} /> : 'Submit'}
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleNext}
                        disabled={!isValid || !values.resourceType}
                      >
                        Next
                      </Button>
                    )}
                  </Box>
                </Box>
              </Form>
            );
          }}
        </Formik>
      </Paper>
    </Container>
  );
};

export default EnhancedResourceWizard; 