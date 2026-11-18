import { Box } from '@mui/material';

interface ApexLogoProps {
  size?: number;
  primaryColor?: string;
}

/**
 * Logo oficial vectorial de APEX ERP (reemplaza el ícono genérico de casa).
 */
export function ApexLogo({ size = 36, primaryColor = '#2563eb' }: ApexLogoProps) {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: '11px',
        background: `linear-gradient(135deg, ${primaryColor} 0%, #1e3a8a 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: `0 4px 14px ${primaryColor}44`,
        flexShrink: 0,
        p: 0.6,
      }}
    >
      <svg viewBox="0 0 64 64" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M32 8L10 52H21.5L26.2 42H37.8L42.5 52H54L32 8ZM29.5 34L32 27.5L34.5 34H29.5Z"
          fill="#FFFFFF"
        />
        <circle cx="50" cy="15" r="5.5" fill="#38BDF8" />
      </svg>
    </Box>
  );
}

