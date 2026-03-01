import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const API_BASE = "https://api.tori-box.com";

const Dashboard = () => {
  const [movieCount, setMovieCount] = useState(0);
  const [episodeCount, setEpisodeCount] = useState(0);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const moviesRes = await fetch(`${API_BASE}/api/movies/get`);
        if (!moviesRes.ok) throw new Error("Failed");
        const moviesJson = await moviesRes.json();
        const movies = moviesJson.movie?.data || [];
        setMovieCount(movies.length);

        let totalEpisodes = 0;
        for (const movie of movies) {
          const episodesRes = await fetch(
            `${API_BASE}/api/movies/episode/get/${movie._id}`
          );
          if (episodesRes.ok) {
            const episodesJson = await episodesRes.json();
            totalEpisodes += (episodesJson.episode?.data || []).length;
          }
        }
        setEpisodeCount(totalEpisodes);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="dashboard fade-in">
      <h1
        style={{
          textAlign: "center",
          marginBottom: "3rem",
          color: "var(--primary-color)",
          fontSize: "2.8rem",
        }}
      >
        Godlike Dashboard Overview
      </h1>

      {loading ? (
        <p style={{ textAlign: "center", fontSize: "1.3rem" }}>
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
            <div className="stat-label">Total Episodes</div>
          </div>
        </div>
      )}

      <div
        className="trending-section card"
        style={{ padding: "2rem", margin: "3rem 0" }}
      >
        <h2
          style={{
            color: "var(--primary-color)",
            marginBottom: "1.5rem",
            textAlign: "center",
          }}
        >
          🔥 Trending Movies
        </h2>

        {loading ? (
          <p style={{ textAlign: "center" }}>Loading trending...</p>
        ) : trendingMovies.length === 0 ? (
          <p style={{ textAlign: "center", color: "#888" }}>No movies yet</p>
        ) : (
          <div className="trending-grid">
            {trendingMovies.map((movie, index) => (
              <div key={movie._id} className="trending-card">
                <span className="rank">#{index + 1}</span>
                <h3>{movie.title}</h3>
                <p>
                  Views: {movie.views || 0} • Ratings: {movie.ratings || 0}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="dashboard-grid">
        <Link to="/movies" className="god-card">
          <div className="card-icon">🎬</div>
          <h2>Manage Movies</h2>
          <p>Upload, edit, and organize movie metadata</p>
        </Link>

        <Link to="/episodes" className="god-card">
          <div className="card-icon">📺</div>
          <h2>Manage Episodes</h2>
          <p>Add and manage TV series episodes</p>
        </Link>

        <Link to="/users" className="god-card">
          <div className="card-icon">👥</div>
          <h2>Manage Users</h2>
          <p>View and control user accounts</p>
        </Link>

        <Link to="/bunny" className="god-card">
          <div className="card-icon">🐰</div>
          <h2>Bunny Videos</h2>
          <p>List and manage videos from Bunny storage</p>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
