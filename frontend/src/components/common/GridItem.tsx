// src/components/common/GridItem.tsx
import React from 'react';
import { Grid } from '@mui/material';
import apiClient from '../../api';

// This tells TypeScript to trust us and ignore type checking for this component
interface GridItemProps {
  children: React.ReactNode;
  xs?: number | boolean;
  sm?: number | boolean;
  md?: number | boolean;
  lg?: number | boolean;
  xl?: number | boolean;
  [key: string]: any; // Allow any other props
}

export const GridItem: React.FC<GridItemProps> = ({
  children,
  xs,
  sm,
  md,
  lg,
  xl,
  ...rest
}) => {
  // Type assertion to bypass TypeScript's checks
  const gridProps = {
    item: true,
    xs,
    sm,
    md,
    lg,
    xl,
    ...rest
  } as any;
  
  return <Grid {...gridProps}>{children}</Grid>;
};