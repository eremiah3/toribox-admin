import React, { useState, useEffect } from "react";

const API_BASE = "https://api.tori-box.com";

const ComingSoon = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const endpoint = `${API_BASE}/api/users/admin/movies/get/coming-soon`;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await fetch(endpoint, { headers });
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      const comingSoonMovies = json.movie?.data || json.data || [];
      setMovies(comingSoonMovies);
    } catch (err) {
      console.error(err);
      alert("Failed to load movies");
      setMovies([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="section fade-in">
        <h1>Loading coming soon movies...</h1>
      </div>
    );
  }

  return (
    <div className="section fade-in">
      <h1
        style={{
          fontSize: "2.8rem",
          margin: "2rem 0",
          color: "var(--primary-color)",
          textAlign: "center",
        }}
      >
        Coming Soon Movies
      </h1>

      {movies.length === 0 ? (
        <p
          style={{
            textAlign: "center",
            fontSize: "1.3rem",
            color: "#888",
            margin: "4rem 0",
          }}
        >
          No coming soon movies yet.
        </p>
      ) : (
        <div className="movies-grid">
          {movies.map((movie) => (
            <div key={movie._id} className="movie-item-card">
              <div className="movie-header">
                {movie.coverImage ? (
                  <img
                    src={movie.coverImage}
                    alt={movie.title}
                    className="movie-poster"
                  />
                ) : (
                  <div className="no-poster">No Poster</div>
                )}
                <div className="movie-details">
                  <h3>{movie.title}</h3>
                  <p>
                    <strong>Genre:</strong>{" "}
                    {Array.isArray(movie.genre)
                      ? movie.genre.map((g) => g.title).join(", ")
                      : movie.genre || "N/A"}
                  </p>
                  <p className="description">{movie.description}</p>
                  {movie.coming_soon && (
                    <p style={{ color: "red", fontWeight: "bold" }}>
                      Coming Soon: {movie.coming_soon}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ComingSoon;