// Helper to convert data URL to pure base64
const dataURLtoBase64 = (dataUrl: string): string => {
  return dataUrl.split(",")[1];
};

// Helper to load a video file into an in-memory video element
const loadVideo = (file: File): Promise<HTMLVideoElement> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;

    const url = URL.createObjectURL(file);

    video.onloadedmetadata = () => {
      resolve(video);
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load video file."));
    };

    video.src = url;
  });
};

/**
 * Extracts frames from a video file at specific timestamps.
 * @param file The video file.
 * @param frameTimestamps An array of times (in seconds) to extract frames from.
 * @returns A promise that resolves to an array of base64 encoded frame strings.
 */
export const extractFrames = async (
  file: File,
  frameTimestamps: number[]
): Promise<string[]> => {
  const video = await loadVideo(file);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    URL.revokeObjectURL(video.src);
    throw new Error("Could not get canvas context");
  }

  const frames: string[] = [];

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  for (const time of frameTimestamps) {
    // Using a promise-based approach to handle the async 'seeked' event
    await new Promise<void>((resolve, reject) => {
      const onSeeked = () => {
        video.removeEventListener("seeked", onSeeked);
        video.removeEventListener("error", onError);

        try {
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL("image/jpeg");
          frames.push(dataURLtoBase64(dataUrl));
          resolve();
        } catch (e) {
          reject(e);
        }
      };

      const onError = () => {
        video.removeEventListener("seeked", onSeeked);
        video.removeEventListener("error", onError);
        reject(new Error(`Error seeking to time ${time}`));
      };

      video.addEventListener("seeked", onSeeked, { once: true });
      video.addEventListener("error", onError, { once: true });

      video.currentTime = Math.min(time, video.duration);
    });
  }

  // Important: Clean up the object URL to prevent memory leaks
  URL.revokeObjectURL(video.src);

  return frames;
};
