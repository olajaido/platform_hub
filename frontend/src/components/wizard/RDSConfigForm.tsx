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
  FormHelperText,
  SelectChangeEvent
} from '@mui/material';
import { Grid } from '../common/GridWrapper';
import { GridItem } from '../common/GridItem';
import { TextField, Select } from 'formik-mui';

// Database engines
const engines = [
  { value: 'mysql', label: 'MySQL' },
  { value: 'postgres', label: 'PostgreSQL' },
  { value: 'mariadb', label: 'MariaDB' },
  { value: 'aurora-mysql', label: 'Aurora MySQL' },
  { value: 'aurora-postgresql', label: 'Aurora PostgreSQL' },
];

// MySQL engine versions
const mysqlVersions = [
  { value: '8.0', label: '8.0' },
  { value: '5.7', label: '5.7' },
];

// PostgreSQL engine versions
const postgresVersions = [
  { value: '14.3', label: '14.3' },
  { value: '13.7', label: '13.7' },
  { value: '12.11', label: '12.11' },
];

// Instance classes
const instanceClasses = [
  { value: 'db.t3.micro', label: 'db.t3.micro (2 vCPU, 1 GiB RAM)' },
  { value: 'db.t3.small', label: 'db.t3.small (2 vCPU, 2 GiB RAM)' },
  { value: 'db.t3.medium', label: 'db.t3.medium (2 vCPU, 4 GiB RAM)' },
  { value: 'db.m5.large', label: 'db.m5.large (2 vCPU, 8 GiB RAM)' },
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

const RDSConfigForm: React.FC = () => {
  const { values, setFieldValue } = useFormikContext<any>();

  // Get engine versions based on selected engine
  const getEngineVersions = () => {
    switch(values.rds.engine) {
      case 'mysql':
      case 'aurora-mysql':
        return mysqlVersions;
      case 'postgres':
      case 'aurora-postgresql':
        return postgresVersions;
      default:
        return mysqlVersions;
    }
  };

  // Handle engine change to update version options
  const handleEngineChange = (event: SelectChangeEvent<unknown>) => {
    const engine = event.target.value as string;
    setFieldValue('rds.engine', engine);
    
    // Set default version for the selected engine
    if (engine === 'mysql' || engine === 'aurora-mysql') {
      setFieldValue('rds.engineVersion', '8.0');
    } else if (engine === 'postgres' || engine === 'aurora-postgresql') {
      setFieldValue('rds.engineVersion', '14.3');
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        RDS Database Configuration
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
            helperText="A descriptive name for your database (not the database name)"
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

        {/* Database Engine */}
        <GridItem xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" fontWeight="bold">
            Database Engine
          </Typography>
        </GridItem>

        <GridItem xs={12} sm={6}>
          <Field
            component={Select}
            name="rds.engine"
            label="Engine"
            fullWidth
            variant="outlined"
            onChange={handleEngineChange}
          >
            {engines.map(option => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Field>
        </GridItem>

        <GridItem xs={12} sm={6}>
          <Field
            component={Select}
            name="rds.engineVersion"
            label="Engine Version"
            fullWidth
            variant="outlined"
          >
            {getEngineVersions().map(option => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Field>
        </GridItem>

        {/* Database Settings */}
        <GridItem xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" fontWeight="bold">
            Database Settings
          </Typography>
        </GridItem>

        <GridItem xs={12} sm={6}>
          <Field
            component={TextField}
            name="rds.databaseName"
            label="Database Name"
            fullWidth
            variant="outlined"
          />
        </GridItem>

        <GridItem xs={12} sm={6}>
          <Field
            component={Select}
            name="rds.instanceClass"
            label="Instance Class"
            fullWidth
            variant="outlined"
          >
            {instanceClasses.map(option => (
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
            name="rds.allocatedStorage"
            label="Allocated Storage"
            fullWidth
            variant="outlined"
            InputProps={{
              endAdornment: <InputAdornment position="end">GB</InputAdornment>,
            }}
          />
        </GridItem>

        <GridItem xs={12} sm={6}>
          <FormControlLabel
            control={
              <Field
                component={Switch}
                type="checkbox"
                name="rds.multiAZ"
              />
            }
            label="Multi-AZ Deployment"
          />
        </GridItem>

        {/* Credentials */}
        <GridItem xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" fontWeight="bold">
            Database Credentials
          </Typography>
        </GridItem>

        <GridItem xs={12} sm={6}>
          <Field
            component={TextField}
            name="rds.masterUsername"
            label="Master Username"
            fullWidth
            variant="outlined"
            helperText="Admin user for database access"
          />
        </GridItem>

        <GridItem xs={12} sm={6}>
          <Field
            component={TextField}
            name="rds.masterPassword"
            label="Master Password"
            fullWidth
            variant="outlined"
            type="password"
            helperText="At least 8 characters with letters, numbers and symbols"
          />
        </GridItem>

        <GridItem xs={12}>
          <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Best Practices
            </Typography>
            <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
              <li>Use Multi-AZ deployment for production workloads to improve availability</li>
              <li>Consider using Aurora for better scalability and performance</li>
              <li>Configure automated backups and maintenance windows</li>
            </Typography>
          </Box>
        </GridItem>
      </Grid>
    </Box>
  );
};

export default RDSConfigForm; 