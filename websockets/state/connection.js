const users = new Map()

export const addUser = (socket, user) => {
  	users.set(socket.id, user)
}

export const removeUser = (socketID) => {
	const userToDelete = { ... users.get(socketID)} 
	users.delete(socketID)
	return userToDelete
}

export const getUser = (socketID) => {
  return users.get(socketID)
}

export const getUserCount = () => {
  return users.size
}

