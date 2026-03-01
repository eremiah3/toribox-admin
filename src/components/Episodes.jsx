import React, { useState, useEffect } from "react";

const API_BASE = "https://api.tori-box.com";

const isPremium = (ep) =>
  ep.premium === true ||
  ep.premium === "true" ||
  ep.is_premium === true ||
  ep.is_premium === "true";

const Episodes = () => {
  const [movies, setMovies] = useState([]);
  const [episodes, setEpisodes] = useState([]);
  const [selectedMovieId, setSelectedMovieId] = useState("");
  const [loadingMovies, setLoadingMovies] = useState(true);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPremiumOnly, setShowPremiumOnly] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    movieId: "",
    episodeNumber: "",
    video: null,
    is_premium: true,
  });

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const endpoint = token
        ? `${API_BASE}/api/users/admin/movies/get`
        : `${API_BASE}/api/movies/get`;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(endpoint, { headers });
      if (!res.ok) throw new Error("Failed to load movies");
      const json = await res.json();
      const data = json.movie?.data || json.data || [];
      setMovies(data);
    } catch (err) {
      console.error(err);
      alert("Failed to load movies");
    } finally {
      setLoadingMovies(false);
    }
  };

  const loadEpisodesForMovie = async (movieId, moviesList = movies) => {
    if (!movieId) {
      setEpisodes([]);
      return;
    }
    setError(null);
    setLoadingEpisodes(true);

    try {
      const token = localStorage.getItem("adminToken");

      // Use admin endpoint with token to get ALL episodes including premium
      const adminEpisodeEndpoint = `${API_BASE}/api/users/admin/movies/episode/get/${movieId}`;
      const publicEpisodeEndpoint = `${API_BASE}/api/movies/episode/get/${movieId}`;

      let apiEpisodes = [];

      // Try admin endpoint first (returns premium + free with stream URLs)
      if (token) {
        const adminRes = await fetch(adminEpisodeEndpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (adminRes.ok) {
          const adminJson = await adminRes.json();
          console.log("Admin episode response:", adminJson);
          apiEpisodes =
            adminJson.episode?.data ||
            adminJson.episodes?.data ||
            adminJson.data ||
            adminJson.episodes ||
            [];
        }
      }

      // If admin endpoint returned nothing, fall back to public endpoint
      if (apiEpisodes.length === 0) {
        const pubRes = await fetch(publicEpisodeEndpoint);
        if (pubRes.ok) {
          const pubJson = await pubRes.json();
          console.log("Public episode response:", pubJson);
          apiEpisodes =
            pubJson.episode?.data ||
            pubJson.episodes?.data ||
            pubJson.data ||
            pubJson.episodes ||
            [];
        }
      }

      // Use embedded movie.episodes as the master list for all episode IDs + premium flags
      const movie = moviesList.find((m) => m._id === movieId);
      const embeddedEpisodes = movie?.episodes || [];

      console.log("API episodes:", apiEpisodes);
      console.log("Embedded episodes:", embeddedEpisodes);

      // Build stream map from API response
      const streamMap = {};
      apiEpisodes.forEach((ep) => {
        const id = ep.episodeId || ep._id;
        if (id) streamMap[id] = ep.stream || ep.HLSStream || null;
      });

      // Merge: embedded = full list + premium flag, streamMap = stream URLs
      const merged = embeddedEpisodes.map((ep) => ({
        ...ep,
        stream: streamMap[ep.episodeId] || null,
      }));

      merged.sort((a, b) => (a.episode_count || 0) - (b.episode_count || 0));
      console.log("Final merged episodes:", merged);
      setEpisodes(merged);
    } catch (err) {
      console.error("Load episodes error:", err);
      setError(err.message);
      setEpisodes([]);
    } finally {
      setLoadingEpisodes(false);
    }
  };

  const handleMovieChange = (e) => {
    const movieId = e.target.value;
    setSelectedMovieId(movieId);
    setFormData({ ...formData, movieId });
    setShowPremiumOnly(false);
    setError(null);
    if (movieId) loadEpisodesForMovie(movieId);
    else setEpisodes([]);
  };

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, video: e.target.files[0] });
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!formData.movieId || !formData.episodeNumber || !formData.video) {
      alert("All fields are required");
      return;
    }
    setUploading(true);
    const uploadData = new FormData();
    uploadData.append("movieId", formData.movieId);
    uploadData.append("episode_count", formData.episodeNumber);
    uploadData.append("video", formData.video);
    uploadData.append("is_premium", formData.is_premium ? "true" : "false");
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        alert("You must be logged in to upload. Please login again.");
        return;
      }
      const res = await fetch(`${API_BASE}/api/movies/episode/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: uploadData,
      });
      if (res.ok) {
        alert("Episode uploaded successfully!");
        setFormData({ movieId: formData.movieId, episodeNumber: "", video: null, is_premium: true });
        setShowUploadModal(false);
        const token2 = localStorage.getItem("adminToken");
        const endpoint = token2 ? `${API_BASE}/api/users/admin/movies/get` : `${API_BASE}/api/movies/get`;
        const headers2 = token2 ? { Authorization: `Bearer ${token2}` } : {};
        const moviesRes = await fetch(endpoint, { headers: headers2 });
        if (moviesRes.ok) {
          const json = await moviesRes.json();
          const updatedMovies = json.movie?.data || json.data || [];
          setMovies(updatedMovies);
          await loadEpisodesForMovie(formData.movieId, updatedMovies);
        }
      } else {
        const errBody = await res.json().catch(() => ({}));
        alert("Upload failed: " + (errBody.message || errBody.error?.message || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("Upload error");
    } finally {
      setUploading(false);
    }
  };

  const selectedMovie = movies.find((m) => m._id === selectedMovieId);
  const premiumCount = episodes.filter(isPremium).length;
  const freeCount = episodes.length - premiumCount;
  const displayedEpisodes = showPremiumOnly ? episodes.filter(isPremium) : episodes;

  return (
    <div className="section fade-in">
      <h1 style={{ fontSize: "2.8rem", margin: "2rem 0", color: "var(--primary-color)", textAlign: "center" }}>
        Manage Episodes
      </h1>

      <div className="movie-selector card">
        <h2>Select Movie to Manage Episodes</h2>
        {loadingMovies ? (
          <p>Loading movies...</p>
        ) : (
          <select value={selectedMovieId} onChange={handleMovieChange} className="movie-select">
            <option value="">-- Choose a movie --</option>
            {movies.map((movie) => (
              <option key={movie._id} value={movie._id}>{movie.title}</option>
            ))}
          </select>
        )}
      </div>

      {selectedMovieId && (
        <>
          {error && (
            <div style={{ padding: "1rem", background: "#ffebee", color: "#c62828", borderRadius: "8px", margin: "1rem 0", textAlign: "center" }}>
              Error: {error}
            </div>
          )}

          {loadingEpisodes && (
            <p style={{ textAlign: "center", fontSize: "1.2rem", margin: "2rem 0" }}>Loading episodes...</p>
          )}

          {!loadingEpisodes && !error && (
            <div style={{ display: "flex", justifyContent: "center", gap: "2rem", margin: "2rem 0", flexWrap: "wrap" }}>
              <div style={{ padding: "1rem 2rem", background: "var(--primary-color)", color: "white", borderRadius: "12px", textAlign: "center", minWidth: "150px" }}>
                <div style={{ fontSize: "2rem", fontWeight: "bold" }}>{episodes.length}</div>
                <div style={{ fontSize: "0.9rem" }}>Total Episodes</div>
              </div>
              <div style={{ padding: "1rem 2rem", background: "#4caf50", color: "white", borderRadius: "12px", textAlign: "center", minWidth: "150px" }}>
                <div style={{ fontSize: "2rem", fontWeight: "bold" }}>{freeCount}</div>
                <div style={{ fontSize: "0.9rem" }}>Free Episodes</div>
              </div>
              <div style={{ padding: "1rem 2rem", background: "#ff9800", color: "white", borderRadius: "12px", textAlign: "center", minWidth: "150px" }}>
                <div style={{ fontSize: "2rem", fontWeight: "bold" }}>{premiumCount}</div>
                <div style={{ fontSize: "0.9rem" }}>🔒 Premium/Locked</div>
              </div>
            </div>
          )}

          {!loadingEpisodes && episodes.length > 0 && (
            <div style={{ textAlign: "center", marginBottom: "1rem" }}>
              <button
                onClick={() => setShowPremiumOnly(!showPremiumOnly)}
                style={{
                  padding: "0.5rem 1.5rem", borderRadius: "8px", border: "2px solid #ff9800",
                  background: showPremiumOnly ? "#ff9800" : "white",
                  color: showPremiumOnly ? "white" : "#ff9800",
                  cursor: "pointer", fontWeight: "600", fontSize: "0.9rem",
                }}
              >
                {showPremiumOnly ? "Show All Episodes" : "Show Premium Only"}
              </button>
            </div>
          )}

          {!loadingEpisodes && (
            <>
              <h2 style={{ margin: "1.5rem 0", fontSize: "2rem" }}>
                Episodes for "{selectedMovie?.title || "Unknown"}" ({displayedEpisodes.length})
              </h2>

              {displayedEpisodes.length === 0 ? (
                <p style={{ textAlign: "center", fontSize: "1.3rem", color: "#888", margin: "4rem 0" }}>
                  {showPremiumOnly ? "No premium/locked episodes found." : "No episodes yet. Use the button below to upload!"}
                </p>
              ) : (
                <div className="episodes-grid">
                  {displayedEpisodes.map((episode) => (
                    <div key={episode.episodeId} className="episode-card">
                      <div className="episode-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h3>Episode {episode.episode_count || "N/A"}</h3>
                        {isPremium(episode) ? (
                          <span style={{ background: "#ff9800", color: "white", padding: "0.3rem 0.8rem", borderRadius: "12px", fontSize: "0.85rem", fontWeight: "600", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                            🔒 Premium
                          </span>
                        ) : (
                          <span style={{ background: "#4caf50", color: "white", padding: "0.3rem 0.8rem", borderRadius: "12px", fontSize: "0.85rem", fontWeight: "600" }}>
                            Free
                          </span>
                        )}
                      </div>

                      {episode.stream ? (
                        <video
                          controls
                          style={{ width: "100%", marginTop: "0.75rem", borderRadius: "8px", background: "#000" }}
                        >
                          <source src={episode.stream} type="video/mp4" />
                          Your browser does not support the video.
                        </video>
                      ) : (
                        <div style={{ marginTop: "0.75rem", padding: "2rem", background: "#1a1a1a", borderRadius: "8px", textAlign: "center", color: "#666", fontSize: "0.9rem" }}>
                          ⏳ Video processing...
                        </div>
                      )}

                      <div style={{ marginTop: "1rem", padding: "0.5rem", background: "#f5f5f5", borderRadius: "6px" }}>
                        <p style={{ margin: "0.3rem 0", fontSize: "0.9rem" }}>
                          <strong>Episode ID:</strong> {episode.episodeId || "N/A"}
                        </p>
                        <p style={{ margin: "0.3rem 0", fontSize: "0.9rem" }}>
                          <strong>Status:</strong> {isPremium(episode) ? "🔒 Premium/Locked" : "✅ Free"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      <button className="floating-upload-btn" onClick={() => setShowUploadModal(true)} disabled={!selectedMovieId}>
        + Upload Episode
      </button>

      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="upload-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowUploadModal(false)}>×</button>
            <h2>Upload New Episode</h2>
            <form onSubmit={handleUpload}>
              <div className="form-group">
                <label>Movie</label>
                <select name="movieId" value={formData.movieId} onChange={handleChange} required>
                  <option value="">Select movie</option>
                  {movies.map((movie) => (
                    <option key={movie._id} value={movie._id}>{movie.title}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Episode Number</label>
                <input type="number" name="episodeNumber" value={formData.episodeNumber} onChange={handleChange} min="1" placeholder="e.g., 1" required />
              </div>
              <div className="form-group">
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <input type="checkbox" name="is_premium" checked={!!formData.is_premium} onChange={handleChange} />
                  🔒 Premium/Locked Episode
                </label>
                <small style={{ color: "#666", marginLeft: "1.8rem" }}>
                  Premium episodes will only be accessible to paid users
                </small>
              </div>
              <div className="form-group">
                <label>Video File *</label>
                <input type="file" accept="video/*" onChange={handleFileChange} required />
              </div>
              <button type="submit" className="btn upload-btn" disabled={uploading}>
                {uploading ? "Uploading..." : "Upload Episode"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Episodes;