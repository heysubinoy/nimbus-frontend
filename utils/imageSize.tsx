export async function getImageSize(url: string): Promise<number | null> {
  try {
    const response = await fetch(url, { method: "HEAD" });

    const contentLength = response.headers.get("Content-Length");

    if (contentLength) {
      const sizeInBytes = parseInt(contentLength, 10);
      return sizeInBytes;
    }

    return null;
  } catch (error) {
    console.error("Failed to get image size:", error);
    return null;
  }
}
