export default function RopeArt() {
  return <svg className="rope-art" viewBox="0 0 580 470" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id="rope-blue" x1="90" y1="100" x2="470" y2="400" gradientUnits="userSpaceOnUse"><stop stopColor="#90bafc"/><stop offset=".25" stopColor="#1674ef"/><stop offset=".5" stopColor="#0042ac"/><stop offset=".72" stopColor="#3f93fb"/><stop offset="1" stopColor="#0866da"/></linearGradient>
      <linearGradient id="handle-blue"><stop stopColor="#052d69"/><stop offset=".38" stopColor="#2776d3"/><stop offset=".62" stopColor="#0958b6"/><stop offset="1" stopColor="#003a86"/></linearGradient>
      <filter id="rope-shadow" x="-40%" y="-40%" width="180%" height="200%"><feDropShadow dx="4" dy="14" stdDeviation="10" floodColor="#145bba" floodOpacity=".19"/></filter>
      <radialGradient id="floor"><stop stopColor="#b0c8e9" stopOpacity=".4"/><stop offset="1" stopColor="#b0c8e9" stopOpacity="0"/></radialGradient>
    </defs>
    <ellipse cx="300" cy="422" rx="222" ry="33" fill="url(#floor)"/>
    <g filter="url(#rope-shadow)">
      <path d="M163 335C43 206 107 53 244 59C388 65 497 266 395 358C311 433 171 350 213 249C251 159 360 181 429 130" stroke="url(#rope-blue)" strokeWidth="13" strokeLinecap="round"/>
      <path d="M163 333C43 204 107 51 244 57C388 63 497 264 395 356C311 431 171 348 213 247C251 157 360 179 429 128" stroke="white" strokeOpacity=".29" strokeWidth="2" strokeLinecap="round"/>
      <g transform="translate(163 335) rotate(-43)"><rect x="-12" y="-2" width="24" height="101" rx="11" fill="url(#handle-blue)"/><rect x="-10" y="1" width="20" height="10" rx="4" fill="#74a6e5"/><path d="M-6 21V82" stroke="#a2c7ff" strokeWidth="2" strokeOpacity=".35"/><path d="M-9 88H9" stroke="#00265e" strokeWidth="2"/></g>
      <g transform="translate(429 130) rotate(-132)"><rect x="-12" y="-1" width="24" height="101" rx="11" fill="url(#handle-blue)"/><rect x="-10" y="1" width="20" height="10" rx="4" fill="#74a6e5"/><path d="M-6 21V82" stroke="#a2c7ff" strokeWidth="2" strokeOpacity=".35"/><path d="M-9 88H9" stroke="#00265e" strokeWidth="2"/></g>
    </g>
  </svg>;
}
