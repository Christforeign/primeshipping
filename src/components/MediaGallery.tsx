import { isDirectVideo } from "@/lib/upload";
import { useState } from "react";
import { Play, Image as ImageIcon } from "lucide-react";

interface MediaGalleryProps {
  mediaUrls: string[];
  videoUrl?: string | null;
  title: string;
}

export function MediaGallery({ mediaUrls, videoUrl, title }: MediaGalleryProps) {
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [showVideo, setShowVideo] = useState<boolean>(false);

  const images =
    mediaUrls && mediaUrls.length > 0
      ? mediaUrls
      : [
          "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=1000&q=80",
        ];

  const currentImg = images[selectedIdx] || images[0];

  // Helper to get youtube embed url
  const getEmbedUrl = (url: string) => {
    try {
      if (url.includes("youtube.com") || url.includes("youtu.be")) {
        const id = url.includes("youtu.be")
          ? url.split("youtu.be/")[1]?.split("?")[0]
          : new URL(url).searchParams.get("v");
        return id ? `https://www.youtube.com/embed/${id}` : url;
      }
      if (url.includes("vimeo.com")) {
        const id = url.split("vimeo.com/")[1]?.split("?")[0];
        return id ? `https://player.vimeo.com/video/${id}` : url;
      }
    } catch {
      return url;
    }
    return url;
  };

  return (
    <div className="space-y-3">
      {/* Main Display */}
      <div className="relative aspect-video sm:aspect-square w-full rounded-2xl overflow-hidden bg-muted border">
        {showVideo && videoUrl ? (
          isDirectVideo(videoUrl) ? (
            <video
              src={videoUrl}
              controls
              autoPlay
              className="w-full h-full object-contain bg-black"
            />
          ) : (
            <iframe
              src={getEmbedUrl(videoUrl)}
              title={title}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )
        ) : (
          <img
            src={currentImg}
            alt={title}
            className="w-full h-full object-cover transition-all duration-300"
          />
        )}

        {/* Video toggle pill if video exists */}
        {videoUrl && (
          <button
            onClick={() => setShowVideo(!showVideo)}
            className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/75 hover:bg-black text-white text-xs font-semibold backdrop-blur-sm transition-all"
          >
            {showVideo ? (
              <>
                <ImageIcon className="h-3.5 w-3.5" /> Voir les photos
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" /> Voir la vidéo
              </>
            )}
          </button>
        )}
      </div>

      {/* Thumbnails */}
      {(images.length > 1 || videoUrl) && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => {
                setSelectedIdx(idx);
                setShowVideo(false);
              }}
              className={`relative h-16 w-16 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                !showVideo && selectedIdx === idx
                  ? "border-primary ring-2 ring-primary/20 scale-105"
                  : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <img src={img} alt={`${title} ${idx + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
          {videoUrl && (
            <button
              onClick={() => setShowVideo(true)}
              className={`relative h-16 w-16 flex-shrink-0 rounded-xl overflow-hidden border-2 flex flex-col items-center justify-center bg-forest text-accent transition-all ${
                showVideo
                  ? "border-primary ring-2 ring-primary/20 scale-105"
                  : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <Play className="h-5 w-5 fill-current" />
              <span className="text-[10px] font-bold mt-0.5">Vidéo</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
