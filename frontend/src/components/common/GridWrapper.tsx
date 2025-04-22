import React from 'react';
import { Grid as MuiGrid, Box } from '@mui/material';

interface GridWrapperProps {
  children: React.ReactNode;
  item?: boolean;
  container?: boolean;
  xs?: number | boolean;
  sm?: number | boolean;
  md?: number | boolean;
  lg?: number | boolean;
  xl?: number | boolean;
  spacing?: number;
  alignItems?: string;
  [key: string]: any;
}

/**
 * GridWrapper is a compatibility wrapper for MUI v7 Grid component
 * that handles the API changes between versions.
 */
export const Grid: React.FC<GridWrapperProps> = (props) => {
  const { children, item, container, ...rest } = props;
  
  // MUI v7 doesn't use item/container props directly
  // Instead we'll use Box with appropriate styles for compatibility
  if (item) {
    return (
      <Box 
        sx={{ 
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 0,
          maxWidth: rest.xs === 12 ? '100%' : 
                   rest.xs === 6 ? '50%' : 
                   rest.xs === 4 ? '33.33%' : 
                   rest.xs === 3 ? '25%' : 
                   rest.xs === 2 ? '16.67%' : 
                   rest.xs === 1 ? '8.33%' : 'auto',
          flexBasis: rest.xs === 12 ? '100%' : 
                   rest.xs === 6 ? '50%' : 
                   rest.xs === 4 ? '33.33%' : 
                   rest.xs === 3 ? '25%' : 
                   rest.xs === 2 ? '16.67%' : 
                   rest.xs === 1 ? '8.33%' : 'auto',
          padding: '12px',
          ...rest.sx
        }}
        {...rest}
      >
        {children}
      </Box>
    );
  } else if (container) {
    return (
      <Box 
        sx={{ 
          display: 'flex',
          flexWrap: 'wrap',
          width: '100%',
          margin: `-12px`,
          ...rest.sx
        }}
        {...rest}
      >
        {children}
      </Box>
    );
  } else {
    // Regular MUI Grid - no item/container needed
    return (
      <MuiGrid 
        component="div"
        {...rest}
      >
        {children}
      </MuiGrid>
    );
  }
}; 