import React from 'react';
import { Field, useFormikContext } from 'formik';
import { 
  Box, 
  Typography, 
  Divider,
  Paper,
  Switch,
  FormControlLabel,
  FormHelperText,
  Alert,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import { Grid } from '../common/GridWrapper';
import { GridItem } from '../common/GridItem';
import { TextField, Select } from 'formik-mui';

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

const S3ConfigForm: React.FC = () => {
  const { values, setFieldValue } = useFormikContext<any>();

  // Auto-generate bucket name suggestion based on project name
  React.useEffect(() => {
    if (values.name && !values.s3.bucketName) {
      // Convert to lowercase and remove special characters
      const suggestedName = `${values.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${values.environment}-bucket`;
      setFieldValue('s3.bucketName', suggestedName);
    }
  }, [values.name, values.environment, values.s3.bucketName, setFieldValue]);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        S3 Bucket Configuration
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
            helperText="A descriptive name for your resource (not the bucket name)"
          />
        </GridItem>

        <GridItem xs={12} sm={6}>
          <Field
            component={TextField}
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
            component={TextField}
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

        {/* Bucket Settings */}
        <GridItem xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" fontWeight="bold">
            Bucket Settings
          </Typography>
        </GridItem>

        <GridItem xs={12}>
          <Field
            component={TextField}
            name="s3.bucketName"
            label="Bucket Name"
            fullWidth
            variant="outlined"
            helperText="Must be globally unique, lowercase, no spaces, and only hyphens"
          />
        </GridItem>

        <GridItem xs={12}>
          <Paper 
            sx={{ 
              p: 2, 
              mt: 2, 
              display: 'flex', 
              flexDirection: 'column',
              gap: 2,
              bgcolor: '#f9f9f9'
            }}
          >
            <Box>
              <FormControlLabel
                control={
                  <Field
                    component={Switch}
                    type="checkbox"
                    name="s3.versioning"
                  />
                }
                label="Enable Versioning"
              />
              <FormHelperText>
                Keeps multiple versions of an object in the same bucket
              </FormHelperText>
            </Box>

            <Box>
              <FormControlLabel
                control={
                  <Field
                    component={Switch}
                    type="checkbox"
                    name="s3.encryption"
                  />
                }
                label="Enable Server-Side Encryption"
              />
              <FormHelperText>
                Encrypt data at rest using AES-256 encryption
              </FormHelperText>
            </Box>

            <Box>
              <FormControlLabel
                control={
                  <Field
                    component={Switch}
                    type="checkbox"
                    name="s3.publicAccess"
                  />
                }
                label="Block All Public Access"
                defaultChecked
              />
              <FormHelperText>
                Recommended for most use cases. Prevents any public access to bucket objects.
              </FormHelperText>
            </Box>
          </Paper>
        </GridItem>

        {/* Usage Examples */}
        <GridItem xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" fontWeight="bold">
            Common Usage Patterns
          </Typography>
        </GridItem>

        <GridItem xs={12}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Static Website Hosting
                </Typography>
                <Typography variant="body2">
                  Host static websites with HTML, CSS, and JavaScript. Requires disabling "Block All Public Access".
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Application Assets
                </Typography>
                <Typography variant="body2">
                  Store application assets like images, videos, and documents. Often used with CloudFront for caching.
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Data Backup
                </Typography>
                <Typography variant="body2">
                  Secure backup storage with versioning enabled and lifecycle policies to manage costs.
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </GridItem>

        {/* Security Notice */}
        <GridItem xs={12}>
          <Box sx={{ mt: 2, p: 2, bgcolor: '#fff9c4', borderRadius: 1 }}>
            <Typography variant="subtitle2" color="warning.dark">
              Security Note
            </Typography>
            <Typography variant="body2">
              S3 buckets with public access can expose sensitive data if not properly configured. 
              Unless you specifically need public access, keep "Block All Public Access" enabled.
            </Typography>
          </Box>
        </GridItem>
      </Grid>
    </Box>
  );
};

export default S3ConfigForm; 