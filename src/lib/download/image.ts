const getFileNameFromPath = (path: string, fallback: string) => {
  const name = path.split("/").pop();
  return name || fallback;
};

export const downloadImageFromUrl = async (
  url: string,
  fileName: string,
) => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to download image.");
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
};

export const getImageDownloadName = (path: string, fallback: string) =>
  getFileNameFromPath(path, fallback);
