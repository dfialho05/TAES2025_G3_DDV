<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class FileController extends Controller
{
    public function uploadUserPhoto(Request $request)
    {
        $request->validate([
            "photo" => "required|image|mimes:jpeg,png,jpg,gif|max:2048",
        ]);

        if ($request->file("photo")->isValid()) {
            // AQUI ESTÁ O SEGREDO: define 'photos_avatars' como a pasta de destino no disco 'public'
            $path = $request->file("photo")->store("photos_avatars", "public");

            return response()->json(
                [
                    // Retorna apenas o nome do ficheiro (ex: "hash.jpg") para o Vue enviar ao patchPhotoURL
                    "filename" => basename($path),
                    "location" => $path,
                ],
                201,
            );
        }

        return response()->json(["message" => "Upload failed"], 500);
    }

    public function uploadCardFaces(Request $request)
    {
        $request->validate([
            "cardfaces" => "required",
            "cardfaces.*" => "image|mimes:jpeg,png,jpg,gif|max:2048",
        ]);

        $uploadedFiles = [];

        $files = is_array($request->file("cardfaces"))
            ? $request->file("cardfaces")
            : [$request->file("cardfaces")];

        foreach ($files as $file) {
            $path = $file->store("cardfaces", "public");
            $uploadedFiles[] = [
                "cardface_url" => "/storage/" . $path,
            ];
        }

        return response()->json(
            [
                "files" => $uploadedFiles,
            ],
            200,
        );
    }
}
