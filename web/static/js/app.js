// Brunch automatically concatenates all files in your
// watched paths. Those paths can be configured at
// config.paths.watched in "brunch-config.js".
//
// However, those files will only be executed if
// explicitly imported. The only exception are files
// in vendor, which are never wrapped in imports and
// therefore are always executed.

// Import dependencies
//
// If you no longer want to use a dependency, remember
// to also remove its path from "config.paths.watched".
import "phoenix_html"
import {Socket, Presence} from "phoenix"

let user = document.getElementById("user").innerText
let socket = new Socket("/socket", {params: {user}})
socket.connect()

let presences = {}

let formattedTimestamp = (Ts) => {
    let date = new Date(Ts)
    return date.toLocaleString()
}

let listBy = (user, {metas}) => {
    return {
        user,
        onlineAt: formattedTimestamp(metas[0].online_at)
    }
}

let userList = document.getElementById("user-list")
let render = (presences) => {
    userList.innerHTML = Presence.list(presences, listBy)
    .map(presence => `
        <li>
            ${presence.user}
            <br/>
            <small>online since ${presence.onlineAt}</small>
        </li>`)
        .join("")
}

let room = socket.channel("room:lobby")
room.on("presence_state", state => {
    presences = Presence.syncState(presences, state)
    render(presences)
})

room.on("presence_diff", diff => {
    presences = Presence.syncDiff(presences, diff)
    render(presences)
})

room.join()

let messageInput = document.getElementById("new-message")
messageInput.addEventListener("keypress", (e) => {
  if (e.keyCode == 13 && messageInput.value != "") {
    room.push("message:new", messageInput.value)
    messageInput.value = ""
  }
})

let messageList = document.getElementById("message-list")
let renderMessage = (message) => {
  let messageElement = document.createElement("li")
  messageElement.innerHTML = `
    <b>${message.user}</b>
    <i>${formattedTimestamp(message.timestamp)}</i>
    <p>${message.body}</p>
  `
  messageList.appendChild(messageElement)
  messageList.scrollTop = messageList.scrollHeight;
}

room.on("message:new", message => renderMessage(message))