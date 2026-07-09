type LogoProps = {
  variant?: 'light' | 'dark'
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
}

export default function Logo({ variant = 'light', size = 'md', showText = true }: LogoProps) {
  const iconSize = size === 'sm' ? 32 : size === 'lg' ? 48 : 40
  const textColor = variant === 'light' ? '#fff' : '#0c2461'
  const subColor = '#e8a020'

  return (
    <div className="flex items-center gap-2.5 select-none">
      {/* Icon mark */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="sds-bg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#071640" />
            <stop offset="100%" stopColor="#1e3a8a" />
          </linearGradient>
          <linearGradient id="sds-gold" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#e8a020" />
          </linearGradient>
        </defs>

        {/* Background rounded square */}
        <rect width="48" height="48" rx="12" fill="url(#sds-bg)" />

        {/* Shield shape */}
        <path
          d="M24 8L11 14v11c0 8.5 6 14.5 13 16 7-1.5 13-7.5 13-16V14L24 8z"
          fill="rgba(255,255,255,0.07)"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1"
        />

        {/* Gold coin ring */}
        <circle cx="24" cy="24" r="9" stroke="url(#sds-gold)" strokeWidth="1.8" fill="none" />

        {/* Center Rp text */}
        <text
          x="24"
          y="29"
          textAnchor="middle"
          fill="#fbbf24"
          fontSize="10"
          fontWeight="800"
          fontFamily="system-ui, sans-serif"
          letterSpacing="-0.5"
        >
          Rp
        </text>

        {/* Gold sparkle dot top-right */}
        <circle cx="34" cy="13" r="2.5" fill="url(#sds-gold)" />
        <circle cx="34" cy="13" r="1" fill="#fff" />
      </svg>

      {showText && (
        <div className="leading-none">
          <div
            style={{
              color: textColor,
              fontFamily: 'DM Serif Display, serif',
              fontWeight: 700,
              fontSize: size === 'sm' ? '0.875rem' : size === 'lg' ? '1.25rem' : '1rem',
              lineHeight: 1.15,
              letterSpacing: '-0.01em',
            }}
          >
            Solusi Dana
          </div>
          <div
            style={{
              color: subColor,
              fontSize: size === 'sm' ? '0.5rem' : '0.6rem',
              fontWeight: 800,
              letterSpacing: '0.18em',
              lineHeight: 1.2,
              marginTop: 1,
            }}
          >
            SAHABAT
          </div>
        </div>
      )}
    </div>
  )
}
