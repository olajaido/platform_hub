import React from 'react';
import { Field, useFormikContext } from 'formik';
import { 
  Box, 
  Typography, 
  Divider,
  MenuItem,
  FormControlLabel,
  Switch,
  FormHelperText
} from '@mui/material';
import { Grid } from '../common/GridWrapper';
import { GridItem } from '../common/GridItem';
import { TextField, Select } from 'formik-mui';

// Protocol options
const protocols = [
  { value: 'HTTP', label: 'HTTP' },
  { value: 'HTTPS', label: 'HTTPS' },
];

const ALBConfigForm: React.FC = () => {
  const { values, setFieldValue } = useFormikContext<any>();

  // Auto-generate ALB name if not already set
  React.useEffect(() => {
    if (!values.alb.name && values.name) {
      setFieldValue('alb.name', `${values.name}-alb`);
    }
  }, [values.name, values.alb.name, setFieldValue]);

  // Update health check port when target port changes
  React.useEffect(() => {
    if (values.ecs.containerPort && values.alb.targetPort !== values.ecs.containerPort) {
      setFieldValue('alb.targetPort', values.ecs.containerPort);
      setFieldValue('alb.healthCheckPort', String(values.ecs.containerPort));
    }
  }, [values.ecs.containerPort, values.alb.targetPort, setFieldValue]);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Load Balancer Configuration
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Configure the Application Load Balancer (ALB) for your service.
      </Typography>

      <Grid container spacing={3}>
        {/* Basic Settings */}
        <GridItem xs={12}>
          <Typography variant="subtitle1" fontWeight="bold">
            Basic Settings
          </Typography>
        </GridItem>

        <GridItem xs={12} sm={6}>
          <Field
            component={TextField}
            name="alb.name"
            label="Load Balancer Name"
            fullWidth
            variant="outlined"
          />
        </GridItem>

        <GridItem xs={12} sm={6}>
          <FormControlLabel
            control={
              <Field
                component={Switch}
                type="checkbox"
                name="alb.internal"
              />
            }
            label="Internal Load Balancer"
          />
          <FormHelperText>
            Internal ALBs are only accessible from within your VPC
          </FormHelperText>
        </GridItem>

        {/* Listener Configuration */}
        <GridItem xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" fontWeight="bold">
            Listener Configuration
          </Typography>
        </GridItem>

        <GridItem xs={12} sm={6}>
          <Field
            component={Select}
            name="alb.protocol"
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

        <GridItem xs={12} sm={6}>
          <Field
            component={TextField}
            type="number"
            name="alb.targetPort"
            label="Target Port"
            fullWidth
            variant="outlined"
            helperText="The port your application listens on"
          />
        </GridItem>

        {/* Health Check */}
        <GridItem xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" fontWeight="bold">
            Health Check
          </Typography>
        </GridItem>

        <GridItem xs={12} sm={6}>
          <Field
            component={TextField}
            name="alb.healthCheckPath"
            label="Health Check Path"
            fullWidth
            variant="outlined"
            helperText="Path to check for service health (e.g., /health)"
          />
        </GridItem>

        <GridItem xs={12} sm={6}>
          <Field
            component={TextField}
            name="alb.healthCheckPort"
            label="Health Check Port"
            fullWidth
            variant="outlined"
            helperText="Usually the same as target port"
          />
        </GridItem>

        {/* Help Section */}
        <GridItem xs={12}>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Load Balancer Best Practices
            </Typography>
            <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
              <li>Use HTTPS protocol in production for secure communication</li>
              <li>Create a dedicated health check endpoint in your application</li>
              <li>Internal load balancers are more secure for backend services</li>
              <li>Consider using AWS Certificate Manager for SSL/TLS certificates</li>
            </Typography>
          </Box>
        </GridItem>

        {/* HTTPS Notice */}
        {values.alb.protocol === 'HTTPS' && (
          <GridItem xs={12}>
            <Box sx={{ p: 2, mt: 2, bgcolor: '#fff9c4', borderRadius: 1 }}>
              <Typography variant="subtitle2" color="warning.dark">
                HTTPS Configuration Notice
              </Typography>
              <Typography variant="body2">
                When using HTTPS, you'll need to specify an SSL certificate. 
                After deployment, you can set up a certificate through the AWS Certificate Manager 
                and attach it to your load balancer.
              </Typography>
            </Box>
          </GridItem>
        )}
      </Grid>
    </Box>
  );
};

export default ALBConfigForm; 