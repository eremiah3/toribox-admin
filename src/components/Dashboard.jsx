import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const API_BASE = 'https://toribox-api.onrender.com';

const Dashboard = () => {
  const [movieCount, setMovieCount] = useState(0);
  const [episodeCount, setEpisodeCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch movies
        const moviesRes = await fetch(`${API_BASE}/api/movies/get`);
        if (!moviesRes.ok) throw new Error('Failed to fetch movies');
        const moviesJson = await moviesRes.json();
        const movies = moviesJson.movie?.data || [];
        setMovieCount(movies.length);

        // Fetch total episodes
        let totalEpisodes = 0;
        for (const movie of movies) {
          const episodesRes = await fetch(`${API_BASE}/api/movies/episode/get/${movie._id}`);
          if (episodesRes.ok) {
            const episodesJson = await episodesRes.json();
            totalEpisodes += (episodesJson.episode?.data || []).length;
          }
        }
        setEpisodeCount(totalEpisodes);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="dashboard fade-in">
      <h1>ToriBOX Admin Dashboard</h1>

      {/* Dynamic Stats Section */}
      {loading ? (
        <p style={{ textAlign: 'center', fontSize: '1.2rem', margin: '2rem 0' }}>
          Loading stats...
        </p>
      ) : (
        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-number">{movieCount}</div>
            <div className="stat-label">Movies Available</div>
          </div>

          <div className="stat-card">
            <div className="stat-number">{episodeCount}</div>
            <div className="stat-label">Episodes Total</div>
          </div>
        </div>
      )}

      {/* Quick Action Cards - Clickable */}
      <div className="dashboard-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
        <Link to="/movies" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <h2>🎬 Manage Movies</h2>
          <p>Upload new films & metadata</p>
        </Link>

        <Link to="/episodes" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <h2>📺 Manage Episodes</h2>
          <p>Add episodes to series</p>
        </Link>

        {/* <Link to="/trending" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <h2>🔥 Trending Movies</h2>
          <p>View & edit trending movies</p>
        </Link> */}

        <Link to="/bunny" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <h2>🐰 Bunny Videos</h2>
          <p>List & manage videos</p>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;