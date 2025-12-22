import React, { useState, useEffect } from 'react';

const API_BASE = 'https://toribox-api.onrender.com';

const Episodes = () => {
  const [movies, setMovies] = useState([]);
  const [episodes, setEpisodes] = useState([]);
  const [selectedMovieId, setSelectedMovieId] = useState('');
  const [loadingMovies, setLoadingMovies] = useState(true);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    movieId: '',
    episodeNumber: '',
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
      if (!res.ok) throw new Error('Failed');
      const json = await res.json();
      setEpisodes(json.episode?.data || []);
    } catch (err) {
      console.error(err);
      alert('Failed to load episodes');
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
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, video: e.target.files[0] });
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!formData.movieId || !formData.episodeNumber || !formData.video) {
      alert('All fields are required');
      return;
    }

    setUploading(true);

    const uploadData = new FormData();
    uploadData.append('movieId', formData.movieId);
    uploadData.append('episode_count', formData.episodeNumber);
    uploadData.append('video', formData.video);

    try {
      const res = await fetch(`${API_BASE}/api/movies/episode/upload`, {
        method: 'POST',
        body: uploadData,
      });

      if (res.ok) {
        alert('Episode uploaded successfully!');
        setFormData({ movieId: formData.movieId, episodeNumber: '', video: null });
        fetchEpisodes(formData.movieId);
      } else {
        const error = await res.text();
        alert('Upload failed: ' + error);
      }
    } catch (err) {
      alert('Upload error');
    } finally {
      setUploading(false);
      setShowUploadModal(false);
    }
  };

  const handleDelete = async (episodeId) => {
    if (!window.confirm('Delete this episode permanently?')) return;

    try {
      const res = await fetch(`${API_BASE}/api/movies/episode/${episodeId}`, { method: 'DELETE' });
      if (res.ok) {
        alert('Episode deleted');
        fetchEpisodes(selectedMovieId);
      } else {
        alert('Delete failed');
      }
    } catch (err) {
      alert('Delete error');
    }
  };

  const selectedMovie = movies.find(m => m._id === selectedMovieId);

  return (
    <div className="section fade-in">
      <h1 style={{ fontSize: '2.8rem', margin: '2rem 0', color: 'var(--primary-color)', textAlign: 'center' }}>
        Manage Episodes
      </h1>

      {/* Movie Selector */}
      <div className="movie-selector card">
        <h2>Select Movie to Manage Episodes</h2>
        {loadingMovies ? (
          <p>Loading movies...</p>
        ) : (
          <select value={selectedMovieId} onChange={handleMovieChange} className="movie-select">
            <option value="">-- Choose a movie --</option>
            {movies.map((movie) => (
              <option key={movie._id} value={movie._id}>
                {movie.title}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Episodes Grid */}
      {selectedMovieId && (
        <>
          <h2 style={{ margin: '3rem 0 1.5rem', fontSize: '2rem' }}>
            Episodes for "{selectedMovie?.title || 'Unknown'}" ({episodes.length})
          </h2>

          {loadingEpisodes ? (
            <p style={{ textAlign: 'center' }}>Loading episodes...</p>
          ) : episodes.length === 0 ? (
            <p style={{ textAlign: 'center', fontSize: '1.3rem', color: '#888', margin: '4rem 0' }}>
              No episodes yet. Use the button below to upload!
            </p>
          ) : (
            <div className="episodes-grid">
              {episodes.map((episode) => (
                <div key={episode.episodeId} className="episode-card">
                  <div className="episode-header">
                    <h3>Episode {episode.episode_count || 'N/A'}</h3>
                  </div>

                  {episode.stream ? (
                    <video controls className="episode-video">
                      <source src={episode.stream} type="video/mp4" />
                      Your browser does not support the video.
                    </video>
                  ) : (
                    <div className="no-video">No video stream available</div>
                  )}

                  <button onClick={() => handleDelete(episode.episodeId)} className="btn delete-btn">
                    Delete Episode
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Floating Upload Button */}
      <button
        className="floating-upload-btn"
        onClick={() => setShowUploadModal(true)}
        disabled={!selectedMovieId}
      >
        + Upload Episode
      </button>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="upload-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowUploadModal(false)}>
              ×
            </button>
            <h2>Upload New Episode</h2>
            <form onSubmit={handleUpload}>
              <div className="form-group">
                <label>Movie ID</label>
                <select name="movieId" value={formData.movieId} onChange={handleChange} required>
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
                <label>Video File *</label>
                <input type="file" accept="video/*" onChange={handleFileChange} required />
              </div>

              <button type="submit" className="btn upload-btn" disabled={uploading}>
                {uploading ? 'Uploading...' : 'Upload Episode'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Episodes;