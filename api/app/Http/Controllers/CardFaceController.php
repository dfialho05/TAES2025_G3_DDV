<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCardFaceRequest;
use App\Http\Resources\CardFaceResource;
use App\Models\CardFace;

class CardFaceController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return CardFaceResource::collection(CardFace::all());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreCardFaceRequest $request)
    {
        $cardFace = CardFace::create($request->validated());
        return new CardFaceResource($cardFace);
    }

    /**
     * Display the specified resource.
     */
    public function show(CardFace $cardFace)
    {
        return new CardFaceResource($cardFace);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(StoreCardFaceRequest $request, CardFace $cardFace)
    {
        $cardFace->update($request->validated());
        return new CardFaceResource($cardFace);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(CardFace $cardFace)
    {
        $cardFace->delete();
        return response()->noContent();
    }
}
