import React from 'react';
import { Box, Typography, Avatar, Chip, useTheme } from '@mui/material';
import { SchoolOutlined, QrCode2Outlined, VerifiedUserOutlined } from '@mui/icons-material';

/**
 * Procedural Barcode Generator Component (Code128 Simulated SVG)
 */
const BarcodeSvg = ({ value = 'CS-2026-0000', width = 160, height = 36 }) => {
  // Generate pseudo-deterministic bar pattern from value
  const bars = React.useMemo(() => {
    const chars = value.split('');
    const pattern = [2, 1, 3, 1, 1, 2]; // Start code
    chars.forEach((c) => {
      const code = c.charCodeAt(0);
      pattern.push((code % 3) + 1, ((code >> 1) % 2) + 1, ((code >> 2) % 3) + 1, 1);
    });
    pattern.push(2, 3, 1, 1, 1, 2); // Stop code
    return pattern;
  }, [value]);

  let x = 0;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${bars.reduce((a, b) => a + b, 0)} ${height}`} style={{ display: 'block' }}>
      {bars.map((barWidth, idx) => {
        const currentX = x;
        x += barWidth;
        if (idx % 2 === 0) {
          return <rect key={idx} x={currentX} y={0} width={barWidth} height={height} fill="#0f172a" />;
        }
        return null;
      })}
    </svg>
  );
};

/**
 * Metallic Smartcard RFID/EMV Chip Graphic
 */
const SmartCardChip = () => (
  <Box
    sx={{
      width: 38,
      height: 28,
      borderRadius: '5px',
      background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 50%, #b45309 100%)',
      border: '1px solid #92400e',
      boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.4), 0 1px 3px rgba(0,0,0,0.15)',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    {/* Internal chip line contacts */}
    <Box
      sx={{
        width: '100%',
        height: '1px',
        bgcolor: '#92400e',
        position: 'absolute',
        top: '50%',
      }}
    />
    <Box
      sx={{
        width: '1px',
        height: '100%',
        bgcolor: '#92400e',
        position: 'absolute',
        left: '38%',
      }}
    />
    <Box
      sx={{
        width: '1px',
        height: '100%',
        bgcolor: '#92400e',
        position: 'absolute',
        right: '38%',
      }}
    />
    <Box
      sx={{
        width: 14,
        height: 10,
        borderRadius: '3px',
        border: '1px solid #92400e',
        bgcolor: 'transparent',
      }}
    />
  </Box>
);

/**
 * Holographic Authenticity Seal
 */
const HolographicSeal = () => (
  <Box
    sx={{
      width: 36,
      height: 36,
      borderRadius: '50%',
      background: 'radial-gradient(circle, #fef08a 0%, #eab308 40%, #ca8a04 70%, #854d0e 100%)',
      border: '1.5px dashed rgba(255, 255, 255, 0.8)',
      boxShadow: '0 2px 8px rgba(202, 138, 4, 0.35)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#713f12',
      textAlign: 'center',
      p: 0.25,
      position: 'relative',
    }}
  >
    <VerifiedUserOutlined sx={{ fontSize: 16, color: '#713f12' }} />
    <Typography sx={{ fontSize: '0.35rem', fontWeight: 900, letterSpacing: '0.05em', lineHeight: 1 }}>
      GENUINE
    </Typography>
  </Box>
);

/**
 * CollegiateIdCard Component
 * Realistic ISO/IEC 7810 format Physical Student / Faculty Identity Card
 */
export const CollegiateIdCard = ({
  name = 'Aarav Mehta',
  rollNumber = '2026-CSE-104',
  role = 'STUDENT',
  department = 'Computer Science & Engineering',
  course = 'B.Tech',
  branch = 'CSE',
  semester = 1,
  email = 'student@campussphere.edu',
  bloodGroup = 'B+',
  validThrough = '2026 — 2030',
  collegeName = 'CAMPUS SPHERE UNIVERSITY',
  collegeLogo = null,
  photoUrl = null,
  id = 'collegiate-id-card',
}) => {
  const theme = useTheme();

  // Role color thematic styling
  const isStudent = role === 'STUDENT';
  const roleColor = isStudent ? '#4f46e5' : '#0d9488';
  const roleTitle = isStudent ? 'STUDENT IDENTITY PASS' : `${role} IDENTITY PASS`;

  return (
    <Box
      id={id}
      sx={{
        width: '100%',
        maxWidth: 330,
        bgcolor: '#ffffff',
        borderRadius: '18px',
        border: '1px solid #cbd5e1',
        boxShadow: '0 16px 36px -4px rgba(15, 23, 42, 0.16), 0 4px 12px rgba(0,0,0,0.06)',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        color: '#0f172a',
        mx: 'auto',
        userSelect: 'none',
        '@media print': {
          boxShadow: 'none',
          border: '1px solid #94a3b8',
          maxWidth: '3.375in',
          height: '5.375in',
          pageBreakInside: 'avoid',
          margin: 0,
        },
      }}
    >
      {/* ── 1. Top Lanyard Punch Slot Simulation ─────────────────────── */}
      <Box
        sx={{
          width: '100%',
          bgcolor: '#0f172a',
          pt: 1.25,
          pb: 0.75,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Box
          sx={{
            width: 44,
            height: 7,
            borderRadius: '4px',
            bgcolor: 'rgba(255, 255, 255, 0.18)',
            border: '1px solid rgba(0, 0, 0, 0.6)',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.7)',
          }}
        />
      </Box>

      {/* ── 2. Prestigious Institutional Header Ribbon ───────────────── */}
      <Box
        sx={{
          bgcolor: '#0f172a',
          background: 'linear-gradient(180deg, #0f172a 0%, #1e1b4b 100%)',
          color: '#ffffff',
          px: 2,
          pt: 0.5,
          pb: 1.75,
          textAlign: 'center',
          position: 'relative',
        }}
      >
        {/* Subtle background crest watermark */}
        <Box
          sx={{
            position: 'absolute',
            right: -10,
            bottom: -15,
            opacity: 0.08,
            pointerEvents: 'none',
          }}
        >
          <SchoolOutlined sx={{ fontSize: 90, color: '#ffffff' }} />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 0.5 }}>
          {collegeLogo ? (
            <Avatar
              src={collegeLogo}
              sx={{ width: 26, height: 26, border: '1px solid #fbbf24' }}
            />
          ) : (
            <Box
              sx={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                bgcolor: 'rgba(251, 191, 36, 0.2)',
                border: '1.5px solid #fbbf24',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <SchoolOutlined sx={{ fontSize: 15, color: '#fbbf24' }} />
            </Box>
          )}
          <Typography
            sx={{
              fontWeight: 900,
              fontSize: '0.82rem',
              letterSpacing: '0.06em',
              color: '#ffffff',
              lineHeight: 1.1,
              textTransform: 'uppercase',
            }}
          >
            {collegeName}
          </Typography>
        </Box>

        <Typography
          sx={{
            fontSize: '0.55rem',
            letterSpacing: '0.12em',
            color: '#fbbf24',
            fontWeight: 800,
            textTransform: 'uppercase',
          }}
        >
          ACCREDITED INSTITUTION • ESTD. 1998
        </Typography>

        {/* Gold Ribbon Divider */}
        <Box
          sx={{
            height: '3px',
            background: 'linear-gradient(90deg, #92400e 0%, #fbbf24 50%, #92400e 100%)',
            width: '100%',
            position: 'absolute',
            bottom: 0,
            left: 0,
          }}
        />
      </Box>

      {/* ── 3. Role Ribbon ───────────────────────────────────────────── */}
      <Box
        sx={{
          bgcolor: roleColor,
          color: '#ffffff',
          py: 0.5,
          px: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography
          sx={{
            fontSize: '0.62rem',
            fontWeight: 900,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          {roleTitle}
        </Typography>
        <Typography
          sx={{
            fontSize: '0.62rem',
            fontWeight: 800,
            fontFamily: theme.typography.mono?.fontFamily || 'monospace',
            letterSpacing: '0.04em',
          }}
        >
          VALID: {validThrough}
        </Typography>
      </Box>

      {/* ── 4. Main Body Card Canvas (Security guilloche textured) ───── */}
      <Box
        sx={{
          p: 2.25,
          background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
          position: 'relative',
        }}
      >
        {/* Subtle Security Background Watermark Pattern */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 170,
            height: 170,
            borderRadius: '50%',
            border: '8px double rgba(15, 23, 42, 0.03)',
            opacity: 0.6,
            pointerEvents: 'none',
          }}
        />

        {/* Photo & Chip Row */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          {/* Official Passport Photo Box with Official Corner Stamp */}
          <Box sx={{ position: 'relative' }}>
            <Box
              sx={{
                width: 90,
                height: 110,
                borderRadius: '8px',
                border: '2px solid #0f172a',
                bgcolor: '#e2e8f0',
                overflow: 'hidden',
                boxShadow: '0 4px 10px rgba(0,0,0,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {photoUrl ? (
                <Box
                  component="img"
                  src={photoUrl}
                  alt={name}
                  sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <Avatar
                  sx={{
                    width: '100%',
                    height: '100%',
                    borderRadius: 0,
                    bgcolor: '#1e293b',
                    color: '#f8fafc',
                    fontSize: '2.5rem',
                    fontWeight: 900,
                  }}
                >
                  {name ? name.charAt(0).toUpperCase() : 'S'}
                </Avatar>
              )}
            </Box>

            {/* Official Security Stamp Over Photo Edge */}
            <Box
              sx={{
                position: 'absolute',
                bottom: -8,
                right: -12,
                transform: 'rotate(-12deg)',
                border: '1.5px solid #dc2626',
                borderRadius: '4px',
                px: 0.6,
                py: 0.15,
                bgcolor: 'rgba(254, 226, 226, 0.95)',
                color: '#b91c1c',
                fontSize: '0.48rem',
                fontWeight: 900,
                letterSpacing: '0.06em',
                boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
              }}
            >
              ★ AUTHENTIC
            </Box>
          </Box>

          {/* Right Side: Smart Chip & Holographic Emblem */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1.5 }}>
            <SmartCardChip />
            <HolographicSeal />
            <Box sx={{ textAlign: 'right' }}>
              <Typography sx={{ fontSize: '0.52rem', color: '#64748b', fontWeight: 700 }}>
                BLOOD GROUP
              </Typography>
              <Chip
                label={bloodGroup}
                size="small"
                sx={{
                  bgcolor: '#fee2e2',
                  color: '#b91c1c',
                  fontWeight: 900,
                  fontSize: '0.68rem',
                  height: 20,
                  border: '1px solid #fca5a5',
                }}
              />
            </Box>
          </Box>
        </Box>

        {/* Name & Official Roll Number Badge */}
        <Box sx={{ textAlign: 'left', mb: 1.75 }}>
          <Typography
            sx={{
              fontWeight: 900,
              fontSize: '1.15rem',
              color: '#0f172a',
              letterSpacing: '-0.01em',
              lineHeight: 1.2,
            }}
          >
            {name}
          </Typography>

          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              bgcolor: '#f1f5f9',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              px: 1,
              py: 0.25,
              mt: 0.6,
            }}
          >
            <Typography
              sx={{
                fontFamily: theme.typography.mono?.fontFamily || 'monospace',
                fontSize: '0.78rem',
                fontWeight: 900,
                color: '#0f172a',
                letterSpacing: '0.04em',
              }}
            >
              ROLL NO: {rollNumber || 'UNASSIGNED'}
            </Typography>
          </Box>
        </Box>

        {/* Key Fields Grid Table */}
        <Box
          sx={{
            bgcolor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            p: 1.25,
            mb: 2,
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.02)',
          }}
        >
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
            <Box>
              <Typography sx={{ fontSize: '0.52rem', color: '#64748b', fontWeight: 800, letterSpacing: '0.05em' }}>
                PROGRAM / DEGREE
              </Typography>
              <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: '#0f172a' }}>
                {course || 'B.Tech'}
              </Typography>
            </Box>

            <Box>
              <Typography sx={{ fontSize: '0.52rem', color: '#64748b', fontWeight: 800, letterSpacing: '0.05em' }}>
                BRANCH
              </Typography>
              <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: '#0f172a' }}>
                {branch || 'General'}
              </Typography>
            </Box>

            <Box sx={{ gridColumn: 'span 2' }}>
              <Typography sx={{ fontSize: '0.52rem', color: '#64748b', fontWeight: 800, letterSpacing: '0.05em' }}>
                DEPARTMENT
              </Typography>
              <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {department || 'General Department'}
              </Typography>
            </Box>

            <Box>
              <Typography sx={{ fontSize: '0.52rem', color: '#64748b', fontWeight: 800, letterSpacing: '0.05em' }}>
                SEMESTER
              </Typography>
              <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: '#0f172a' }}>
                Semester {semester}
              </Typography>
            </Box>

            <Box>
              <Typography sx={{ fontSize: '0.52rem', color: '#64748b', fontWeight: 800, letterSpacing: '0.05em' }}>
                CARD STATUS
              </Typography>
              <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: '#16a34a' }}>
                Active &amp; Verified
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Signature & QR Code Strip */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 1.5 }}>
          {/* QR Code */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                p: 0.5,
                bgcolor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                display: 'flex',
              }}
            >
              <QrCode2Outlined sx={{ fontSize: 36, color: '#0f172a' }} />
            </Box>
            <Box sx={{ textAlign: 'left' }}>
              <Typography sx={{ fontSize: '0.5rem', fontWeight: 800, color: '#475569' }}>
                DIGITAL PASS
              </Typography>
              <Typography sx={{ fontSize: '0.45rem', color: '#94a3b8', maxWidth: 85, lineHeight: 1.1 }}>
                Scan to verify student enrollment records
              </Typography>
            </Box>
          </Box>

          {/* Registrar Signature */}
          <Box sx={{ textAlign: 'center', minWidth: 100 }}>
            <Typography
              sx={{
                fontFamily: "'Brush Script MT', 'Dancing Script', cursive, sans-serif",
                fontSize: '1.15rem',
                color: '#1e3a8a',
                lineHeight: 1,
                mb: 0.25,
                transform: 'rotate(-3deg)',
              }}
            >
              Dr. R. K. Sharma
            </Typography>
            <Box sx={{ height: '1px', bgcolor: '#64748b', width: '100%', mb: 0.25 }} />
            <Typography sx={{ fontSize: '0.48rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.04em' }}>
              REGISTRAR / DEAN
            </Typography>
          </Box>
        </Box>

        {/* Simulated Code128 Barcode Strip */}
        <Box
          sx={{
            pt: 1.25,
            borderTop: '1px dashed #cbd5e1',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 0.5,
          }}
        >
          <BarcodeSvg value={rollNumber || email || 'CAMPUS-SPHERE'} width={180} height={28} />
          <Typography
            sx={{
              fontFamily: theme.typography.mono?.fontFamily || 'monospace',
              fontSize: '0.62rem',
              fontWeight: 800,
              color: '#475569',
              letterSpacing: '0.12em',
            }}
          >
            *{rollNumber || 'CS-PASS-2026'}*
          </Typography>
        </Box>
      </Box>

      {/* ── 5. Bottom Magnetic Stripe Security Footer ─────────────────── */}
      <Box
        sx={{
          bgcolor: '#0f172a',
          color: 'rgba(255, 255, 255, 0.7)',
          py: 0.75,
          px: 2,
          textAlign: 'center',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Typography sx={{ fontSize: '0.52rem', letterSpacing: '0.04em' }}>
          Property of {collegeName} • If found, please return to Dean&apos;s Office
        </Typography>
      </Box>
    </Box>
  );
};

export default CollegiateIdCard;
