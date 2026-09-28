import { t } from '../language'
import '../css/principal.css'

// El pie original pertenece al aside; se conserva su div y su ubicación.
export default function Footer() {
  return (
    <div className="sidebar-footer">
      <button className="btn-redeem">{t("Redeem Code")}</button>
      <a href="#" className="sidebar-link"><i className="fa-solid fa-headset"></i>{t(" Support")}</a>
      <a href="#" className="sidebar-link"><i className="fa-solid fa-download"></i>{t(" Downloads")}</a>
    </div>
  )
}
