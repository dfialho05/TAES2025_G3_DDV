<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class FileController extends Controller
{
    public function uploadUserPhoto(Request $request)
    {
        $request->validate([
            'photo' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $file = $request->file('photo');
        $path = $file->store('photos', 'public');

        return response()->json([
            'photo_url' => '/storage/' . $path,
        ], 200);
    }


    public function uploadCardFaces(Request $request)
    {
        $request->validate([
            'cardfaces' => 'required',
            'cardfaces.*' => 'image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $uploadedFiles = [];

        $files = is_array($request->file('cardfaces'))
            ? $request->file('cardfaces')
            : [$request->file('cardfaces')];

        foreach ($files as $file) {
            $path = $file->store('cardfaces', 'public');
            $uploadedFiles[] = [
                'cardface_url' => '/storage/' . $path,
            ];
        }

        return response()->json([
            'files' => $uploadedFiles,
        ], 200);
    }
}
