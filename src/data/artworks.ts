export interface Artwork {
  id: string
  description: string
  /** Two wide pieces are deliberately cropped among the portrait prints. */
  crop?: boolean
}

export const artworks: Artwork[] = [
  { id: '01', description: 'A drawing session on a tablet, caught between strokes.' },
  { id: '02', description: 'Two faces sketched in graphite on the same page.' },
  { id: '03', description: 'A colourful portrait in progress on a tablet.' },
  { id: '04', description: 'A violet figure takes shape on a bright screen.' },
  { id: '05', description: 'A warm-toned character drawing on a tablet.' },
  { id: '06', description: 'A pair of eyes drawn across a lined page.' },
  { id: '07', description: 'A portrait sketch on a tablet in soft daylight.' },
  { id: '08', description: 'A red-clad figure framed by pens and a sketchbook.' },
  { id: '09', description: 'A close portrait study in muted colour.' },
  { id: '10', description: 'A small flame painted against a dark screen.' },
  { id: '11', description: 'A face study lit by the glow of a laptop.' },
  { id: '12', description: 'A racing portrait drawn on a tablet.' },
  { id: '13', description: 'Eyes, clouds and shapes layered on black.', crop: true },
  { id: '14', description: 'A violet snake winding across a white page.', crop: true },
  { id: '15', description: 'A football portrait glowing on a dark screen.' },
  { id: '16', description: 'A character portrait on a tablet against blue fabric.' },
  { id: '17', description: 'A dark-haired portrait drawn on a tablet.' },
  { id: '18', description: 'A blue-clad figure on a tablet among green leaves.' },
  { id: '19', description: 'An older figure with a brush, drawn on a tablet.' },
  { id: '20', description: 'A portrait in warm light on a dark tablet.' },
]
