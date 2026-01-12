import React, { useState, useEffect } from "react";

const API_BASE = "https://toribox-api.onrender.com";

const Movies = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    genre: "",
    description: "",
    coverImage: null,
    video: null,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [ratingForm, setRatingForm] = useState({ unique_id: "", movie_id: "" });
  const [showRatingModal, setShowRatingModal] = useState(false);

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
      setMovies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTextChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.files[0] });
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (
      !formData.title ||
      !formData.genre ||
      !formData.description ||
      !formData.coverImage ||
      !formData.video
    ) {
      alert("All fields are required");
      return;
    }

    const token = localStorage.getItem("adminToken");
    if (!token) {
      alert("You must be logged in to upload movies. Please log in first.");
      return;
    }

    setUploading(true);

    const genreList = formData.genre
      .split(",")
      .map((g) => g.trim())
      .filter((g) => g.length > 0)
      .map((g) => ({ title: g }));

    if (genreList.length === 0) {
      alert("Please enter at least one genre");
      setUploading(false);
      return;
    }

    const genreArray = genreList;

    const uploadData = new FormData();

    // Add fields in exact order the backend expects
    uploadData.append("video", formData.video);
    uploadData.append("image", formData.coverImage);
    uploadData.append("title", formData.title.trim());
    uploadData.append("description", formData.description.trim());
    // Append each genre as separate field to create array on server
    genreArray.forEach((g) => uploadData.append("genre", JSON.stringify(g)));
    uploadData.append("coming_soon", "");

    try {
      const res = await fetch(`${API_BASE}/api/movies/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: uploadData,
      });

      if (res.ok) {
        alert("Movie uploaded successfully!");
        setFormData({
          title: "",
          genre: "",
          description: "",
          coverImage: null,
          video: null,
        });
        setShowUploadModal(false);
        fetchMovies();
      } else {
        const errorData = await res.json().catch(() => ({}));
        let errorMessage = "Unknown error";

        if (typeof errorData === "string") {
          errorMessage = errorData;
        } else if (errorData?.error?.message) {
          errorMessage = errorData.error.message;
        } else if (errorData?.message) {
          errorMessage = errorData.message;
        }

        if (res.status === 401 || res.status === 403) {
          alert("Authentication failed. Please log in again.");
        } else {
          alert(`Upload failed: ${errorMessage}`);
        }
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload error — check network or file size");
    } finally {
      setUploading(false);
    }
  };

  const handleUploadSearchQuery = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      alert("Please enter a search query");
      return;
    }

    const token = localStorage.getItem("adminToken");

    try {
      const res = await fetch(`${API_BASE}/api/movies/search/query/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query: searchQuery.trim() }),
      });

      if (res.ok) {
        alert("Search query uploaded successfully!");
        setSearchQuery("");
        setShowSearchModal(false);
      } else {
        const error = await res.json().catch(() => ({}));
        alert(
          "Failed to upload search query: " +
            (error.error?.message || "Unknown error")
        );
      }
    } catch (err) {
      console.error("Upload search query error:", err);
      alert("Network error. Please try again.");
    }
  };

  const handleAddRating = async (e) => {
    e.preventDefault();
    if (!ratingForm.unique_id || !ratingForm.movie_id) {
      alert("All fields are required");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/movies/ratings/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(ratingForm),
      });

      if (res.ok) {
        alert("Rating added successfully!");
        setRatingForm({ unique_id: "", movie_id: "" });
        setShowRatingModal(false);
      } else {
        const error = await res.json().catch(() => ({}));
        alert(
          "Failed to add rating: " + (error.error?.message || "Unknown error")
        );
      }
    } catch (err) {
      console.error("Add rating error:", err);
      alert("Network error. Please try again.");
    }
  };

  const handleUnrateMovie = async (e) => {
    e.preventDefault();
    if (!ratingForm.unique_id || !ratingForm.movie_id) {
      alert("All fields are required");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/movies/ratings/un-add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(ratingForm),
      });

      if (res.ok) {
        alert("Rating removed successfully!");
        setRatingForm({ unique_id: "", movie_id: "" });
        setShowRatingModal(false);
      } else {
        const error = await res.json().catch(() => ({}));
        alert(
          "Failed to remove rating: " +
            (error.error?.message || "Unknown error")
        );
      }
    } catch (err) {
      console.error("Remove rating error:", err);
      alert("Network error. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="section fade-in">
        <h1>Loading movies...</h1>
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
        Manage Movies
      </h1>

      <h2 style={{ margin: "2rem 0 1.5rem", fontSize: "2rem" }}>
        All Movies ({movies.length})
      </h2>

      {movies.length === 0 ? (
        <p
          style={{
            textAlign: "center",
            fontSize: "1.3rem",
            color: "#888",
            margin: "4rem 0",
          }}
        >
          No movies yet. Click the button below to upload your first one!
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
                </div>
              </div>

              {movie.stream ? (
                <video controls className="movie-video">
                  <source src={movie.stream} type="video/mp4" />
                  Your browser does not support the video.
                </video>
              ) : (
                <p className="no-video">No video stream</p>
              )}
            </div>
          ))}
        </div>
      )}

      <div
        style={{
          position: "fixed",
          bottom: "2rem",
          right: "2rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.8rem",
          zIndex: 1000,
        }}
      >
        <button
          onClick={() => setShowUploadModal(true)}
          title="Upload Movie"
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            border: "none",
            background: "#667eea",
            color: "white",
            fontSize: "28px",
            cursor: "pointer",
            boxShadow: "0 4px 15px rgba(0,0,0,0.25)",
          }}
        >
          +
        </button>

        <button
          onClick={() => setShowSearchModal(true)}
          title="Upload Search Query"
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            border: "none",
            background: "#f5576c",
            color: "white",
            fontSize: "24px",
            cursor: "pointer",
            boxShadow: "0 4px 15px rgba(0,0,0,0.25)",
          }}
        >
          🔍
        </button>

        <button
          onClick={() => setShowRatingModal(true)}
          title="Manage Ratings"
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            border: "none",
            background: "#fcb69f",
            color: "white",
            fontSize: "24px",
            cursor: "pointer",
            boxShadow: "0 4px 15px rgba(0,0,0,0.25)",
          }}
        >
          ⭐
        </button>
      </div>

      {showUploadModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowUploadModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "680px",
              margin: "20px",
              maxHeight: "92vh",
              overflowY: "auto",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              position: "relative",
              padding: "32px",
            }}
          >
            <button
              onClick={() => setShowUploadModal(false)}
              style={{
                position: "absolute",
                top: "16px",
                right: "20px",
                background: "none",
                border: "none",
                fontSize: "32px",
                color: "#777",
                cursor: "pointer",
                lineHeight: 1,
              }}
            >
              ×
            </button>

            <h2
              style={{
                margin: "0 0 28px 0",
                fontSize: "28px",
                fontWeight: 700,
                color: "#1a1a1a",
                textAlign: "center",
              }}
            >
              Upload New Movie
            </h2>

            <form onSubmit={handleUpload}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "24px",
                  marginBottom: "28px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: 600,
                      fontSize: "15px",
                      color: "#000",
                    }}
                  >
                    Movie Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleTextChange}
                    required
                    placeholder="Enter movie title"
                    style={{
                      width: "90%",
                      padding: "14px",
                      border: "1.5px solid #000",
                      borderRadius: "10px",
                      fontSize: "15px",
                      color: "#000",
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: 600,
                      fontSize: "15px",
                      color: "#000",
                    }}
                  >
                    Genres *
                  </label>
                  <input
                    type="text"
                    name="genre"
                    value={formData.genre}
                    onChange={handleTextChange}
                    placeholder="Action, Sci-Fi, Drama, Thriller"
                    required
                    style={{
                      width: "90%",
                      padding: "14px",
                      border: "1.5px solid #000",
                      borderRadius: "10px",
                      fontSize: "15px",
                      color: "#000",
                    }}
                  />
                  <small
                    style={{
                      color: "#000",
                      fontSize: "12.5px",
                      marginTop: "6px",
                      display: "block",
                    }}
                  >
                    Separate genres with commas (e.g. Action, Fantasy)
                  </small>
                </div>
              </div>

              <div style={{ marginBottom: "28px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: 600,
                    fontSize: "15px",
                    color: "#000",
                  }}
                >
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleTextChange}
                  required
                  rows={5}
                  placeholder="Brief description about the movie..."
                  style={{
                    width: "100%",
                    padding: "14px",
                    border: "1.5px solid #000",
                    borderRadius: "10px",
                    fontSize: "15px",
                    resize: "vertical",
                    color: "#000",
                  }}
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "24px",
                  marginBottom: "32px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: 600,
                      fontSize: "15px",
                      color: "#000",
                    }}
                  >
                    Cover Image *
                  </label>
                  <div
                    style={{
                      position: "relative",
                      border: "2px dashed #000",
                      borderRadius: "10px",
                      padding: "16px",
                      textAlign: "center",
                      background: "#fafafa",
                    }}
                  >
                    <input
                      type="file"
                      name="coverImage"
                      accept="image/*"
                      onChange={handleFileChange}
                      required
                      style={{
                        position: "absolute",
                        inset: 0,
                        opacity: 0,
                        cursor: "pointer",
                        color: "#000",
                      }}
                    />
                    <div style={{ pointerEvents: "none" }}>
                      {formData.coverImage
                        ? formData.coverImage.name
                        : "Choose poster image..."}
                    </div>
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: 600,
                      fontSize: "15px",
                      color: "#000",
                    }}
                  >
                    Video File *
                  </label>
                  <div
                    style={{
                      position: "relative",
                      border: "2px dashed #000",
                      borderRadius: "10px",
                      padding: "16px",
                      textAlign: "center",
                      background: "#fafafa",
                    }}
                  >
                    <input
                      type="file"
                      name="video"
                      accept="video/*"
                      onChange={handleFileChange}
                      required
                      style={{
                        position: "absolute",
                        inset: 0,
                        opacity: 0,
                        cursor: "pointer",
                      }}
                    />
                    <div style={{ pointerEvents: "none" }}>
                      {formData.video
                        ? formData.video.name
                        : "Choose movie file..."}
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={uploading}
                style={{
                  width: "100%",
                  padding: "16px",
                  fontSize: "17px",
                  fontWeight: 600,
                  background: uploading
                    ? "#aaa"
                    : "linear-gradient(90deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  cursor: uploading ? "not-allowed" : "pointer",
                  boxShadow: uploading
                    ? "none"
                    : "0 4px 14px rgba(102,126,234,0.35)",
                }}
              >
                {uploading ? "Uploading... Please wait" : "Upload Movie"}
              </button>
            </form>
          </div>
        </div>
      )}

      {showSearchModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowSearchModal(false)}
        >
          <div className="upload-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setShowSearchModal(false)}
            >
              ×
            </button>
            <h2>Upload Search Query</h2>
            <form onSubmit={handleUploadSearchQuery}>
              <div className="form-group">
                <label>Search Query</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter search query"
                  required
                />
              </div>
              <button type="submit" className="btn upload-btn">
                Upload Query
              </button>
            </form>
          </div>
        </div>
      )}

      {showRatingModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowRatingModal(false)}
        >
          <div className="upload-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setShowRatingModal(false)}
            >
              ×
            </button>
            <h2>Manage Movie Ratings</h2>

            <div style={{ marginBottom: "2rem" }}>
              <h3>Add Rating</h3>
              <form onSubmit={handleAddRating}>
                <div className="form-group">
                  <label>User Unique ID</label>
                  <input
                    type="text"
                    value={ratingForm.unique_id}
                    onChange={(e) =>
                      setRatingForm({
                        ...ratingForm,
                        unique_id: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Movie ID</label>
                  <select
                    value={ratingForm.movie_id}
                    onChange={(e) =>
                      setRatingForm({ ...ratingForm, movie_id: e.target.value })
                    }
                    required
                  >
                    <option value="">Select a movie</option>
                    {movies.map((movie) => (
                      <option key={movie._id} value={movie._id}>
                        {movie.title}
                      </option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="btn upload-btn">
                  Add Rating
                </button>
              </form>
            </div>

            <div>
              <h3>Remove Rating</h3>
              <form onSubmit={handleUnrateMovie}>
                <div className="form-group">
                  <label>User Unique ID</label>
                  <input
                    type="text"
                    value={ratingForm.unique_id}
                    onChange={(e) =>
                      setRatingForm({
                        ...ratingForm,
                        unique_id: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Movie ID</label>
                  <select
                    value={ratingForm.movie_id}
                    onChange={(e) =>
                      setRatingForm({ ...ratingForm, movie_id: e.target.value })
                    }
                    required
                  >
                    <option value="">Select a movie</option>
                    {movies.map((movie) => (
                      <option key={movie._id} value={movie._id}>
                        {movie.title}
                      </option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="btn delete-btn">
                  Remove Rating
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Movies;
