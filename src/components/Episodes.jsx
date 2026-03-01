import React, { useState, useEffect } from "react";

const API_BASE = "https://api.tori-box.com";

const Episodes = () => {
  const [movies, setMovies] = useState([]);
  const [episodes, setEpisodes] = useState([]);
  const [selectedMovieId, setSelectedMovieId] = useState("");
  const [loadingMovies, setLoadingMovies] = useState(true);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    movieId: "",
    episodeNumber: "",
    video: null,
    is_premium: false,
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
      if (!res.ok) throw new Error("Failed");
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

  const fetchEpisodes = async (movieId) => {
    if (!movieId) {
      setEpisodes([]);
      return;
    }
    setLoadingEpisodes(true);
    try {
      const res = await fetch(`${API_BASE}/api/movies/episode/get/${movieId}`);
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      setEpisodes(json.episode?.data || []);
    } catch (err) {
      console.error(err);
      alert("Failed to load episodes");
      setEpisodes([]);
    } finally {
      setLoadingEpisodes(false);
    }
  };

  const handleMovieChange = (e) => {
    const movieId = e.target.value;
    setSelectedMovieId(movieId);
    setFormData({ ...formData, movieId });
    fetchEpisodes(movieId);
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
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: uploadData,
      });

      if (res.ok) {
        alert("Episode uploaded successfully!");
        setFormData({ movieId: formData.movieId, episodeNumber: "", video: null, is_premium: false });
        setShowUploadModal(false);
        fetchEpisodes(formData.movieId);
      } else {
        const error = await res.json().catch(() => ({}));
        alert(
          "Upload failed: " +
            (error.message || error.error?.message || "Unknown error")
        );
      }
    } catch (err) {
      console.error(err);
      alert("Upload error");
    } finally {
      setUploading(false);
    }
  };

  const selectedMovie = movies.find((m) => m._id === selectedMovieId);

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
        Manage Episodes
      </h1>

      <div className="movie-selector card">
        <h2>Select Movie to Manage Episodes</h2>
        {loadingMovies ? (
          <p>Loading movies...</p>
        ) : (
          <select
            value={selectedMovieId}
            onChange={handleMovieChange}
            className="movie-select"
          >
            <option value="">-- Choose a movie --</option>
            {movies.map((movie) => (
              <option key={movie._id} value={movie._id}>
                {movie.title}
              </option>
            ))}
          </select>
        )}
      </div>

      {selectedMovieId && (
        <>
          <h2 style={{ margin: "3rem 0 1.5rem", fontSize: "2rem" }}>
            Episodes for "{selectedMovie?.title || "Unknown"}" (
            {episodes.length})
          </h2>

          {loadingEpisodes ? (
            <p style={{ textAlign: "center" }}>Loading episodes...</p>
          ) : episodes.length === 0 ? (
            <p
              style={{
                textAlign: "center",
                fontSize: "1.3rem",
                color: "#888",
                margin: "4rem 0",
              }}
            >
              No episodes yet. Use the button below to upload!
            </p>
          ) : (
            <div className="episodes-grid">
              {episodes.map((episode) => (
                <div key={episode.episodeId} className="episode-card">
                  <div className="episode-header">
                    <h3>Episode {episode.episode_count || "N/A"}</h3>
                  </div>

                  {episode.stream ? (
                    <video controls className="episode-video">
                      <source src={episode.stream} type="video/mp4" />
                      Your browser does not support the video.
                    </video>
                  ) : (
                    <div className="no-video">No video stream available</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <button
        className="floating-upload-btn"
        onClick={() => setShowUploadModal(true)}
        disabled={!selectedMovieId}
      >
        + Upload Episode
      </button>

      {showUploadModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowUploadModal(false)}
        >
          <div className="upload-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setShowUploadModal(false)}
            >
              ×
            </button>
            <h2>Upload New Episode</h2>
            <form onSubmit={handleUpload}>
              <div className="form-group">
                <label>Movie ID</label>
                <select
                  name="movieId"
                  value={formData.movieId}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select movie</option>
                  {movies.map((movie) => (
                    <option key={movie._id} value={movie._id}>
                      {movie.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Episode Number</label>
                <input
                  type="number"
                  name="episodeNumber"
                  value={formData.episodeNumber}
                  onChange={handleChange}
                  min="1"
                  placeholder="e.g., 1"
                  required
                />
              </div>

              <div className="form-group">
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <input
                    type="checkbox"
                    name="is_premium"
                    checked={!!formData.is_premium}
                    onChange={handleChange}
                  />
                  Premium Episode
                </label>
              </div>

              <div className="form-group">
                <label>Video File *</label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn upload-btn"
                disabled={uploading}
              >
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
