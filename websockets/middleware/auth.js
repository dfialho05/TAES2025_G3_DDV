import axios from "axios";

const LARAVEL_API_URL = process.env.LARAVEL_API_URL || "http://localhost:8000/api";

export const authMiddleware = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      socket.data.user = null;
      socket.data.isGuest = true;
      console.log(`[Auth] Socket ${socket.id} conectado como GUEST (sem token)`);
      return next();
    }

    console.log(`[Auth] Validando token para socket ${socket.id}...`);

    try {
      const response = await axios.get(`${LARAVEL_API_URL}/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        timeout: 5000,
      });

      const userData = response.data.data || response.data;

      if (!userData || !userData.id) {
        console.warn(`[Auth] Token válido mas dados de usuário inválidos`);
        socket.data.user = null;
        socket.data.isGuest = true;
        return next();
      }

      socket.data.user = {
        id: String(userData.id),
        name: userData.name,
        email: userData.email,
        type: userData.type,
        coins_balance: userData.coins_balance,
        active_game_id: userData.active_game_id || null,
        token: token,
      };

      socket.data.isGuest = false;
      socket.data.token = token;

      console.log(`[Auth] Usuário autenticado: ${userData.name} (ID: ${userData.id})`);

      return next();
    } catch (apiError) {
      if (apiError.response?.status === 401) {
        console.warn(`[Auth] Token inválido ou expirado para socket ${socket.id}`);
        socket.data.user = null;
        socket.data.isGuest = true;
        return next();
      }

      console.error(`[Auth] Erro ao validar token:`, apiError.message);
      socket.data.user = null;
      socket.data.isGuest = true;
      return next();
    }
  } catch (error) {
    console.error(`[Auth] Erro crítico no middleware de autenticação:`, error.message);
    return next(new Error("Erro interno de autenticação"));
  }
};

export const validateUserForRecovery = (socket) => {
  if (!socket.data.user || !socket.data.user.id) {
    return null;
  }

  if (socket.data.user.id === "loading" || socket.data.isGuest) {
    return null;
  }

  return socket.data.user;
};
