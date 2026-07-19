// client/src/pages/faculty/components/StatusChip.jsx
//
// Reusable, generic status badge component for the CampusSphere ERP.
// Designed to be fully presentational and boundary-agnostic.
// Supports custom transparent 'glass' tints as well as standard 'filled' and 'outlined' looks.

import React from 'react';
import { Chip } from '@mui/material';

/**
 * Renders a standardized, parameterized status chip.
 * 
 * Props:
 *   label    - The text to display inside the chip
 *   color    - CSS/Hex color string (e.g. '#10b981')
 *   variant  - 'glass' | 'filled' | 'outlined' (default: 'glass')
 *   size     - 'small' | 'medium' (default: 'small')
 *   ...props - Any other native Material UI Chip props (e.g. onClick, icon, etc.)
 */
export const StatusChip = ({
  label,
  color = '#6b7280',
  variant = 'glass',
  size = 'small',
  ...props
}) => {
  // Determine sx styles dynamically based on selected variant
  const getVariantStyles = () => {
    switch (variant) {
      case 'filled':
        return {
          bgcolor: color,
          color: '#ffffff',
          border: 'none',
        };
      case 'outlined':
        return {
          bgcolor: 'transparent',
          color: color,
          border: `1.2px solid ${color}`,
        };
      case 'glass':
      default:
        return {
          bgcolor: `${color}12`, // 7% opacity backdrop tint
          color: color,
          border: `1.2px solid ${color}30`, // 18% opacity border
        };
    }
  };

  return (
    <Chip
      label={label}
      size={size}
      {...props}
      sx={{
        fontWeight: 700,
        fontSize: size === 'small' ? '0.7rem' : '0.78rem',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        borderRadius: '6px', // Sleeker layout than standard round pill chip
        height: size === 'small' ? 22 : 28,
        transition: 'all 0.2s ease-in-out',
        '& .MuiChip-label': {
          px: 1.2,
        },
        ...getVariantStyles(),
        ...props.sx, // Allow custom style overrides from calling templates
      }}
    />
  );
};

export default StatusChip;
