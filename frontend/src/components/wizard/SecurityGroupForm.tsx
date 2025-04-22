import React, { useState } from 'react';
import { useFormikContext, FieldArray, Field } from 'formik';
import { 
  Box, 
  Typography, 
  Divider,
  Paper,
  Button,
  IconButton,
  MenuItem,
  Select as MuiSelect,
  FormHelperText,
  InputLabel,
  FormControl,
  SelectChangeEvent
} from '@mui/material';
import { Grid } from '../common/GridWrapper';
import { GridItem } from '../common/GridItem';
import { 
  TextField,
  Select 
} from 'formik-mui';
import { Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { initialCommonRules } from './securityGroupPresets';

// Protocol options
const protocols = [
  { value: 'tcp', label: 'TCP' },
  { value: 'udp', label: 'UDP' },
  { value: 'icmp', label: 'ICMP' },
];

// Common port presets
const portPresets = [
  { name: 'SSH', protocol: 'tcp', fromPort: 22, toPort: 22, cidrBlock: '0.0.0.0/0', description: 'SSH access' },
  { name: 'HTTP', protocol: 'tcp', fromPort: 80, toPort: 80, cidrBlock: '0.0.0.0/0', description: 'HTTP access' },
  { name: 'HTTPS', protocol: 'tcp', fromPort: 443, toPort: 443, cidrBlock: '0.0.0.0/0', description: 'HTTPS access' },
  { name: 'MySQL', protocol: 'tcp', fromPort: 3306, toPort: 3306, cidrBlock: '10.0.0.0/16', description: 'MySQL access' },
  { name: 'PostgreSQL', protocol: 'tcp', fromPort: 5432, toPort: 5432, cidrBlock: '10.0.0.0/16', description: 'PostgreSQL access' },
  { name: 'RDP', protocol: 'tcp', fromPort: 3389, toPort: 3389, cidrBlock: '0.0.0.0/0', description: 'RDP access' },
];

const SecurityGroupForm: React.FC = () => {
  const { values, setFieldValue } = useFormikContext<any>();
  const [selectedPreset, setSelectedPreset] = useState<string>('');

  // Create a name for the security group if not already set
  React.useEffect(() => {
    if (!values.securityGroup.name) {
      setFieldValue('securityGroup.name', `${values.name}-sg`);
    }
  }, [values.name, values.securityGroup.name, setFieldValue]);

  const handlePresetChange = (event: SelectChangeEvent<string>) => {
    setSelectedPreset(event.target.value);
  };

  const handleAddPreset = () => {
    if (!selectedPreset) return;
    
    const preset = portPresets.find(p => p.name === selectedPreset);
    if (!preset) return;
    
    // Add the preset to ingress rules
    setFieldValue('securityGroup.ingressRules', [
      ...values.securityGroup.ingressRules,
      {
        protocol: preset.protocol,
        fromPort: preset.fromPort,
        toPort: preset.toPort,
        cidrBlock: preset.cidrBlock,
        description: preset.description
      }
    ]);
    
    // Reset selected preset
    setSelectedPreset('');
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Security Group Configuration
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Configure network access rules for your resource.
      </Typography>

      <Grid container spacing={3}>
        {/* Basic Information */}
        <GridItem xs={12}>
          <Typography variant="subtitle1" fontWeight="bold">
            Basic Information
          </Typography>
        </GridItem>

        <GridItem xs={12} sm={6}>
          <Field
            component={TextField}
            name="securityGroup.name"
            label="Security Group Name"
            fullWidth
            variant="outlined"
          />
        </GridItem>

        <GridItem xs={12} sm={6}>
          <Field
            component={TextField}
            name="securityGroup.description"
            label="Description"
            fullWidth
            variant="outlined"
          />
        </GridItem>

        {/* Ingress Rules */}
        <GridItem xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" fontWeight="bold">
            Inbound Rules
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Define which traffic is allowed to reach your instance.
          </Typography>
        </GridItem>

        {/* Preset selector */}
        <GridItem xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box sx={{ flexGrow: 1, mr: 2 }}>
              <MuiSelect
                value={selectedPreset}
                onChange={handlePresetChange}
                label="Add Common Rule"
                fullWidth
                variant="outlined"
                displayEmpty
              >
                <MenuItem value="" disabled>
                  <em>Select a preset rule</em>
                </MenuItem>
                {portPresets.map(preset => (
                  <MenuItem key={preset.name} value={preset.name}>
                    {preset.name} ({preset.protocol.toUpperCase()}: {preset.fromPort === preset.toPort ? preset.fromPort : `${preset.fromPort}-${preset.toPort}`})
                  </MenuItem>
                ))}
              </MuiSelect>
            </Box>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddPreset}
              disabled={!selectedPreset}
            >
              Add
            </Button>
          </Box>
        </GridItem>

        {/* Rules list */}
        <GridItem xs={12}>
          <FieldArray name="securityGroup.ingressRules">
            {({ remove, push }) => (
              <Box>
                {values.securityGroup.ingressRules.length > 0 ? (
                  values.securityGroup.ingressRules.map((rule: any, index: number) => (
                    <Paper 
                      key={index} 
                      elevation={1}
                      sx={{ 
                        p: 2, 
                        mb: 2, 
                        display: 'flex', 
                        alignItems: 'center',
                        border: '1px solid #e0e0e0'
                      }}
                    >
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={2}>
                          <Field
                            component={MuiSelect}
                            name={`securityGroup.ingressRules.${index}.protocol`}
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
                        </Grid>
                        
                        <Grid item xs={6} sm={2}>
                          <Field
                            component={TextField}
                            type="number"
                            name={`securityGroup.ingressRules.${index}.fromPort`}
                            label="From Port"
                            fullWidth
                            variant="outlined"
                          />
                        </Grid>
                        
                        <Grid item xs={6} sm={2}>
                          <Field
                            component={TextField}
                            type="number"
                            name={`securityGroup.ingressRules.${index}.toPort`}
                            label="To Port"
                            fullWidth
                            variant="outlined"
                          />
                        </Grid>
                        
                        <Grid item xs={12} sm={3}>
                          <Field
                            component={TextField}
                            name={`securityGroup.ingressRules.${index}.cidrBlock`}
                            label="CIDR Block"
                            fullWidth
                            variant="outlined"
                          />
                        </Grid>
                        
                        <Grid item xs={10} sm={2}>
                          <Field
                            component={TextField}
                            name={`securityGroup.ingressRules.${index}.description`}
                            label="Description"
                            fullWidth
                            variant="outlined"
                          />
                        </Grid>
                        
                        <Grid item xs={2} sm={1}>
                          <IconButton 
                            aria-label="delete" 
                            onClick={() => remove(index)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Grid>
                      </Grid>
                    </Paper>
                  ))
                ) : (
                  <Typography color="text.secondary">
                    No rules defined. Add a common rule or create a custom one.
                  </Typography>
                )}
                
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => push({
                    protocol: 'tcp',
                    fromPort: '',
                    toPort: '',
                    cidrBlock: '0.0.0.0/0',
                    description: ''
                  })}
                  sx={{ mt: 2 }}
                >
                  Add Custom Rule
                </Button>
              </Box>
            )}
          </FieldArray>
        </GridItem>

        {/* Helper information */}
        <GridItem xs={12}>
          <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Security Best Practices
            </Typography>
            <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
              <li>Restrict SSH access (port 22) to specific IP addresses when possible</li>
              <li>Use security groups to restrict database access to your application servers only</li>
              <li>Avoid using 0.0.0.0/0 (anywhere) for sensitive services</li>
            </Typography>
          </Box>
        </GridItem>
      </Grid>
    </Box>
  );
};

export default SecurityGroupForm; 