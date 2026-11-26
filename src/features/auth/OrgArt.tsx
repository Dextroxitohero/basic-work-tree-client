/** Marca: un nodo con dos reportes. Dibujada, no un icono genérico. */
export function OrgMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" className={className} fill="none" aria-hidden>
      <rect width="28" height="28" rx="7" className="fill-primary" />
      <circle cx="14" cy="9" r="2.6" fill="white" />
      <path d="M14 11.6v3.4M8.5 18.5v-1.7a1.8 1.8 0 0 1 1.8-1.8h7.4a1.8 1.8 0 0 1 1.8 1.8v1.7" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="8.5" cy="20.5" r="2" fill="white" />
      <circle cx="19.5" cy="20.5" r="2" fill="white" />
    </svg>
  )
}

/** Organigrama ilustrativo con datos sintéticos, solo decorativo. */
export function OrgTreeArt({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  const line = { stroke: 'white', strokeOpacity: 0.3, strokeWidth: 1.5, fill: 'none' } as const
  const person = (x: number, y: number, w: number, ini: string, name: string, role: string, o: number) => (
    <g key={ini + x} opacity={o}>
      <rect x={x} y={y} width={w} height={52} rx={10} fill="white" fillOpacity={0.13} stroke="white" strokeOpacity={0.4} />
      <circle cx={x + 26} cy={y + 26} r={14} fill="white" fillOpacity={0.9} />
      <text x={x + 26} y={y + 30.5} textAnchor="middle" fontSize={11} fontWeight={600} fill="oklch(0.34 0.08 170)">{ini}</text>
      <text x={x + 49} y={y + 22} fontSize={13} fontWeight={600} fill="white">{name}</text>
      <text x={x + 49} y={y + 38} fontSize={11.5} fill="white" fillOpacity={0.78}>{role}</text>
    </g>
  )
  return (
    <svg viewBox="0 0 760 330" className={className} fill="none" role="presentation" {...props}>
      <path d="M380 52v36M150 88h460M150 88v34M380 88v34M610 88v34" {...line} />
      <path d="M150 174v34M85 208h130M85 208v34M215 208v34" {...line} />
      <path d="M610 174v34M545 208h130M545 208v34M675 208v34" {...line} />
      {person(300, 0, 160, 'LF', 'Lucía F.', 'Directora', 1)}
      {person(70, 122, 160, 'MG', 'Mateo G.', 'Ingeniería', 0.95)}
      {person(300, 122, 160, 'VO', 'Valentina O.', 'RR. HH.', 0.95)}
      {person(530, 122, 160, 'AM', 'Andrés M.', 'Finanzas', 0.95)}
      {person(15, 242, 140, 'CT', 'Camila T.', 'Desarrollo', 0.85)}
      {person(145, 242, 140, 'SR', 'Sofía R.', 'Talento', 0.85)}
      {person(475, 242, 140, 'DH', 'Diego H.', 'Contador', 0.85)}
      {person(605, 242, 140, 'IR', 'Isabella R.', 'Nómina', 0.85)}
    </svg>
  )
}
