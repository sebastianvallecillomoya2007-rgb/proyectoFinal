import { t, getLocale } from '../language'
import { useEffect, useRef, useState } from 'react'
import { api } from '../auth/api'
import GameImage from '../components/GameImage'
import ProfileImageEditor from '../components/ProfileImageEditor'
import ProfilePhotoMenu from '../components/ProfilePhotoMenu'
import { prepareProfileImage } from '../service/profileImage'
import '../css/profile.css'

const formatHours = value => new Intl.NumberFormat(getLocale(), { maximumFractionDigits: 1 }).format(value)
function Avatar({ name, src }) {
  return src ? <img className="profile-avatar" src={src} alt={t(`Foto de ${name}`)} /> : <span className="profile-avatar profile-initials" aria-label={t(`Avatar de ${name}`)}>{t(name.slice(0, 2).toUpperCase())}</span>
}

export default function ProfilePage({ user }) {
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [revision, setRevision] = useState(0)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('title')
  const [friendSearch, setFriendSearch] = useState('')
  const photoInput = useRef(null)
  const bannerInput = useRef(null)
  const [editor, setEditor] = useState(null)
  const [photoMenu, setPhotoMenu] = useState(null)
  const photoTrigger = useRef(null)
  useEffect(() => {
    let active = true
    api('/profile').then(result => { if (active) { setProfile(result); setError('') } }).catch(error => { if (active) setError(error.message) })
    return () => { active = false }
  }, [revision])
  async function update(data, message) {
    if (busy) return false
    setBusy(true); setError(''); setNotice('')
    try { setProfile(await api('/profile', data)); setNotice(message); return true }
    catch (error) { setError(error.message); return false }
    finally { setBusy(false) }
  }
  async function changePhoto(event, target) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || busy) return
    setBusy(true); setError(''); setNotice('')
    try {
      const source = await prepareProfileImage(file)
      setPhotoMenu(null)
      setEditor({ target, source })
    } catch (error) { setError(error.message || 'No se pudo abrir la foto.') }
    finally { setBusy(false) }
  }
  function editImage(target) {
    setPhotoMenu(null)
    setEditor({ target, source: profile.imageEdits?.[target]?.source || profile[target], settings: profile.imageEdits?.[target]?.settings })
  }
  function openPhotoMenu(target, event) {
    photoTrigger.current = event.currentTarget
    setError('')
    setPhotoMenu(target)
  }
  function closePhotoDialogs() {
    setPhotoMenu(null)
    setEditor(null)
    photoTrigger.current?.focus()
  }
  const games = profile?.games || []
  const purchased = games.filter(game => game.purchased).length
  const saved = games.filter(game => game.saved).length
  const totalHours = games.reduce((total, game) => total + game.hours, 0)
  const visible = games.filter(game => (filter === 'all' || game[filter]) && game.title.toLocaleLowerCase().includes(search.toLocaleLowerCase()))
    .sort((a, b) => sort === 'hours' ? b.hours - a.hours || a.title.localeCompare(b.title) : a.title.localeCompare(b.title))
  const friends = (profile?.friends || []).filter(friend => friend.name.toLocaleLowerCase().includes(friendSearch.toLocaleLowerCase()))
  return <main className="profile-page" id="main-content">
    <a href="#/" className="profile-back">{t("← Volver a la tienda")}</a>
    {error && <p className="auth-error" role="alert">{t(error)} {!profile && <button className="btn-redeem" onClick={() => setRevision(value => value + 1)}>{t("Reintentar")}</button>}</p>}
    <p className="profile-notice" role="status">{t(notice)}</p>
    {!profile ? !error && <p role="status">{t("Cargando tu perfil…")}</p> : <div className="profile-layout"><div className="profile-main-column">
      <section className="profile-hero" aria-labelledby="profile-name">
        <div className={`profile-banner${profile.banner ? ' has-custom-banner' : ''}`}>
          {profile.banner ? <img className="profile-banner-image" src={profile.banner} alt={t("Banner de tu perfil")} /> : <><span aria-hidden="true">{t("NEXUS / PLAYER HUB")}</span><div className="profile-banner-orbit" aria-hidden="true" /></>}
          <button type="button" className="profile-banner-edit" disabled={busy} onClick={event => openPhotoMenu('banner', event)}><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M8 5 9.5 3h5L16 5h4v15H4V5Z" /><circle cx="12" cy="12" r="4" /></svg>{t('Cambiar banner')}</button>
        </div>
        <input ref={bannerInput} type="file" accept="image/png,image/jpeg,image/webp" aria-label={t("Elegir banner de perfil")} hidden onChange={event => changePhoto(event, 'banner')} />
        <div className="profile-identity">
          <button className="profile-avatar-edit" type="button" disabled={busy} aria-label={t('Cambiar foto de perfil')} onClick={event => openPhotoMenu('avatar', event)}><Avatar name={user.name} src={profile.avatar} /><span className="profile-avatar-camera" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M8 5 9.5 3h5L16 5h4v15H4V5Z" /><circle cx="12" cy="12" r="4" /></svg></span></button>
          <div className="profile-identity-copy"><span className="profile-eyebrow">{t("TU ESPACIO DE JUEGO")}</span><h1 id="profile-name">{user.name}</h1><p>{user.email}</p><span className="profile-member">{t("Cliente Nexus · Desde ")}{t(new Date(user.createdAt).toLocaleDateString(getLocale(), { month: 'long', year: 'numeric' }))}</span></div>
          <div className="profile-photo-actions"><button className="profile-secondary-button" disabled={busy} onClick={event => openPhotoMenu('avatar', event)}>{t('Editar foto de perfil')}</button><small>{t('Dale tu estilo a tu perfil')}</small><input ref={photoInput} type="file" accept="image/png,image/jpeg,image/webp" aria-label={t("Elegir foto de perfil")} hidden onChange={event => changePhoto(event, 'avatar')} /></div>
        </div>
        <dl className="profile-stats"><div><dt>{t("Juegos comprados")}</dt><dd>{t(purchased)}</dd></div><div><dt>{t("Guardados / deseados")}</dt><dd>{t(saved)}</dd></div><div><dt>{t("Horas registradas")}</dt><dd>{t(formatHours(totalHours))} <small>{t("h")}</small></dd></div><div><dt>{t("Amigos guardados")}</dt><dd>{t(profile.friends.length)}</dd></div></dl>
      </section>
        <section className="profile-library" aria-labelledby="library-title">
          <div className="profile-section-heading"><div><span className="profile-eyebrow">{t("TUS PRÓXIMAS AVENTURAS")}</span><h2 id="library-title">{t("Biblioteca de juegos")}</h2></div><span>{t(games.length)}{t(" juegos")}</span></div>
          <div className="profile-toolbar">
            <label htmlFor="library-search">{t("Buscar en tu biblioteca")}<input id="library-search" type="search" placeholder={t("Nombre del juego…")} value={search} onChange={event => setSearch(event.target.value)} /></label>
            <label htmlFor="library-sort">{t("Ordenar por")}<select id="library-sort" value={sort} onChange={event => setSort(event.target.value)}><option value="title">{t("Nombre A–Z")}</option><option value="hours">{t("Más horas jugadas")}</option></select></label>
            <div className="profile-filters" role="group" aria-label={t("Filtrar biblioteca")}>{[['all', 'Todos', games.length], ['purchased', 'Comprados', purchased], ['saved', 'Guardados', saved]].map(([value, label, count]) => <button key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>{t(label)} <span>{t(count)}</span></button>)}</div>
          </div>
          <p className="profile-help">{t("Registra tus horas manualmente en cada juego. La tienda no mide las partidas fuera de la página.")}</p>
          <p className="profile-result-count" role="status">{t(visible.length)}{t(" juegos en esta vista")}</p>
          {visible.length ? <div className="profile-game-grid">{visible.map(game => <article className="profile-game" key={game.id}>
            <a className="profile-cover" href={'#/juego/' + encodeURIComponent(game.id)} aria-label={t(`Ver ${game.title}`)}><GameImage game={game} /><span className="profile-hours-badge">{t(formatHours(game.hours))}{t(" h")}</span></a>
            <div className="profile-game-body"><div className="profile-game-tags">{game.purchased && <span>{t("Comprado")}</span>}{game.saved && <span>{t("Guardado")}</span>}</div><h3><a href={'#/juego/' + encodeURIComponent(game.id)}>{game.title}</a></h3>
              <form className="profile-hours-form" onSubmit={event => { event.preventDefault(); update({ action: 'hours', gameId: game.id, hours: Number(new FormData(event.currentTarget).get('hours')) }, `Horas de ${game.title} guardadas.`) }}>
                <label htmlFor={`hours-${game.id}`}>{t("Horas jugadas")}<span className="profile-hours-controls"><input key={game.hours} id={`hours-${game.id}`} name="hours" type="number" min="0" max="100000" step="0.1" required defaultValue={game.hours} aria-label={t(`Horas jugadas en ${game.title}`)} /><button disabled={busy} aria-label={t(`Guardar horas de ${game.title}`)}>{t("Guardar")}</button></span></label>
              </form>
              <a className="profile-game-link" href={'#/juego/' + encodeURIComponent(game.id)}>{t("Ver ficha del juego →")}</a>
            </div>
          </article>)}</div> : <div className="profile-empty"><span aria-hidden="true">{t("◇")}</span><h3>{games.length ? t('No hay coincidencias') : t('Tu biblioteca empieza aquí')}</h3><p>{games.length ? t('Prueba otro nombre o cambia el filtro.') : t('Los juegos que compres o añadas a deseados aparecerán en este espacio.')}</p><a className="btn-buy" href="#/">{t("Explorar juegos")}</a></div>}
        </section>
      </div>
        <aside className="profile-friends" aria-labelledby="friends-title">
          <div className="profile-section-heading"><div><span className="profile-eyebrow">{t('TU COMUNIDAD')}</span><h2 id="friends-title">{t("Tus amigos")}</h2></div><span className="profile-friends-count">{t(profile.friends.length)}</span></div>
          <p className="profile-help">{t("Guarda a otros jugadores en tu lista personal.")}</p>
          <label className="profile-code" htmlFor="friend-code">{t("Tu código de cliente")}<input id="friend-code" readOnly value={user.id} onFocus={event => event.target.select()} /><small>{t("Compártelo para que puedan añadirte.")}</small></label>
          <form className="profile-add-friend" onSubmit={async event => { event.preventDefault(); const form = event.currentTarget; const friendId = new FormData(form).get('friendId').trim(); if (await update({ action: 'add-friend', friendId }, 'Amigo añadido a tu lista.')) form.reset() }}><label htmlFor="add-friend-code">{t("Añadir por código")}<input id="add-friend-code" name="friendId" required maxLength={80} placeholder={t("Código de tu amigo")} /></label><button className="btn-buy" disabled={busy}>{t("Añadir amigo")}</button></form>
          <label className="profile-friend-search" htmlFor="friend-search">{t("Buscar amigos")}<input id="friend-search" type="search" placeholder={t("Nombre de tu amigo…")} value={friendSearch} onChange={event => setFriendSearch(event.target.value)} /></label>
          <ul className="profile-friend-list">{friends.map(friend => <li key={friend.id}><Avatar name={friend.name} src={friend.avatar} /><div><strong>{friend.name}</strong><small>{t("Jugador Nexus")}</small></div><button className="profile-text-button" disabled={busy} aria-label={t(`Quitar a ${friend.name} de amigos`)} onClick={() => update({ action: 'remove-friend', friendId: friend.id }, 'Amigo quitado de tu lista.')}>{t("Quitar")}</button></li>)}</ul>
          {!friends.length && <p className="profile-help">{profile.friends.length ? t('No hay amigos con ese nombre.') : t('Aún no tienes amigos guardados. Añade el código de un cliente para empezar.')}</p>}
        </aside>
      </div>
    }
    {photoMenu && <ProfilePhotoMenu target={photoMenu} image={profile[photoMenu]} name={user.name} busy={busy} error={error} onUpload={() => (photoMenu === 'banner' ? bannerInput : photoInput).current.click()} onEdit={() => editImage(photoMenu)} onRemove={async () => { if (await update({ action: photoMenu, [photoMenu]: '' }, photoMenu === 'banner' ? 'Banner eliminado.' : 'Foto eliminada.')) closePhotoDialogs() }} onClose={closePhotoDialogs} />}
    {editor && <ProfileImageEditor {...editor} onClose={closePhotoDialogs} onSaved={result => { setProfile(result); setNotice(editor.target === 'banner' ? 'Banner actualizado.' : 'Foto de perfil actualizada.'); closePhotoDialogs() }} />}
  </main>
}
