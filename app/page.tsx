"use client";

import type React from "react";

import { useState, useCallback, useEffect } from "react";
import { Upload, Download, Copy, Settings, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { AuthHeader } from "@/components/auth-header";
import { toast } from "sonner";
import { getImageSize } from "@/utils/imageSize"; // Assuming you have a utility to get image size
import { useSession } from "next-auth/react";
import { UserDetailsDto } from "../types/user.dto";
import { AuthModal } from "@/components/auth-modal";

interface CompressedImage {
  url: string;
  originalSize: number;
  compressedSize: number;
  format: string;
  quality: number;
}

export default function NimbusImageCompressor() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [quality, setQuality] = useState([80]);
  const [format, setFormat] = useState("webp");
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressedImage, setCompressedImage] =
    useState<CompressedImage | null>(null);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [width, setWidth] = useState<string>("");
  const [height, setHeight] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [savedSpace, setSavedSpace] = useState<number | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { data: session, status } = useSession();
  const [user, setUser] = useState<UserDetailsDto | null>(null);

  const uploadFile = async (file: File) => {
    // Check if user is authenticated
    if (status === "unauthenticated") {
      setShowAuthModal(true);
      return null;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      // Upload the image using the upload API route
      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || "Failed to upload image");
      }

      const uploadData = await uploadResponse.json();
      setUploadedUrl(uploadData.url);
      toast.success("Image uploaded successfully!");
      return uploadData.url;
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload image"
      );
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = useCallback(
    async (file: File) => {
      // Check if user is authenticated
      if (status === "unauthenticated") {
        setShowAuthModal(true);
        return;
      }

      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file.");
        return;
      }

      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setCompressedImage(null);

      // Automatically upload the file
      await uploadFile(file);
    },
    [status, toast]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };
  const compressImage = async () => {
    if (!selectedFile || !uploadedUrl) return;

    // Check if user is authenticated
    if (status === "unauthenticated") {
      setShowAuthModal(true);
      return;
    }

    setIsCompressing(true);

    try {
      const originalSize = selectedFile.size;
      const finalUrl = new URL(uploadedUrl);
      finalUrl.searchParams.set("quality", quality[0].toString());
      finalUrl.searchParams.set("format", format);
      const compressionRatio = quality[0] / 100;
      if (showAdvancedOptions) {
        if (width) finalUrl.searchParams.set("width", width);
        if (height) finalUrl.searchParams.set("height", height);
      }

      // Construct the size URL using the same path structure but with /size/ prefix
      const sizeUrl = new URL(finalUrl.toString());
      const pathname = sizeUrl.pathname;
      sizeUrl.pathname = `/size${pathname}`;

      // Get the compressed size from the size endpoint
      const compressedSize =
        (await getImageSize(sizeUrl.toString())) ||
        Math.floor(originalSize * compressionRatio * 0.7);
      // console.log("Compressed size:", compressedSize);
      setSavedSpace(
        Math.round(((originalSize - compressedSize) / originalSize) * 100)
      );
      const compressedImageData: CompressedImage = {
        url: finalUrl.toString(), // Use the real uploaded URL
        originalSize,
        compressedSize: compressedSize, // Fallback if size can't be determined
        format,
        quality: quality[0],
      };

      setCompressedImage(compressedImageData);
      setIsCompressing(false);

      toast.success("Image compression completed successfully!");
    } catch (error) {
      console.error("Compression error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to compress image"
      );
      setIsCompressing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Link copied successfully!");
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (
      Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    );
  };

  const downloadImage = async (url: string) => {
    setIsDownloading(true);
    try {
      // Fetch the image
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to download image");
      }

      // Get the blob from response
      const blob = await response.blob();

      // Create object URL from blob
      const objectUrl = URL.createObjectURL(blob);

      // Create temporary link element
      const link = document.createElement("a");

      // Set link properties
      link.href = objectUrl;

      // Extract filename from URL or create one based on format
      const urlParts = url.split("/");
      let filename = urlParts[urlParts.length - 1].split("?")[0];

      // If filename doesn't have extension, add it based on format
      if (!filename.includes(".")) {
        filename = `compressed-image.${format}`;
      }

      link.download = filename;

      // Append to body, click and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Revoke object URL to free memory
      URL.revokeObjectURL(objectUrl);

      toast.success("Image downloaded successfully!");
    } catch (error) {
      console.error("Download error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to download image"
      );
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    if (status === "loading") return; // Wait for session to load
    if (status === "unauthenticated") {
      return;
    }
    fetch("/api/user").then(async (res) => {
      if (!res.ok) {
        throw new Error("Failed to fetch user data");
      }
      const data = await res.json();
      setUser(data);
    });
  }, [status]);

  return (
    <div className="min-h-screen bg-background">
      <AuthHeader details={user} />
      <AuthModal open={showAuthModal} onOpenChange={() => setShowAuthModal(false)} />

      <div className="p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 pt-8">
            <p className="text-muted-foreground text-lg">
              Compress and optimize your images with lightning speed
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Upload Image
                </CardTitle>
                <CardDescription>
                  Drag and drop your image or click to browse
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className={`border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer ${
                    isUploading ? "opacity-50 pointer-events-none" : ""
                  }`}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() =>
                    !isUploading &&
                    document.getElementById("file-input")?.click()
                  }
                >
                  <input
                    id="file-input"
                    type="file"
                    accept="image/*"
                    onChange={handleFileInput}
                    className="hidden"
                    disabled={isUploading}
                  />
                  {previewUrl ? (
                    <div className="space-y-4">
                      <div className="relative w-full h-48 rounded-lg overflow-hidden">
                        <Image
                          src={previewUrl || "/placeholder.svg"}
                          alt="Preview"
                          fill
                          className="object-contain"
                        />
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p className="font-medium">{selectedFile?.name}</p>
                        <p>{formatFileSize(selectedFile?.size || 0)}</p>
                        {isUploading && (
                          <p className="text-primary mt-2">Uploading...</p>
                        )}
                        {uploadedUrl && !isUploading && (
                          <p className="text-green-500 mt-2">
                            Upload complete!
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto" />
                      <div>
                        <p className="text-lg font-medium text-foreground">
                          Drop your image here
                        </p>
                        <p className="text-muted-foreground">
                          or click to browse
                        </p>
                      </div>
                      <Badge variant="secondary">
                        PNG, JPG, WEBP up to 10MB
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Settings Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Compression Settings
                </CardTitle>
                <CardDescription>
                  Adjust quality and format for optimal results
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Quality: {quality[0]}%</Label>
                  <Slider
                    value={quality}
                    onValueChange={setQuality}
                    max={100}
                    min={10}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Smaller file</span>
                    <span>Better quality</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Output Format</Label>
                  <Select value={format} onValueChange={setFormat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="webp">WebP (Recommended)</SelectItem>
                      <SelectItem value="jpeg">JPEG</SelectItem>
                      <SelectItem value="png">PNG</SelectItem>
                      <SelectItem value="avif">AVIF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="advanced-options"
                    checked={showAdvancedOptions}
                    onCheckedChange={setShowAdvancedOptions}
                  />
                  <Label htmlFor="advanced-options">Advanced Options</Label>
                </div>

                {showAdvancedOptions && (
                  <div className="space-y-3 p-3 border rounded-md bg-muted/30">
                    <h4 className="text-sm font-medium">Resize Image</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="width">Width (px)</Label>
                        <Input
                          id="width"
                          type="number"
                          placeholder="Auto"
                          value={width}
                          onChange={(e) => setWidth(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="height">Height (px)</Label>
                        <Input
                          id="height"
                          type="number"
                          placeholder="Auto"
                          value={height}
                          onChange={(e) => setHeight(e.target.value)}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Leave empty to maintain aspect ratio
                    </p>
                  </div>
                )}

                <Button
                  onClick={compressImage}
                  disabled={
                    !selectedFile ||
                    isCompressing ||
                    isUploading ||
                    !uploadedUrl
                  }
                  className="w-full"
                  size="lg"
                >
                  {isCompressing
                    ? "Compressing..."
                    : isUploading
                    ? "Uploading..."
                    : "Compress Image"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Results Section */}
          {compressedImage && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Compression Results</CardTitle>
                <CardDescription>
                  Your optimized image is ready to use
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Compression Stats</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-muted p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          Original Size
                        </p>
                        <p className="text-lg font-semibold">
                          {formatFileSize(compressedImage.originalSize)}
                        </p>
                      </div>
                      <div className="bg-muted p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          Compressed Size
                        </p>
                        <p className="text-lg font-semibold text-foreground">
                          {formatFileSize(compressedImage.compressedSize)}
                        </p>
                      </div>
                    </div>
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        Space Saved
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        {savedSpace !== null ? `${savedSpace}%` : "0"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Shareable Link</h3>
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-2">
                        CDN URL
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-sm bg-background p-2 rounded border font-mono">
                          {compressedImage.url}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(compressedImage.url)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => downloadImage(compressedImage.url)}
                        disabled={isDownloading}
                      >
                        {isDownloading ? (
                          <>Downloading...</>
                        ) : (
                          <>
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
