import '../css/principal.css'

export default function FeaturedLists() {
  return (
    <section className="home-section split-section">
        <div className="column">
            <h3><i className="fa-solid fa-fire"></i> New Releases</h3>
            <div className="mini-list">
                <div className="mini-item">
                    <img src="https://image.api.playstation.com/vulcan/ap/rnd/202503/2016/9c66234099a4c6dc39a12c4101746f7dc9d87babbca5efe4.jpg" alt="God of War" />
                    <div className="mini-info">
                        <span className="mini-title">God of War Ragnarök</span>
                        <span className="mini-tag">Action</span>
                    </div>
                    <span className="price">$23.10</span>
                </div>
                <div className="mini-item">
                    <img src="https://gaming-cdn.com/images/products/17688/616x353/cyberpunk-2077-playstation-5-playstation-4-juego-playstation-store-cover.jpg?v=1748447708" alt="Cyberpunk" />
                    <div className="mini-info">
                        <span className="mini-title">Cyberpunk 2077</span>
                        <span className="mini-tag">Sci-Fi</span>
                    </div>
                    <span className="price">$20.40</span>
                </div>
                <div className="mini-item">
                    <img src="https://image.api.playstation.com/vulcan/ap/rnd/202512/1205/74bb57eb10447ae35775f625271f202360bae45cb3572da5.jpg" alt="Resident Evil" />
                    <div className="mini-info">
                        <span className="mini-title">Resident Evil Requiem</span>
                        <span className="mini-tag">Horror</span>
                    </div>
                    <span className="price">$13.20</span>
                </div>
            </div>
        </div>

        <div className="column">
            <h3><i className="fa-solid fa-star"></i> Top Rated</h3>
            <div className="mini-list">
                <div className="mini-item">
                    <img src="https://assets.nintendo.com/image/upload/c_fill,w_1200/q_auto:best/f_auto/dpr_2.0/store/software/switch/70010000006442/691ba3e0801180a9864cc8a7694b6f98097f9d9799bc7e3dc6db92f086759252" alt="Celeste" />
                    <div className="mini-info">
                        <span className="mini-title">Celeste</span>
                        <span className="mini-tag">Indie</span>
                    </div>
                    <span className="price">$4.52</span>
                </div>
                <div className="mini-item">
                    <img src="https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/814380/capsule_616x353.jpg?t=1762888662" alt="Sekiro" />
                    <div className="mini-info">
                        <span className="mini-title">Sekiro: Shadows Die Twice</span>
                        <span className="mini-tag">Action</span>
                    </div>
                    <span className="price">$17.18</span>
                </div>
                <div className="mini-item">
                    <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTvB8tfKTT1ww3ZPV2dYfoEUXj6enSmZb6xYb6SxXV12Po8bT7wogowJY0D&s=10" alt="ZZZ" />
                    <div className="mini-info">
                        <span className="mini-title">Zenless Zone Zero</span>
                        <span className="mini-tag">RPG</span>
                    </div>
                    <span className="price">Free</span>
                </div>
            </div>
        </div>
    </section>
  )
}
