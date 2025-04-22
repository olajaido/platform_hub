import React from 'react';
import { Field, useFormikContext } from 'formik';
import { 
  Box, 
  Typography, 
  Divider,
  MenuItem,
  FormControlLabel,
  Switch,
  InputAdornment,
  Paper,
  SelectChangeEvent,
  Select as MuiSelect
} from '@mui/material';
import { Grid } from '../common/GridWrapper';
import { GridItem } from '../common/GridItem';
import { TextField, Select } from 'formik-mui';

// Launch types
const launchTypes = [
  { value: 'FARGATE', label: 'Fargate (Serverless)' },
  { value: 'EC2', label: 'EC2 (Self-managed)' },
];

// CPU/Memory combinations for Fargate
const fargateSizes = [
  { value: { cpu: 256, memory: 512 }, label: '0.25 vCPU, 0.5GB Memory' },
  { value: { cpu: 256, memory: 1024 }, label: '0.25 vCPU, 1GB Memory' },
  { value: { cpu: 512, memory: 1024 }, label: '0.5 vCPU, 1GB Memory' },
  { value: { cpu: 1024, memory: 2048 }, label: '1 vCPU, 2GB Memory' },
  { value: { cpu: 2048, memory: 4096 }, label: '2 vCPU, 4GB Memory' },
  { value: { cpu: 4096, memory: 8192 }, label: '4 vCPU, 8GB Memory' },
];

// Environments
const environments = [
  { value: 'dev', label: 'Development' },
  { value: 'test', label: 'Testing' },
  { value: 'staging', label: 'Staging' },
  { value: 'prod', label: 'Production' },
];

// Regions
const regions = [
  { value: 'eu-west-2', label: 'EU West (London)' },
  { value: 'us-east-1', label: 'US East (N. Virginia)' },
  { value: 'us-west-2', label: 'US West (Oregon)' },
  { value: 'eu-west-1', label: 'EU (Ireland)' },
];

const ECSConfigForm: React.FC = () => {
  const { values, setFieldValue } = useFormikContext<any>();

  // Handle size selection (CPU/Memory) for Fargate
  const handleSizeChange = (event: SelectChangeEvent<unknown>) => {
    const selectedSize = fargateSizes.find(
      size => `${size.value.cpu}-${size.value.memory}` === event.target.value
    );
    
    if (selectedSize) {
      setFieldValue('ecs.cpu', selectedSize.value.cpu);
      setFieldValue('ecs.memory', selectedSize.value.memory);
    }
  };

  // Get current size value for the select box
  const getCurrentSizeValue = () => {
    return `${values.ecs.cpu}-${values.ecs.memory}`;
  };

  // Handle ALB connection change
  const handleAlbChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFieldValue('dependencies.frontWithAlb', event.target.checked);
    
    // Generate ALB name if turning on
    if (event.target.checked && !values.alb.name) {
      setFieldValue('alb.name', `${values.name}-alb`);
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        ECS Service Configuration
      </Typography>

      <Grid container spacing={3}>
        {/* Basic Information */}
        <GridItem xs={12}>
          <Typography variant="subtitle1" fontWeight="bold">
            Basic Information
          </Typography>
        </GridItem>

        <GridItem xs={12}>
          <Field
            component={TextField}
            name="name"
            label="Resource Name"
            fullWidth
            variant="outlined"
            helperText="A descriptive name for your service"
          />
        </GridItem>

        <GridItem xs={12} sm={6}>
          <Field
            component={Select}
            name="environment"
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

        {/* Cluster Settings */}
        <GridItem xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" fontWeight="bold">
            Cluster Settings
          </Typography>
        </GridItem>

        <GridItem xs={12} sm={6}>
          <Field
            component={TextField}
            name="ecs.clusterName"
            label="Cluster Name"
            fullWidth
            variant="outlined"
            helperText="Name of the ECS cluster to create or use"
          />
        </GridItem>

        <GridItem xs={12} sm={6}>
          <Field
            component={Select}
            name="ecs.launchType"
            label="Launch Type"
            fullWidth
            variant="outlined"
          >
            {launchTypes.map(option => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Field>
        </GridItem>

        {/* Service Settings */}
        <GridItem xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" fontWeight="bold">
            Service Settings
          </Typography>
        </GridItem>

        <GridItem xs={12} sm={6}>
          <Field
            component={TextField}
            name="ecs.serviceName"
            label="Service Name"
            fullWidth
            variant="outlined"
          />
        </GridItem>

        <GridItem xs={12} sm={6}>
          <Field
            component={TextField}
            type="number"
            name="ecs.desiredCount"
            label="Desired Task Count"
            fullWidth
            variant="outlined"
          />
        </GridItem>

        <GridItem xs={12}>
          <Field
            component={TextField}
            name="ecs.imageUrl"
            label="Container Image URL"
            fullWidth
            variant="outlined"
            placeholder="e.g., 123456789012.dkr.ecr.us-east-1.amazonaws.com/my-app:latest"
            helperText="Docker image URL from ECR, Docker Hub, etc."
          />
        </GridItem>

        <GridItem xs={12} sm={6}>
          <Field
            component={TextField}
            type="number"
            name="ecs.containerPort"
            label="Container Port"
            fullWidth
            variant="outlined"
            helperText="Port your application listens on inside the container"
          />
        </GridItem>

        {/* Resource Allocation */}
        <GridItem xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" fontWeight="bold">
            Resource Allocation
          </Typography>
        </GridItem>

        {values.ecs.launchType === 'FARGATE' && (
          <GridItem xs={12}>
            <MuiSelect
              value={getCurrentSizeValue()}
              onChange={handleSizeChange}
              label="Task Size"
              fullWidth
              variant="outlined"
              displayEmpty
            >
              {fargateSizes.map(option => (
                <MenuItem 
                  key={`${option.value.cpu}-${option.value.memory}`} 
                  value={`${option.value.cpu}-${option.value.memory}`}
                >
                  {option.label}
                </MenuItem>
              ))}
            </MuiSelect>
          </GridItem>
        )}

        {values.ecs.launchType !== 'FARGATE' && (
          <>
            <GridItem xs={12} sm={6}>
              <Field
                component={TextField}
                type="number"
                name="ecs.cpu"
                label="CPU Units"
                fullWidth
                variant="outlined"
                helperText="1024 CPU units = 1 vCPU"
              />
            </GridItem>

            <GridItem xs={12} sm={6}>
              <Field
                component={TextField}
                type="number"
                name="ecs.memory"
                label="Memory"
                fullWidth
                variant="outlined"
                InputProps={{
                  endAdornment: <InputAdornment position="end">MB</InputAdornment>,
                }}
              />
            </GridItem>
          </>
        )}

        {/* Load Balancer */}
        <GridItem xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" fontWeight="bold">
            Load Balancer
          </Typography>
        </GridItem>

        <GridItem xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={values.dependencies.frontWithAlb}
                onChange={handleAlbChange}
                name="dependencies.frontWithAlb"
              />
            }
            label="Front with Application Load Balancer"
          />
        </GridItem>

        {/* Example Environment Variables */}
        <GridItem xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" fontWeight="bold">
            Common Patterns
          </Typography>
        </GridItem>

        <GridItem xs={12}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Web Application
                </Typography>
                <Typography variant="body2">
                  Frontend web application with ALB, container port 80, public access.
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="subtitle2" gutterBottom>
                  API Service
                </Typography>
                <Typography variant="body2">
                  REST API with ALB, container port 8080, restricted access via security groups.
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Worker Service
                </Typography>
                <Typography variant="body2">
                  Background worker without ALB, processes tasks asynchronously.
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </GridItem>
      </Grid>
    </Box>
  );
};

export default ECSConfigForm; 