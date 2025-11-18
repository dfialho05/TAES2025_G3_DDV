<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBoardThemeRequest;
use App\Http\Resources\BoardThemeResource;
use App\Models\BoardTheme;

class BoardThemeController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(BoardTheme::class, 'board_theme');
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return BoardThemeResource::collection(BoardTheme::all());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreBoardThemeRequest $request)
    {
        $theme = BoardTheme::create($request->validated());
        return new BoardThemeResource($theme);
    }

    /**
     * Display the specified resource.
     */
    public function show(BoardTheme $board_theme)
    {
        return new BoardThemeResource($board_theme);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(StoreBoardThemeRequest $request, BoardTheme $board_theme)
    {
        $board_theme->update($request->validated());

        return new BoardThemeResource($board_theme);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(BoardTheme $board_theme)
    {
        $board_theme->delete();
        return response()->noContent();
    }
}
