import React from 'react';
import { useFormikContext } from 'formik';
import {
  Typography,
  Box,
  Card,
  CardContent,
  CardActionArea,
} from '@mui/material';
import { Grid } from '../common/GridWrapper';

// Icons would be imported here
// For now using placeholder URLs
const resourceTypes = [
  {
    id: 'ec2_instance',
    name: 'EC2 Instance',
    description: 'Virtual servers in the cloud',
    icon: 'https://cdn-icons-png.flaticon.com/512/5769/5769197.png',
  },
  {
    id: 's3_bucket',
    name: 'S3 Bucket',
    description: 'Scalable object storage',
    icon: 'https://cdn-icons-png.flaticon.com/512/5769/5769169.png',
  },
  {
    id: 'rds_instance',
    name: 'RDS Database',
    description: 'Managed relational database service',
    icon: 'https://cdn-icons-png.flaticon.com/512/5769/5769213.png',
  },
  {
    id: 'ecs_service',
    name: 'ECS Service',
    description: 'Managed container service',
    icon: 'https://cdn-icons-png.flaticon.com/512/5769/5769217.png',
  },
];

const ResourceTypeSelection: React.FC = () => {
  const { values, setFieldValue } = useFormikContext<any>();

  const handleSelectResource = (resourceId: string) => {
    setFieldValue('resourceType', resourceId);
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h5" gutterBottom>
        Select Resource Type
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Choose the type of infrastructure resource you want to provision.
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {resourceTypes.map((resource) => (
          <Grid item xs={12} sm={6} key={resource.id}>
            <Card 
              elevation={values.resourceType === resource.id ? 8 : 1}
              sx={{ 
                border: values.resourceType === resource.id ? '2px solid #3f51b5' : 'none',
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <CardActionArea 
                onClick={() => handleSelectResource(resource.id)}
                sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
              >
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center', width: '100%' }}>
                  <Box sx={{ pr: 2 }}>
                    <img 
                      src={resource.icon} 
                      alt={resource.name} 
                      style={{ width: 48, height: 48 }} 
                    />
                  </Box>
                  <Box>
                    <Typography gutterBottom variant="h6" component="div">
                      {resource.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {resource.description}
                    </Typography>
                  </Box>
                </Box>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ResourceTypeSelection; 