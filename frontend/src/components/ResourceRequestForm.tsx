// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { Formik, Form, Field } from 'formik';
// import * as Yup from 'yup';
// import { GridItem } from '././common/GridItem';
// import { 
//   Container, 
//   Paper, 
//   Typography, 
//   Grid, 
//   MenuItem,
//   Button, 
//   Box,
//   Stepper,
//   Step,
//   StepLabel,
//   CircularProgress,
//   Alert
// } from '@mui/material';
// import { TextField, Select } from 'formik-mui';
// import axios from 'axios';


// interface FormValues {
//     resourceType: string;
//     size: string;
//     region: string;
//     parameters: {
//       name: string;
//       environment: string;
//     };
//   }
// // Validation schema
// const ResourceSchema = Yup.object().shape({
//   resourceType: Yup.string().required('Resource type is required'),
//   size: Yup.string().required('Size is required'),
//   region: Yup.string().required('Region is required'),
//   parameters: Yup.object().shape({
//     name: Yup.string().required('Name is required'),
//     environment: Yup.string().required('Environment is required'),
//   }),
// });

// // Resource options
// const resourceTypes = [
//   { value: 'ec2_instance', label: 'EC2 Instance' },
//   { value: 'rds_database', label: 'RDS Database' },
//   { value: 's3_bucket', label: 'S3 Bucket' },
//   { value: 'lambda_function', label: 'Lambda Function' },
// ];

// const sizes = [
//   { value: 'small', label: 'Small' },
//   { value: 'medium', label: 'Medium' },
//   { value: 'large', label: 'Large' },
// ];

// const regions = [
//   { value: 'us-east-1', label: 'US East (N. Virginia)' },
//   { value: 'us-west-2', label: 'US West (Oregon)' },
//   { value: 'eu-west-1', label: 'EU (Ireland)' },
//   { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
// ];

// const environments = [
//   { value: 'dev', label: 'Development' },
//   { value: 'test', label: 'Testing' },
//   { value: 'staging', label: 'Staging' },
//   { value: 'prod', label: 'Production' },
// ];

// // Steps for the stepper
// const steps = ['Resource Selection', 'Configuration', 'Review'];

// const ResourceRequestForm = () => {
//   const [activeStep, setActiveStep] = useState(0);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const navigate = useNavigate();

//   const handleNext = () => {
//     setActiveStep((prevActiveStep) => prevActiveStep + 1);
//   };

//   const handleBack = () => {
//     setActiveStep((prevActiveStep) => prevActiveStep - 1);
//   };

//   const handleSubmit = async (values: FormValues, { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }) => {
//     setLoading(true);
//     setError(null);
    
//     try {
//       // Format the request
//       const request = {
//         resource_type: values.resourceType,
//         size: values.size,
//         region: values.region,
//         parameters: values.parameters
//       };
      
//       // Send to backend
//       const response = await axios.post('/api/resources', request, {
//         headers: {
//           'Authorization': `Bearer ${localStorage.getItem('token')}`
//         }
//       });
      
//       // Navigate to the deployment status page
//       navigate(`/deployments/${response.data.request_id}`);
//     } catch (err: any) {
//         setError(err.response?.data?.detail || 'Failed to submit resource request');
//     } finally {
//       setLoading(false);
//       setSubmitting(false);
//     }
//   };
  

//   return (
//     <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
//       <Paper elevation={3} sx={{ p: 4 }}>
//         <Typography variant="h4" component="h1" gutterBottom>
//           Request Infrastructure Resources
//         </Typography>
        
//         <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
//           {steps.map((label) => (
//             <Step key={label}>
//               <StepLabel>{label}</StepLabel>
//             </Step>
//           ))}
//         </Stepper>
        
//         {error && (
//           <Alert severity="error" sx={{ mb: 2 }}>
//             {error}
//           </Alert>
//         )}
        
//         <Formik
//           initialValues={{
//             resourceType: 'ec2_instance',  // Pre-select EC2 Instance
//             size: 'medium',                // Pre-select Medium
//             region: 'us-east-1',           // Pre-select US East
//             parameters: {
//               name: '',
//               environment: 'dev',
//             },
//           }}
//           validationSchema={ResourceSchema}
//           onSubmit={handleSubmit}
//         >
//           {({ values, isValid, dirty }) => (
            
//             <Form>
//               {activeStep === 0 && (
//                 <Grid container spacing={3}>
//                   <GridItem xs={12} >
//                     <Field
//                       component={Select}
//                       name="resourceType"
//                       label="Resource Type"
//                       fullWidth
//                       variant="outlined"
//                     >
//                       {resourceTypes.map(option => (
//                         <MenuItem key={option.value} value={option.value}>
//                           {option.label}
//                         </MenuItem>
//                       ))}
//                     </Field>
//                   </GridItem>
                  
//                   <GridItem xs={12} sm={6}>
//                     <Field
//                       component={Select}
//                       name="size"
//                       label="Size"
//                       fullWidth
//                       variant="outlined"
//                     >
//                       {sizes.map(option => (
//                         <MenuItem key={option.value} value={option.value}>
//                           {option.label}
//                         </MenuItem>
//                       ))}
//                     </Field>
//                   </GridItem>
                  
//                   <GridItem xs={12} sm={6}>
//                     <Field
//                       component={Select}
//                       name="region"
//                       label="Region"
//                       fullWidth
//                       variant="outlined"
//                     >
//                       {regions.map(option => (
//                         <MenuItem key={option.value} value={option.value}>
//                           {option.label}
//                         </MenuItem>
//                       ))}
//                     </Field>
//                   </GridItem>
//                 </Grid>
//               )}
              
//               {activeStep === 1 && (
//                 <Grid container spacing={3}>
//                   <GridItem xs={12}>
//                     <Field
//                       component={TextField}
//                       name="parameters.name"
//                       label="Resource Name"
//                       fullWidth
//                       variant="outlined"
//                     />
//                   </GridItem>
                  
//                   <GridItem xs={12}>
//                     <Field
//                       component={Select}
//                       name="parameters.environment"
//                       label="Environment"
//                       fullWidth
//                       variant="outlined"
//                     >
//                       {environments.map(option => (
//                         <MenuItem key={option.value} value={option.value}>
//                           {option.label}
//                         </MenuItem>
//                       ))}
//                     </Field>
//                   </GridItem>
//                 </Grid>
//               )}
              
//               {activeStep === 2 && (
//                 <Box sx={{ mb: 4 }}>
//                   <Typography variant="h6" gutterBottom>
//                     Review Your Request
//                   </Typography>
                  
//                   <Grid container spacing={2}>
//                     <GridItem xs={6}>
//                       <Typography variant="subtitle1">Resource Type:</Typography>
//                     </GridItem>
//                     <GridItem xs={6}>
//                       <Typography variant="body1">
//                         {resourceTypes.find(r => r.value === values.resourceType)?.label || values.resourceType}
//                       </Typography>
//                     </GridItem>
                    
//                     <GridItem xs={6}>
//                       <Typography variant="subtitle1">Size:</Typography>
//                     </GridItem>
//                     <GridItem xs={6}>
//                       <Typography variant="body1">
//                         {sizes.find(s => s.value === values.size)?.label || values.size}
//                       </Typography>
//                     </GridItem>
                    
//                     <GridItem xs={6}>
//                       <Typography variant="subtitle1">Region:</Typography>
//                     </GridItem>
//                     <GridItem xs={6}>
//                       <Typography variant="body1">
//                         {regions.find(r => r.value === values.region)?.label || values.region}
//                       </Typography>
//                     </GridItem>
                    
//                     <GridItem xs={6}>
//                       <Typography variant="subtitle1">Name:</Typography>
//                     </GridItem>
//                     <GridItem xs={6}>
//                       <Typography variant="body1">{values.parameters.name}</Typography>
//                     </GridItem>
                    
//                     <GridItem xs={6}>
//                       <Typography variant="subtitle1">Environment:</Typography>
//                     </GridItem>
//                     <GridItem xs={6}>
//                       <Typography variant="body1">
//                         {environments.find(e => e.value === values.parameters.environment)?.label || values.parameters.environment}
//                       </Typography>
//                     </GridItem>
//                   </Grid>
//                 </Box>
//               )}
              
//               <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
//                 <Button
//                   disabled={activeStep === 0}
//                   onClick={handleBack}
//                   variant="outlined"
//                 >
//                   Back
//                 </Button>
                
//                 <Box>
//                   {activeStep === steps.length - 1 ? (
//                     <Button
//                       type="submit"
//                       variant="contained"
//                       color="primary"
//                       disabled={loading || !isValid || !dirty}
//                     >
//                       {loading ? <CircularProgress size={24} /> : "Submit Request"}
//                     </Button>
//                   ) : (
//                 <Button
//                     variant="contained"
//                     color="primary"
//                     onClick={handleNext}
//                     // Remove validation for now to ensure the button works
//                     disabled={false}
//                   >
//                     Next
//                 </Button>       
//                     // <Button
//                     //   variant="contained"
//                     //   color="primary"
//                     //   onClick={handleNext}
//                     //   disabled={!isValid || 
//                     //     (activeStep === 0 && (!values.resourceType || !values.size || !values.region)) ||
//                     //     (activeStep === 1 && (!values.parameters.name || !values.parameters.environment))
//                     //   }
//                     // >
//                     //   Next
//                     // </Button>
//                   )}
//                 </Box>
//               </Box>
//             </Form>
//           )}
//         </Formik>
//       </Paper>
//     </Container>
//   );
// };

// export default ResourceRequestForm;

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
  Grid, 
  MenuItem,
  Button, 
  Box,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Alert
} from '@mui/material';
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
function getSizeMapping(size: string): string {
  const mapping: Record<string, string> = {
    'small': 't2.micro',
    'medium': 't2.small',
    'large': 't2.medium'
  };
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
      // Format the request for the new endpoint
      const request = {
        resource_type: values.resourceType,
        name: values.parameters.name,
        environment: values.parameters.environment,
        region: values.region,
        parameters: {
          instance_type: getSizeMapping(values.size),
          volume_size: "20",
          subnet_id: values.parameters.subnet_id || "subnet-07759e500cfdfb6b2"
        }
      };
      
      // Send to backend - now using the new deployments/create endpoint
      const response = await axios.post('/api/deployments/create', request, {
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
              subnet_id: 'subnet-07759e500cfdfb6b2'
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