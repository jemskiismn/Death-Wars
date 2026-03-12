function rectangularCollision({ rectangle1, rectangle2 }) {
  return (
    rectangle1.attackBox.position.x + rectangle1.attackBox.width >=
      rectangle2.position.x &&
    rectangle1.attackBox.position.x <=
      rectangle2.position.x + rectangle2.width &&
    rectangle1.attackBox.position.y + rectangle1.attackBox.height >=
      rectangle2.position.y &&
    rectangle1.attackBox.position.y <= rectangle2.position.y + rectangle2.height
  )
}

function determineWinner({ player, enemy, timerId }) {
  clearTimeout(timerId)
  const gs = document.getElementById('gameSoundtrack')
  gs.pause()
  gs.currentTime = 0
  const displayEl = document.querySelector('#displayText')
  displayEl.style.display = 'flex'

  const p1Name = document.getElementById('p1Label').textContent
  const p2Name = document.getElementById('p2Label').textContent

  if (player.health === enemy.health) {
    displayEl.innerHTML = 'TIE'
  } else if (player.health > enemy.health) {
    displayEl.innerHTML = p1Name + ' WINS'
  } else {
    displayEl.innerHTML = p2Name + ' WINS'
  }
}

let timer = 60
let timerId
function decreaseTimer() {
  if (timer > 0) {
    timerId = setTimeout(decreaseTimer, 1000)
    timer--
    document.querySelector('#timer').innerHTML = timer
  }

  if (timer === 0) {
    gameState = 'gameover'
    determineWinner({ player, enemy, timerId })
    document.getElementById('rematchBtn').style.display = 'block'
  }
}
