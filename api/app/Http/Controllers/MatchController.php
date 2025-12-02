<?php

namespace App\Http\Controllers;

use App\Models\Matches;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class MatchController extends Controller
{
    /**
     * 1. ADMIN ONLY: Lists ALL matches in the system.
     * Only users with type 'A' can access.
     */
    public function index(Request $request): JsonResponse
    {
        // Security check: Only Admins can proceed
        if ($request->user()->type !== "A") {
            return response()->json(
                ["message" => "Unauthorized. Admin only."],
                403,
            );
        }

        $matches = Matches::with([
            "player1:id,name,email",
            "player2:id,name,email",
            "winner:id,name",
        ])
            ->orderBy("began_at", "desc")
            ->paginate(15);

        return response()->json($matches);
    }

    /**
     * 2. MY HISTORY: Lists the matches of the LOGGED-IN user.
     * Any authenticated user can view their own list.
     */
    public function history(Request $request): JsonResponse
    {
        $user = $request->user();

        $matches = Matches::with([
            "player1:id,name,email",
            "player2:id,name,email",
            "winner:id,name",
        ])
            ->where(function ($q) use ($user) {
                $q->where("player1_user_id", $user->id)->orWhere(
                    "player2_user_id",
                    $user->id,
                );
            })
            ->orderBy("began_at", "desc")
            ->paginate(15);

        return response()->json($matches);
    }

    /**
     * 3. BY SPECIFIC PLAYER: Lists a user's matches by ID ($id).
     * Example: View the history of player number 5.
     */
    /**
     * 3. PÚBLICO: Lista os matches de um user pelo ID ($id).
     * Qualquer pessoa (logada ou não) pode ver.
     */
    public function matchesByUser(Request $request, $id): JsonResponse
    {
        // Verificar se o user alvo existe (opcional, mas boa prática)
        $targetUser = \App\Models\User::find($id); // Ajusta o namespace do User se necessário
        if (!$targetUser) {
            return response()->json(["message" => "User not found"], 404);
        }

        // REMOVIDO: A verificação de segurança ($request->user()->type...)
        // Agora é acesso livre.

        $matches = Matches::with([
            "player1:id,name,email",
            "player2:id,name,email",
            "winner:id,name",
        ])
            ->where(function ($q) use ($id) {
                $q->where("player1_user_id", $id)->orWhere(
                    "player2_user_id",
                    $id,
                );
            })
            ->orderBy("began_at", "desc")
            ->paginate(15);

        return response()->json($matches);
    }

    /**
     * 4. DETAIL: Shows a specific Match and its Games.
     */
    public function show(Request $request, $id): JsonResponse
    {
        $user = $request->user();

        $match = Matches::with([
            "player1:id,name,email",
            "player2:id,name,email",
            "winner:id,name",
            "games",
            "games.winner:id,name",
        ])->find($id);

        if (!$match) {
            return response()->json(["message" => "Match not found"], 404);
        }

        // Security: Admin or Participants
        $isParticipant =
            $match->player1_user_id === $user->id ||
            $match->player2_user_id === $user->id;
        $isAdmin = $user->type === "A";

        if (!$isAdmin && !$isParticipant) {
            return response()->json(
                ["message" => "Unauthorized access to this match."],
                403,
            );
        }

        return response()->json($match);
    }
}
