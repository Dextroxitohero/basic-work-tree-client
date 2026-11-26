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
  const line = { stroke: 'white', strokeOpacity: 0.32, strokeWidth: 1.5, fill: 'none' } as const
  const person = (x: number, y: number, w: number, ini: string, name: string, role: string, o: number) => (
    <g key={ini + x} opacity={o}>
      <rect x={x} y={y} width={w} height={52} rx={12} fill="white" fillOpacity={0.14} stroke="white" strokeOpacity={0.42} />
      <circle cx={x + 26} cy={y + 26} r={15} fill="white" fillOpacity={0.92} />
      <text x={x + 26} y={y + 30.5} textAnchor="middle" fontSize={11} fontWeight={600} fill="oklch(0.28 0.14 268)">{ini}</text>
      <text x={x + 49} y={y + 22} fontSize={13} fontWeight={600} fill="white">{name}</text>
      <text x={x + 49} y={y + 39} fontSize={11.5} fill="white" fillOpacity={0.78}>{role}</text>
    </g>
  )
  return (
    <svg viewBox="0 0 400 300" className={className} fill="none" role="presentation" {...props}>
      <path d="M230 52v28M130 80h200M130 80v28M330 80v28" {...line} />
      <path d="M130 160v28M60 188h130M60 188v28M190 188v28" {...line} />
      <path d="M330 160v56" {...line} />
      {person(160, 0, 140, 'LF', 'Lucía F.', 'Directora', 1)}
      {person(65, 108, 130, 'MG', 'Mateo G.', 'Ingeniería', 0.95)}
      {person(265, 108, 130, 'AM', 'Andrés M.', 'Finanzas', 0.95)}
      {person(0, 216, 120, 'CT', 'Camila T.', 'Desarrollo', 0.85)}
      {person(130, 216, 120, 'SR', 'Sofía R.', 'Talento', 0.85)}
      {person(270, 216, 120, 'DH', 'Diego H.', 'Contador', 0.85)}
    </svg>
  )
}
