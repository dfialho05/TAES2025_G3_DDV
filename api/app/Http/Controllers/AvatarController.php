<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use SplFileInfo;

class AvatarController extends Controller
{
    /**
     * Serve avatar image with proper CORS headers
     *
     * @param string $filename
     * @return Response
     */
    public function show($filename)
    {
        try {
            // Validate filename format
            if (!preg_match('/^[a-zA-Z0-9_\-\.]+$/', $filename)) {
                Log::warning("AvatarController: Invalid filename format", [
                    "filename" => $filename,
                ]);
                abort(404, "Invalid filename format");
            }

            // Construct full path
            $path = storage_path("app/public/photos_avatars/" . $filename);

            // Check if file exists
            if (!file_exists($path)) {
                Log::info("AvatarController: Avatar file not found", [
                    "filename" => $filename,
                    "path" => $path,
                ]);
                abort(404, "Avatar not found");
            }

            // Get file info and determine MIME type
            $file = new SplFileInfo($path);
            $mimeType = $this->getMimeType($file->getExtension());

            Log::debug("AvatarController: Serving avatar", [
                "filename" => $filename,
                "mime_type" => $mimeType,
                "file_size" => filesize($path),
            ]);

            // Return file with appropriate headers
            return response()->file($path, [
                "Content-Type" => $mimeType,
                "Access-Control-Allow-Origin" => "*",
                "Access-Control-Allow-Methods" => "GET, HEAD, OPTIONS",
                "Access-Control-Allow-Headers" =>
                    "Content-Type, Accept, Origin",
                "Cache-Control" => "public, max-age=3600",
                "Expires" => gmdate("D, d M Y H:i:s \G\M\T", time() + 3600),
                "Last-Modified" => gmdate(
                    "D, d M Y H:i:s \G\M\T",
                    filemtime($path),
                ),
            ]);
        } catch (\Exception $e) {
            Log::error("AvatarController: Error serving avatar", [
                "filename" => $filename,
                "error" => $e->getMessage(),
                "trace" => $e->getTraceAsString(),
            ]);

            abort(500, "Internal server error");
        }
    }

    /**
     * Handle OPTIONS request for CORS preflight
     *
     * @return Response
     */
    public function options()
    {
        return response("", 200, [
            "Access-Control-Allow-Origin" => "*",
            "Access-Control-Allow-Methods" => "GET, HEAD, OPTIONS",
            "Access-Control-Allow-Headers" => "Content-Type, Accept, Origin",
            "Access-Control-Max-Age" => "86400",
        ]);
    }

    /**
     * Get MIME type based on file extension
     *
     * @param string $extension
     * @return string
     */
    private function getMimeType($extension)
    {
        return match (strtolower($extension)) {
            "jpg", "jpeg" => "image/jpeg",
            "png" => "image/png",
            "gif" => "image/gif",
            "webp" => "image/webp",
            "svg" => "image/svg+xml",
            "bmp" => "image/bmp",
            "ico" => "image/x-icon",
            default => "application/octet-stream",
        };
    }

    /**
     * Get avatar statistics (for debugging/admin)
     *
     * @return Response
     */
    public function stats()
    {
        try {
            $avatarPath = storage_path("app/public/photos_avatars/");

            if (!is_dir($avatarPath)) {
                return response()->json(
                    ["error" => "Avatar directory not found"],
                    404,
                );
            }

            $files = glob($avatarPath . "*");
            $totalFiles = count($files);
            $totalSize = array_sum(array_map("filesize", $files));

            $stats = [
                "total_avatars" => $totalFiles,
                "total_size_bytes" => $totalSize,
                "total_size_mb" => round($totalSize / 1024 / 1024, 2),
                "avatar_directory" => $avatarPath,
                "sample_files" => array_slice(
                    array_map("basename", $files),
                    0,
                    5,
                ),
            ];

            return response()->json($stats);
        } catch (\Exception $e) {
            Log::error("AvatarController: Error getting stats", [
                "error" => $e->getMessage(),
            ]);

            return response()->json(["error" => "Internal server error"], 500);
        }
    }

    /**
     * Test avatar serving (for debugging)
     *
     * @param string $filename
     * @return Response
     */
    public function test($filename)
    {
        try {
            $path = storage_path("app/public/photos_avatars/" . $filename);

            $response = [
                "filename" => $filename,
                "path" => $path,
                "file_exists" => file_exists($path),
                "is_readable" => is_readable($path),
                "file_size" => file_exists($path) ? filesize($path) : 0,
                "mime_type" => file_exists($path)
                    ? $this->getMimeType(pathinfo($path, PATHINFO_EXTENSION))
                    : null,
                "server_url" =>
                    request()->getSchemeAndHttpHost() .
                    "/api/avatars/" .
                    $filename,
                "storage_path" => storage_path(),
                "public_path" => public_path(),
            ];

            if (file_exists($path)) {
                $response["file_info"] = [
                    "modified" => date("Y-m-d H:i:s", filemtime($path)),
                    "permissions" => substr(
                        sprintf("%o", fileperms($path)),
                        -4,
                    ),
                ];
            }

            return response()->json($response);
        } catch (\Exception $e) {
            return response()->json(
                [
                    "error" => $e->getMessage(),
                    "filename" => $filename,
                ],
                500,
            );
        }
    }
}
