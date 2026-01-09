import React, { useState, useEffect } from "react";

const API_BASE = "https://toribox-api.onrender.com";

const BunnyVideos = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBunnyVideos();
  }, []);

  const fetchBunnyVideos = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/movies/list-bunny-videos`);
      if (!res.ok) throw new Error("Failed to fetch Bunny videos");
      const json = await res.json();

      const videoList = json.response?.items || [];
      setVideos(videoList);
    } catch (err) {
      console.error(err);
      alert("Failed to load Bunny videos");
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  const getThumbnailUrl = (guid) => {
    return `https://vz-980df3f8-a39.b-cdn.net/${guid}/thumbnail.jpg`;
  };

  const getVideoUrl = (guid) => {
    return `https://vz-980df3f8-a39.b-cdn.net/${guid}/play_720p.mp4`;
  };

  const handleDelete = async (guid) => {
    if (!window.confirm("Delete this Bunny video permanently?")) return;
    alert("Delete not implemented — add backend endpoint");
  };

  if (loading) {
    return (
      <div className="section fade-in">
        <h1>Loading Bunny videos...</h1>
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
        Bunny Videos
      </h1>

      <h2 style={{ margin: "2rem 0 1.5rem", fontSize: "2rem" }}>
        All Videos ({videos.length})
      </h2>

      {videos.length === 0 ? (
        <p
          style={{
            textAlign: "center",
            fontSize: "1.3rem",
            color: "#888",
            margin: "4rem 0",
          }}
        >
          No Bunny videos found.
        </p>
      ) : (
        <div className="bunny-grid">
          {videos.map((video) => (
            <div key={video.guid} className="bunny-card">
              <div className="bunny-header">
                <h3>{video.title || "Untitled"}</h3>
                <p style={{ fontSize: "0.9rem", opacity: 0.8 }}>
                  Uploaded: {new Date(video.dateUploaded).toLocaleDateString()}
                </p>
              </div>

              {video.thumbnailFileName && (
                <img
                  src={getThumbnailUrl(video.guid)}
                  alt={video.title}
                  className="bunny-thumbnail"
                />
              )}

              {video.hasMP4Fallback ? (
                <video controls className="bunny-video">
                  <source src={getVideoUrl(video.guid)} type="video/mp4" />
                  Your browser does not support the video.
                </video>
              ) : (
                <div className="no-video">No MP4 fallback</div>
              )}

              <button
                onClick={() => handleDelete(video.guid)}
                className="btn delete-btn"
              >
                Delete Video
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BunnyVideos;
