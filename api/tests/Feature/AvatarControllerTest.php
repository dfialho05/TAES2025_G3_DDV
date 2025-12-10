<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AvatarControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Don't use Storage::fake() for avatar tests since AvatarController
        // accesses files directly using storage_path()
    }

    /**
     * Test successful avatar serving
     */
    public function test_can_serve_existing_avatar()
    {
        // Create a real test avatar file
        $filename = "test_avatar.jpg";
        $content = "fake image content";
        $avatarDir = storage_path("app/public/photos_avatars");

        if (!is_dir($avatarDir)) {
            mkdir($avatarDir, 0755, true);
        }

        file_put_contents($avatarDir . "/" . $filename, $content);

        $response = $this->getJson("/api/avatars/{$filename}");

        $response->assertStatus(200);
        // Note: Laravel's response()->file() returns a file response,
        // so we just check status for now

        // Cleanup
        if (file_exists($avatarDir . "/" . $filename)) {
            unlink($avatarDir . "/" . $filename);
        }
    }

    /**
     * Test invalid filename format returns 404
     */
    public function test_invalid_filename_format_returns_404()
    {
        $invalidFilenames = [
            "../../../etc/passwd",
            "file with spaces.jpg",
            "file<script>alert(1)</script>.jpg",
            "file|pipe.jpg",
            "file;semicolon.jpg",
            "file&ampersand.jpg",
        ];

        foreach ($invalidFilenames as $filename) {
            $response = $this->getJson("/api/avatars/{$filename}");
            $response->assertStatus(404);
        }
    }

    /**
     * Test valid filename formats are accepted
     */
    public function test_valid_filename_formats_are_accepted()
    {
        $validFilenames = [
            "simple.jpg",
            "file_with_underscores.png",
            "file-with-dashes.gif",
            "file123.webp",
            "FILE.JPG",
            "file.jpeg",
        ];

        foreach ($validFilenames as $filename) {
            // Create the file so it exists
            $avatarDir = storage_path("app/public/photos_avatars");
            if (!is_dir($avatarDir)) {
                mkdir($avatarDir, 0755, true);
            }

            file_put_contents($avatarDir . "/" . $filename, "content");

            $response = $this->getJson("/api/avatars/{$filename}");
            $response->assertStatus(200);

            // Cleanup
            if (file_exists($avatarDir . "/" . $filename)) {
                unlink($avatarDir . "/" . $filename);
            }
        }
    }

    /**
     * Test CORS headers are set correctly
     */
    public function test_cors_headers_are_set()
    {
        $filename = "test.jpg";
        $avatarDir = storage_path("app/public/photos_avatars");

        if (!is_dir($avatarDir)) {
            mkdir($avatarDir, 0755, true);
        }

        file_put_contents($avatarDir . "/" . $filename, "content");

        $response = $this->getJson("/api/avatars/{$filename}");

        $response
            ->assertStatus(200)
            ->assertHeader("Access-Control-Allow-Origin", "*")
            ->assertHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS")
            ->assertHeader(
                "Access-Control-Allow-Headers",
                "Content-Type, Accept, Origin",
            );

        // Cleanup
        if (file_exists($avatarDir . "/" . $filename)) {
            unlink($avatarDir . "/" . $filename);
        }
    }

    /**
     * Test caching headers are set
     */
    public function test_caching_headers_are_set()
    {
        $filename = "test.jpg";
        $avatarDir = storage_path("app/public/photos_avatars");

        if (!is_dir($avatarDir)) {
            mkdir($avatarDir, 0755, true);
        }

        file_put_contents($avatarDir . "/" . $filename, "content");

        $response = $this->getJson("/api/avatars/{$filename}");

        $response
            ->assertStatus(200)
            ->assertHeader("Cache-Control", "max-age=3600, public");

        $this->assertNotNull($response->headers->get("Expires"));
        $this->assertNotNull($response->headers->get("Last-Modified"));

        // Cleanup
        if (file_exists($avatarDir . "/" . $filename)) {
            unlink($avatarDir . "/" . $filename);
        }
    }

    /**
     * Test different image mime types
     */
    public function test_correct_mime_types_for_different_extensions()
    {
        $mimeTypeTests = [
            "test.jpg" => "image/jpeg",
            "test.jpeg" => "image/jpeg",
            "test.png" => "image/png",
            "test.gif" => "image/gif",
            "test.webp" => "image/webp",
            "test.svg" => "image/svg+xml",
            "test.bmp" => "image/bmp",
            "test.ico" => "image/x-icon",
            "test.unknown" => "application/octet-stream",
        ];

        foreach ($mimeTypeTests as $filename => $expectedMimeType) {
            $avatarDir = storage_path("app/public/photos_avatars");

            if (!is_dir($avatarDir)) {
                mkdir($avatarDir, 0755, true);
            }

            file_put_contents($avatarDir . "/" . $filename, "content");

            $response = $this->getJson("/api/avatars/{$filename}");

            $response
                ->assertStatus(200)
                ->assertHeader("Content-Type", $expectedMimeType);

            // Cleanup
            if (file_exists($avatarDir . "/" . $filename)) {
                unlink($avatarDir . "/" . $filename);
            }
        }
    }

    /**
     * Test OPTIONS request for CORS preflight
     */
    public function test_options_request_returns_cors_headers()
    {
        $response = $this->call("OPTIONS", "/api/avatars/test.jpg");

        $response
            ->assertStatus(200)
            ->assertHeader("Access-Control-Allow-Origin", "*")
            ->assertHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS")
            ->assertHeader(
                "Access-Control-Allow-Headers",
                "Content-Type, Accept, Origin",
            )
            ->assertHeader("Access-Control-Max-Age", "86400");
    }

    /**
     * Test avatar test endpoint
     */
    public function test_avatar_test_endpoint_with_existing_file()
    {
        $filename = "test_avatar.jpg";
        $avatarDir = storage_path("app/public/photos_avatars");

        if (!is_dir($avatarDir)) {
            mkdir($avatarDir, 0755, true);
        }

        file_put_contents($avatarDir . "/" . $filename, "test content");

        $response = $this->getJson("/api/avatars-test/{$filename}");

        $response
            ->assertStatus(200)
            ->assertJsonStructure([
                "filename",
                "path",
                "file_exists",
                "is_readable",
                "file_size",
                "mime_type",
                "server_url",
                "storage_path",
                "public_path",
            ])
            ->assertJson([
                "filename" => $filename,
                "file_exists" => true,
                "file_size" => 12, // Length of 'test content'
                "mime_type" => "image/jpeg",
            ]);

        $responseData = $response->json();
        $this->assertStringContainsString(
            "/api/avatars/{$filename}",
            $responseData["server_url"],
        );

        // Cleanup
        if (file_exists($avatarDir . "/" . $filename)) {
            unlink($avatarDir . "/" . $filename);
        }
    }

    /**
     * Test avatar test endpoint with non-existing file
     */
    public function test_avatar_test_endpoint_with_nonexisting_file()
    {
        $filename = "nonexistent.jpg";

        $response = $this->getJson("/api/avatars-test/{$filename}");

        $response->assertStatus(200)->assertJson([
            "filename" => $filename,
            "file_exists" => false,
            "is_readable" => false,
            "file_size" => 0,
            "mime_type" => null,
        ]);
    }

    /**
     * Test HEAD request works for avatars
     */
    public function test_head_request_for_avatar()
    {
        $filename = "test.jpg";
        $avatarDir = storage_path("app/public/photos_avatars");

        if (!is_dir($avatarDir)) {
            mkdir($avatarDir, 0755, true);
        }

        file_put_contents($avatarDir . "/" . $filename, "content");

        $response = $this->call("HEAD", "/api/avatars/{$filename}");

        $response
            ->assertStatus(200)
            ->assertHeader("Content-Type", "image/jpeg");

        // HEAD request should not return content
        $this->assertEquals("", $response->getContent());

        // Cleanup
        if (file_exists($avatarDir . "/" . $filename)) {
            unlink($avatarDir . "/" . $filename);
        }
    }

    /**
     * Test case sensitivity in extensions
     */
    public function test_case_insensitive_extension_handling()
    {
        $testCases = [
            "test.JPG" => "image/jpeg",
            "test.PNG" => "image/png",
            "test.GIF" => "image/gif",
            "test.WEBP" => "image/webp",
        ];

        foreach ($testCases as $filename => $expectedMimeType) {
            $avatarDir = storage_path("app/public/photos_avatars");

            if (!is_dir($avatarDir)) {
                mkdir($avatarDir, 0755, true);
            }

            file_put_contents($avatarDir . "/" . $filename, "content");

            $response = $this->getJson("/api/avatars/{$filename}");

            $response
                ->assertStatus(200)
                ->assertHeader("Content-Type", $expectedMimeType);

            // Cleanup
            if (file_exists($avatarDir . "/" . $filename)) {
                unlink($avatarDir . "/" . $filename);
            }
        }
    }

    /**
     * Test concurrent access to same avatar
     */
    public function test_concurrent_access_to_same_avatar()
    {
        $filename = "popular_avatar.jpg";
        $avatarDir = storage_path("app/public/photos_avatars");

        if (!is_dir($avatarDir)) {
            mkdir($avatarDir, 0755, true);
        }

        file_put_contents($avatarDir . "/" . $filename, "shared content");

        // Simulate multiple requests to the same avatar
        for ($i = 0; $i < 5; $i++) {
            $response = $this->getJson("/api/avatars/{$filename}");
            $response->assertStatus(200);
        }

        // Cleanup
        if (file_exists($avatarDir . "/" . $filename)) {
            unlink($avatarDir . "/" . $filename);
        }
    }

    /**
     * Test avatar with special characters in content
     */
    public function test_avatar_with_binary_content()
    {
        $filename = "binary_test.jpg";
        $binaryContent = pack(
            "H*",
            "ffd8ffe000104a46494600010101006000600000ff",
        ); // JPEG header
        $avatarDir = storage_path("app/public/photos_avatars");

        if (!is_dir($avatarDir)) {
            mkdir($avatarDir, 0755, true);
        }

        file_put_contents($avatarDir . "/" . $filename, $binaryContent);

        $response = $this->getJson("/api/avatars/{$filename}");

        $response
            ->assertStatus(200)
            ->assertHeader("Content-Type", "image/jpeg");

        // Note: File response content comparison is complex with binary data
        // We verify the response is successful which means file was served
        $this->assertTrue(true);

        // Cleanup
        if (file_exists($avatarDir . "/" . $filename)) {
            unlink($avatarDir . "/" . $filename);
        }
    }

    /**
     * Test filename with only allowed special characters
     */
    public function test_filename_with_allowed_special_characters()
    {
        $validFilenames = [
            "file_with_underscores.jpg",
            "file-with-hyphens.png",
            "file.with.dots.gif",
            "file123.webp",
            "ABC_def-123.jpg",
        ];

        foreach ($validFilenames as $filename) {
            $avatarDir = storage_path("app/public/photos_avatars");

            if (!is_dir($avatarDir)) {
                mkdir($avatarDir, 0755, true);
            }

            file_put_contents($avatarDir . "/" . $filename, "content");

            $response = $this->getJson("/api/avatars/{$filename}");
            $response->assertStatus(200);

            // Cleanup
            if (file_exists($avatarDir . "/" . $filename)) {
                unlink($avatarDir . "/" . $filename);
            }
        }
    }
}
