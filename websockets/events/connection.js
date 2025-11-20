import { addUser, removeUser, getUserCount } from "../state/connection.js"

export const handleConnectionEvents = (io, socket) => {
	socket.on("join", (user) => {
		addUser(socket, user)
		
		console.log(`[Connection] User ${user.name} has joined the server`)
		console.log(`[Connection] ${getUserCount()} users online`)
	})
	
	socket.on("leave", () => {
		const user = removeUser(socket.id)
		console.log(`[Connection] User ${user.name} has left the server`)
		console.log(`[Connection] ${getUserCount()} users online`)
	})
	
	socket.on("disconnect", () => {
		console.log("Connection Lost:", socket.id)
		const user = removeUser(socket.id)
		console.log(`[Connection] ${getUserCount()} users online`)
	})  	
}