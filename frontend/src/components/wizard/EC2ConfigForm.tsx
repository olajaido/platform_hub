import React from 'react';
import { Field, useFormikContext } from 'formik';
import { 
  Box, 
  Typography, 
  Divider,
  MenuItem,
  FormControlLabel,
  Switch,
  FormHelperText,
  InputAdornment
} from '@mui/material';
import { Grid } from '../common/GridWrapper';
import { GridItem } from '../common/GridItem';
import { TextField, Select } from 'formik-mui';

// Instance type options
const instanceTypes = [
  { value: 't2.micro', label: 't2.micro (1 vCPU, 1 GiB RAM)' },
  { value: 't2.small', label: 't2.small (1 vCPU, 2 GiB RAM)' },
  { value: 't2.medium', label: 't2.medium (2 vCPU, 4 GiB RAM)' },
  { value: 't3.medium', label: 't3.medium (2 vCPU, 4 GiB RAM)' },
  { value: 'm5.large', label: 'm5.large (2 vCPU, 8 GiB RAM)' },
  { value: 'c5.large', label: 'c5.large (2 vCPU, 4 GiB RAM) - Compute optimized' },
  { value: 'r5.large', label: 'r5.large (2 vCPU, 16 GiB RAM) - Memory optimized' },
];

// Regions
const regions = [
  { value: 'eu-west-2', label: 'EU West (London)' },
  { value: 'us-east-1', label: 'US East (N. Virginia)' },
  { value: 'us-west-2', label: 'US West (Oregon)' },
  { value: 'eu-west-1', label: 'EU (Ireland)' },
];

// Environments
const environments = [
  { value: 'dev', label: 'Development' },
  { value: 'test', label: 'Testing' },
  { value: 'staging', label: 'Staging' },
  { value: 'prod', label: 'Production' },
];

// Subnet options
const subnets = [
  { value: 'subnet-07759e500cfdfb6b2', label: 'eu-west-2a' },
  { value: 'subnet-0d95a35be6e1fb603', label: 'eu-west-2b' },
  { value: 'subnet-00e88d7e1a6b7c689', label: 'eu-west-2c' },
];

// AMI options
const amis = [
  { value: 'ami-0ad97c80f2dfe623b', label: 'Amazon Linux 2' },
  { value: 'ami-07650a4c4c9e3cd40', label: 'Ubuntu 20.04 LTS' },
  { value: 'ami-0aef57767f5404a3c', label: 'Red Hat Enterprise Linux 8' },
  { value: 'ami-0b1deee0e1bbd4eaa', label: 'Windows Server 2019' },
];

const EC2ConfigForm: React.FC = () => {
  const { values, setFieldValue } = useFormikContext<any>();

  const handleRDSConnectionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFieldValue('dependencies.connectToRds', event.target.checked);
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        EC2 Instance Configuration
      </Typography>

      <Grid container spacing={3}>
        {/* Basic settings */}
        <GridItem xs={12}>
          <Typography variant="subtitle1" fontWeight="bold">
            Basic Settings
          </Typography>
        </GridItem>

        <GridItem xs={12}>
          <Field
            component={TextField}
            name="name"
            label="Resource Name"
            fullWidth
            variant="outlined"
            helperText="A unique name for your EC2 instance"
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

        {/* Instance settings */}
        <GridItem xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" fontWeight="bold">
            Instance Settings
          </Typography>
        </GridItem>

        <GridItem xs={12}>
          <Field
            component={Select}
            name="ec2.instanceType"
            label="Instance Type"
            fullWidth
            variant="outlined"
          >
            {instanceTypes.map(option => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Field>
        </GridItem>

        <GridItem xs={12} sm={6}>
          <Field
            component={Select}
            name="ec2.ami"
            label="Amazon Machine Image (AMI)"
            fullWidth
            variant="outlined"
          >
            {amis.map(option => (
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
            name="ec2.volumeSize"
            label="Root Volume Size"
            fullWidth
            variant="outlined"
            InputProps={{
              endAdornment: <InputAdornment position="end">GB</InputAdornment>,
            }}
          />
        </GridItem>

        {/* Network settings */}
        <GridItem xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" fontWeight="bold">
            Network Settings
          </Typography>
        </GridItem>

        <GridItem xs={12} sm={6}>
          <Field
            component={Select}
            name="ec2.subnetId"
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

        <GridItem xs={12} sm={6}>
          <FormControlLabel
            control={
              <Field
                component={Switch}
                type="checkbox"
                name="ec2.assignEip"
              />
            }
            label="Assign Elastic IP"
          />
        </GridItem>

        {/* Advanced settings */}
        <GridItem xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" fontWeight="bold">
            Advanced Settings
          </Typography>
        </GridItem>

        <GridItem xs={12}>
          <Field
            component={TextField}
            name="ec2.userData"
            label="User Data Script"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            placeholder="#!/bin/bash&#10;# Your initialization script here"
            helperText="Bootstrap script that runs when the instance first starts"
          />
        </GridItem>

        {/* Dependencies */}
        <GridItem xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" fontWeight="bold">
            Dependencies
          </Typography>
        </GridItem>

        <GridItem xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={values.dependencies.connectToRds}
                onChange={handleRDSConnectionChange}
                name="dependencies.connectToRds"
              />
            }
            label="Connect to RDS Database"
          />
        </GridItem>

        {values.dependencies.connectToRds && (
          <GridItem xs={12}>
            <Field
              component={TextField}
              name="dependencies.rdsSecurityGroupId"
              label="RDS Security Group ID"
              fullWidth
              variant="outlined"
              helperText="Enter the security group ID of your existing RDS instance"
            />
          </GridItem>
        )}
      </Grid>
    </Box>
  );
};

export default EC2ConfigForm; 