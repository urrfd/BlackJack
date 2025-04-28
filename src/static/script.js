const wsUri = "ws://" + window.location.host;
const ws = new WebSocket(wsUri);

ws.onopen = (e) => {
  console.info("connection opened",e.data)
}
ws.onerror = (err) => {
  console.warn("socket error", e.data)
}
ws.onclose = (e) => {
  console.info("disconnected", e.data)
}

ws.onmessage = (e) => {
  console.debug("Recived", e)
  const event = JSON.parse(e.data)
  switch (event.type) {
    
  }
}

const hitB = document.getElementById("hit")
const standB = document.getElementById("stand")

hitB.onclick = () => {
  ws.send()
  
}
standB.onclick = () => {
  
}
