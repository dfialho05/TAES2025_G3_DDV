<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use Illuminate\Http\Request;
use App\Models\User;
use App\Http\Resources\UserResource;
use Illuminate\Support\Facades\Storage;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return UserResource::collection(User::all());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreUserRequest $request)
    {
        $user = User::create($request->validated());
        return new UserResource($user);
    }

    /**
     * Display the specified resource.
     */
    public function show(User $user)
    {
        return new UserResource($user);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateUserRequest $request, User $user)
    {
        $user->update($request->validated());
        return new UserResource($user);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(User $user)
    {
        //
    }

    public function patchPhotoURL(Request $request, User $user)
    {
        $data = $request->validate([
            "photo_url" => "required|string", // O Vue vai enviar o nome do ficheiro aqui
        ]);

        // 1. Define a pasta correta
        $folder = "photos_avatars";

        // 2. Verifica se existe foto antiga na pasta correta e apaga
        // Nota: usa 'photo_avatar_filename' que é o nome real da tua coluna na BD
        if (
            $user->photo_avatar_filename &&
            Storage::disk("public")->exists(
                $folder . "/" . $user->photo_avatar_filename,
            )
        ) {
            Storage::disk("public")->delete(
                $folder . "/" . $user->photo_avatar_filename,
            );
        }

        // 3. Salva apenas o nome do ficheiro na coluna correta
        $user->photo_avatar_filename = basename($data["photo_url"]);
        $user->save();

        return response()->json([
            "success" => true,
            "user" => new UserResource($user),
        ]);
    }
}
