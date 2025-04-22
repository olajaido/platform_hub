import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Alert
} from '@mui/material';
import { Grid } from '../common/GridWrapper';

interface ResourceReviewProps {
  values: any;
}

const ResourceReview: React.FC<ResourceReviewProps> = ({ values }) => {
  // Function to render resource-specific details
  const renderResourceDetails = () => {
    switch (values.resourceType) {
      case 'ec2_instance':
        return renderEC2Details();
      case 's3_bucket':
        return renderS3Details();
      case 'rds_instance':
        return renderRDSDetails();
      case 'ecs_service':
        return renderECSDetails();
      default:
        return <Typography>No resource type selected</Typography>;
    }
  };

  // Render EC2 instance details
  const renderEC2Details = () => (
    <>
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" fontWeight="bold">
          EC2 Instance Details
        </Typography>
        <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Instance Type
              </Typography>
              <Typography variant="body1">
                {values.ec2.instanceType}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                AMI
              </Typography>
              <Typography variant="body1">
                {values.ec2.ami}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Root Volume Size
              </Typography>
              <Typography variant="body1">
                {values.ec2.volumeSize} GB
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Elastic IP
              </Typography>
              <Typography variant="body1">
                {values.ec2.assignEip ? 'Yes' : 'No'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Subnet
              </Typography>
              <Typography variant="body1">
                {values.ec2.subnetId}
              </Typography>
            </Grid>
            {values.ec2.userData && (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  User Data Script
                </Typography>
                <Paper 
                  sx={{ 
                    p: 1, 
                    mt: 1, 
                    bgcolor: '#f5f5f5', 
                    maxHeight: '100px',
                    overflow: 'auto',
                    fontFamily: 'monospace',
                    fontSize: '0.8rem'
                  }}
                >
                  {values.ec2.userData}
                </Paper>
              </Grid>
            )}
          </Grid>
        </Paper>
      </Box>

      {/* RDS Connection */}
      {values.dependencies.connectToRds && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Database Connection
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
            <Typography>
              Will connect to RDS Security Group: {values.dependencies.rdsSecurityGroupId}
            </Typography>
          </Paper>
        </Box>
      )}
    </>
  );

  // Render S3 bucket details
  const renderS3Details = () => (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle1" fontWeight="bold">
        S3 Bucket Details
      </Typography>
      <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">
              Bucket Name
            </Typography>
            <Typography variant="body1">
              {values.s3.bucketName}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="body2" color="text.secondary">
              Versioning
            </Typography>
            <Typography variant="body1">
              {values.s3.versioning ? 'Enabled' : 'Disabled'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="body2" color="text.secondary">
              Server-Side Encryption
            </Typography>
            <Typography variant="body1">
              {values.s3.encryption ? 'Enabled' : 'Disabled'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="body2" color="text.secondary">
              Block Public Access
            </Typography>
            <Typography variant="body1">
              {values.s3.publicAccess ? 'Enabled' : 'Disabled'}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );

  // Render RDS instance details
  const renderRDSDetails = () => (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle1" fontWeight="bold">
        RDS Database Details
      </Typography>
      <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Engine
            </Typography>
            <Typography variant="body1">
              {values.rds.engine} {values.rds.engineVersion}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Instance Class
            </Typography>
            <Typography variant="body1">
              {values.rds.instanceClass}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Storage
            </Typography>
            <Typography variant="body1">
              {values.rds.allocatedStorage} GB
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Multi-AZ
            </Typography>
            <Typography variant="body1">
              {values.rds.multiAZ ? 'Yes' : 'No'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Database Name
            </Typography>
            <Typography variant="body1">
              {values.rds.databaseName}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Master Username
            </Typography>
            <Typography variant="body1">
              {values.rds.masterUsername}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );

  // Render ECS service details
  const renderECSDetails = () => (
    <>
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" fontWeight="bold">
          ECS Service Details
        </Typography>
        <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Cluster Name
              </Typography>
              <Typography variant="body1">
                {values.ecs.clusterName}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Service Name
              </Typography>
              <Typography variant="body1">
                {values.ecs.serviceName}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Launch Type
              </Typography>
              <Typography variant="body1">
                {values.ecs.launchType}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Desired Count
              </Typography>
              <Typography variant="body1">
                {values.ecs.desiredCount}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                CPU / Memory
              </Typography>
              <Typography variant="body1">
                {values.ecs.cpu} CPU units / {values.ecs.memory} MB
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Container Port
              </Typography>
              <Typography variant="body1">
                {values.ecs.containerPort}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                Container Image
              </Typography>
              <Typography variant="body1">
                {values.ecs.imageUrl}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Box>

      {/* ALB Configuration */}
      {values.dependencies.frontWithAlb && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Load Balancer Configuration
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  ALB Name
                </Typography>
                <Typography variant="body1">
                  {values.alb.name}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Scheme
                </Typography>
                <Typography variant="body1">
                  {values.alb.internal ? 'Internal' : 'Internet-facing'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Target Port
                </Typography>
                <Typography variant="body1">
                  {values.alb.targetPort}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Health Check Path
                </Typography>
                <Typography variant="body1">
                  {values.alb.healthCheckPath}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Box>
      )}
    </>
  );

  // Render security group details
  const renderSecurityGroupDetails = () => {
    if (!values.securityGroup || values.resourceType === 's3_bucket') {
      return null;
    }

    return (
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" fontWeight="bold">
          Security Group Configuration
        </Typography>
        <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                Security Group Name
              </Typography>
              <Typography variant="body1">
                {values.securityGroup.name}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                Description
              </Typography>
              <Typography variant="body1">
                {values.securityGroup.description}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Inbound Rules
              </Typography>
              {values.securityGroup.ingressRules.length > 0 ? (
                <List dense disablePadding>
                  {values.securityGroup.ingressRules.map((rule: any, index: number) => (
                    <ListItem 
                      key={index} 
                      disablePadding 
                      sx={{ 
                        py: 0.5, 
                        borderBottom: index < values.securityGroup.ingressRules.length - 1 ? '1px solid #eee' : 'none'
                      }}
                    >
                      <ListItemText
                        primary={`${rule.protocol.toUpperCase()}: ${rule.fromPort} - ${rule.toPort}`}
                        secondary={`${rule.cidrBlock} (${rule.description || 'No description'})`}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body1">No inbound rules defined</Typography>
              )}
            </Grid>
          </Grid>
        </Paper>
      </Box>
    );
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Review Configuration
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Please review your resource configuration before submitting.
      </Typography>

      {/* Basic Information */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" fontWeight="bold">
          Basic Information
        </Typography>
        <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Resource Type
              </Typography>
              <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                {values.resourceType.replace('_', ' ')}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Name
              </Typography>
              <Typography variant="body1">
                {values.name}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Environment
              </Typography>
              <Chip 
                label={values.environment} 
                color={
                  values.environment === 'prod' ? 'error' : 
                  values.environment === 'staging' ? 'warning' : 
                  values.environment === 'test' ? 'info' : 'success'
                }
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Region
              </Typography>
              <Typography variant="body1">
                {values.region}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Resource specific details */}
      {renderResourceDetails()}

      {/* Security Group */}
      {renderSecurityGroupDetails()}

      {/* Notes/Warnings based on configuration */}
      <Box sx={{ mt: 4 }}>
        {values.resourceType === 'ec2_instance' && !values.securityGroup.ingressRules.some(
          (rule: any) => rule.protocol === 'tcp' && rule.fromPort <= 22 && rule.toPort >= 22
        ) && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            No SSH access (port 22) has been configured. You may not be able to connect to this instance directly.
          </Alert>
        )}
        
        {values.resourceType === 's3_bucket' && !values.s3.publicAccess && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Public access to this bucket is not blocked. Consider enabling "Block All Public Access" for sensitive data.
          </Alert>
        )}
        
        {values.resourceType === 'rds_instance' && values.environment === 'prod' && !values.rds.multiAZ && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Consider enabling Multi-AZ deployment for production databases to improve availability.
          </Alert>
        )}
      </Box>
    </Box>
  );
};

export default ResourceReview; 