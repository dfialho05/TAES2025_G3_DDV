import { serverStart } from "./server.js"

const PORT = process.env.PORT || 3000

serverStart(PORT)

console.log(`Socket.io server running on port ${PORT}`)
console.log("Waiting for connections...")
