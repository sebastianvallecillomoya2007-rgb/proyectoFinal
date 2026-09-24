import { useEffect, useState } from 'react';
import { getGames } from '../service/gamesService';

export const GameList = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getGames()
      .then((data) => {
        setGames(data.games);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <p>Cargando juegos...</p>;

  return (
    <div className="game-grid">
      {games.map((game) => (
        <div key={game.id} className="game-card">
          <img src={game.thumbnail || game.image} alt={game.title} />
          <h3>{game.title || game.name}</h3>
          <p>{game.short_description || game.description}</p>
        </div>
      ))}
    </div>
  );
};