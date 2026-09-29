import emblem from '../assets/nexus-symbol.svg'
import '../css/brand.css'

export default function BrandLogo({ name = 'NEXUS GAMES' }) {
  return <span className="nexus-brand-lockup">
    <img className="nexus-brand-emblem" src={emblem} width="52" height="49" alt="" aria-hidden="true" />
    <span className="nexus-brand-name">{name}</span>
  </span>
}
