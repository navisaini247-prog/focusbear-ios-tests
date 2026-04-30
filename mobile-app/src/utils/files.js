// Utility helpers for file handling

/**
 * Infer an audio file extension from a local URI or a MIME content type.
 * Defaults to "mp3" if nothing usable is found.
 */
export const inferAudioFileExtension = (localUri, fileName, contentType) => {
  try {
    if (typeof fileName === "string" && fileName.trim()) {
      const name = fileName.split("?")[0];
      const dotIdx = name.lastIndexOf(".");
      if (dotIdx !== -1 && dotIdx < name.length - 1) {
        const ext = name.substring(dotIdx + 1).toLowerCase();
        if (ext && ext.length <= 5) return ext.replace(/[^a-z0-9]/g, "");
      }
    }
  } catch {
    /* empty */
  }

  try {
    if (typeof localUri === "string") {
      const uriPath = localUri.split("?")[0];
      const lastSlash = Math.max(uriPath.lastIndexOf("/"), uriPath.lastIndexOf("\\"));
      const filename = lastSlash !== -1 ? uriPath.substring(lastSlash + 1) : uriPath;
      const dotIdx = filename.lastIndexOf(".");
      if (dotIdx !== -1 && dotIdx < filename.length - 1) {
        const ext = filename.substring(dotIdx + 1).toLowerCase();
        if (ext && ext.length <= 5) return ext.replace(/[^a-z0-9]/g, "");
      }
    }
  } catch {
    /* empty */
  }

  if (contentType === "audio/mpeg") return "mp3";
  if (contentType === "audio/mp4") return "mp4";
  if (contentType === "audio/aac") return "aac";
  if (contentType === "audio/wav" || contentType === "audio/x-wav") return "wav";
  if (contentType === "audio/ogg") return "ogg";

  return "mp3";
};
