const users = new Map();

export const addUser = (socketId, user) => {
  users.set(socketId, user);
};

export const removeUser = (socketID) => {
  if (!users.has(socketID)) return null;
  const user = users.get(socketID);
  users.delete(socketID);
  return user;
};

export const getUser = (socketID) => {
  return users.get(socketID);
};

export const getUserCount = () => {
  return users.size;
};