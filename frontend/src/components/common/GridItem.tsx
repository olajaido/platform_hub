// src/components/common/GridItem.tsx
import React from 'react';
import { Grid } from './GridWrapper';

interface GridItemProps {
  children: React.ReactNode;
  xs?: number | boolean;
  sm?: number | boolean;
  md?: number | boolean;
  lg?: number | boolean;
  xl?: number | boolean;
  [key: string]: any;
}

/**
 * GridItem is a wrapped Grid component that provides consistent spacing
 * and styling for form elements and content sections.
 */
export const GridItem: React.FC<GridItemProps> = (props) => {
  const { children, ...rest } = props;
  
  return (
    <Grid item={true} {...rest}>
      {children}
    </Grid>
  );
};