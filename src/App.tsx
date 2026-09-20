import { useCallback, useState } from 'react'

import './styles/tokens.css'
import './styles/base.css'

import About from './components/About'
import ArtTable from './components/ArtTable'
import ArtworkViewer from './components/ArtworkViewer'
import Contact from './components/Contact'
import IdentityHero from './components/IdentityHero'
import Nav from './components/Nav'
import Pointer from './components/Pointer'
import LoadingScreen from './components/LoadingScreen'
import PhotoGallery from './components/PhotoGallery'
import ProjectIndex from './components/ProjectIndex'
import SmoothScroll from './components/SmoothScroll'
import { useReveal } from './hooks/useReveal'

export default function App() {
  const [artwork, setArtwork] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const finishLoading = useCallback(() => setLoading(false), [])
  useReveal()

  return (
    <>
      {loading && <LoadingScreen onComplete={finishLoading} />}
      {!loading && <SmoothScroll />}
      <div className="app-content" inert={loading} aria-hidden={loading || undefined}>
      <Nav />

      <main>
        <IdentityHero />
        <ProjectIndex />
        <ArtTable onOpen={setArtwork} />
        <PhotoGallery />
        <About />
      </main>

      <Contact />

      <Pointer />

      <ArtworkViewer
        index={artwork}
        onChange={setArtwork}
        onClose={() => setArtwork(null)}
      />
      </div>
    </>
  )
}
