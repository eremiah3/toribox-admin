import React, { useState, useEffect } from 'react';

const API_BASE = 'https://toribox-api.onrender.com';

const Movies = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    genre: '',
    description: '',
    coverImage: null,
    video: null,
  });

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/movies/get`);
      if (!res.ok) throw new Error('Failed');
      const json = await res.json();
      setMovies(json.movie?.data || []);
    } catch (err) {
      console.error(err);
      alert('Failed to load movies');
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

    if (!formData.title || !formData.genre || !formData.description || !formData.coverImage || !formData.video) {
      alert('All fields are required');
      return;
    }

    setUploading(true);

    const uploadData = new FormData();

    uploadData.append('title', formData.title.trim());
    uploadData.append('description', formData.description.trim());
    uploadData.append('image', formData.coverImage);
    uploadData.append('video', formData.video);

    // Send genre as JSON string of array of strings
    const genreArray = formData.genre
      .split(',')
      .map(g => g.trim())
      .filter(g => g.length > 0);
      .map(g => ({ title: g }));
      

    uploadData.append('genre', JSON.stringify(genreArray));

    try {
      const res = await fetch(`${API_BASE}/api/movies/upload`, {
        method: 'POST',
        body: uploadData,
      });

      if (res.ok) {
        alert('Movie uploaded successfully!');
        setFormData({
          title: '',
          genre: '',
          description: '',
          coverImage: null,
          video: null,
        });
        setShowUploadModal(false);
        fetchMovies();
      } else {
        const error = await res.json().catch(() => ({}));
        alert('Upload failed: ' + (error.error?.message || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      alert('Upload error — check network or file size');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (movieId) => {
    if (!window.confirm('Delete this movie permanently?')) return;

    try {
      const res = await fetch(`${API_BASE}/api/movies/${movieId}`, { method: 'DELETE' });
      if (res.ok) {
        alert('Movie deleted');
        fetchMovies();
      } else {
        alert('Delete failed');
      }
    } catch (err) {
      alert('Delete error');
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
      <h1 style={{ fontSize: '2.8rem', margin: '2rem 0', color: 'var(--primary-color)', textAlign: 'center' }}>
        Manage Movies
      </h1>

      {/* Movies List */}
      <h2 style={{ margin: '2rem 0 1.5rem', fontSize: '2rem' }}>
        All Movies ({movies.length})
      </h2>

      {movies.length === 0 ? (
        <p style={{ textAlign: 'center', fontSize: '1.3rem', color: '#888', margin: '4rem 0' }}>
          No movies yet. Click the button below to upload your first one!
        </p>
      ) : (
        <div className="movies-grid">
          {movies.map((movie) => (
            <div key={movie._id} className="movie-item-card">
              <div className="movie-header">
                {movie.coverImage ? (
                  <img src={movie.coverImage} alt={movie.title} className="movie-poster" />
                ) : (
                  <div className="no-poster">No Poster</div>
                )}
                <div className="movie-details">
                  <h3>{movie.title}</h3>
                  <p><strong>Genre:</strong> {movie.genre?.map(g => g.title).join(', ') || 'N/A'}</p>
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

              <button onClick={() => handleDelete(movie._id)} className="btn delete-btn">
                Delete Movie
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Floating Upload Button */}
      <button
        className="floating-upload-btn"
        onClick={() => setShowUploadModal(true)}
      >
        + Upload New Movie
      </button>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="upload-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowUploadModal(false)}>
              ×
            </button>
            <h2>Upload New Movie</h2>
            <form onSubmit={handleUpload}>
              <div className="form-group">
                <label>Title</label>
                <input type="text" name="title" value={formData.title} onChange={handleTextChange} required />
              </div>

              <div className="form-group">
                <label>Genre (comma-separated)</label>
                <input
                  type="text"
                  name="genre"
                  value={formData.genre}
                  onChange={handleTextChange}
                  placeholder="Action, Fantasy, Drama"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleTextChange}
                  rows="5"
                  required
                />
              </div>

              <div className="form-group">
                <label>Cover Image</label>
                <input type="file" name="coverImage" accept="image/*" onChange={handleFileChange} required />
              </div>

              <div className="form-group">
                <label>Video File</label>
                <input type="file" name="video" accept="video/*" onChange={handleFileChange} required />
              </div>

              <button type="submit" className="btn upload-btn" disabled={uploading}>
                {uploading ? 'Uploading... (this may take time)' : 'Upload Movie'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Movies;
