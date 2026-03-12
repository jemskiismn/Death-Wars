const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

canvas.width = 1024
canvas.height = 576

c.fillRect(0, 0, canvas.width, canvas.height)

const gravity = 0.7

// ─── Character Definitions ────────────────────────────────────────────────────
// Image dimensions & scale math:
//   death_adventure_time_updated-removebg-preview.png  500×500 → scale 0.43 → drawn 215×215
//   death regular.png                                   447×559 → scale 0.43 → drawn 192×240
//   Death grim.png                                      386×386 → scale 0.57 → drawn 220×220
//   ryuk_updated-removebg-preview.png                  500×500 → scale 0.43 → drawn 215×215
//
// offset.y = drawnH - 150  (aligns image bottom with ground)
// offset.x = (drawnW - 50) / 2  (centers image over hitbox)
const CHARACTERS = [
  {
    id: 'death-at',
    name: 'Death',
    subtitle: 'Adventure Time',
    imageSrc: './img/death_adventure_time_updated-removebg-preview.png',
    color: '#c4b5a0',
    scale: 0.43,
    offset: { x: 82, y: 65 },
    attackBox: { offset: { x: 55, y: 30 }, width: 120, height: 60 },
    attackStyle: 'body-swing',
    facesRight: true
  },
  {
    id: 'death-rs',
    name: 'Death',
    subtitle: 'Regular Show',
    imageSrc: './img/death regular.png',
    color: '#7986cb',
    scale: 0.43,
    offset: { x: 71, y: 90 },
    attackBox: { offset: { x: 50, y: 40 }, width: 130, height: 60 },
    attackStyle: 'body-swing',
    facesRight: false
  },
  {
    id: 'grim',
    name: 'Grim',
    subtitle: 'Billy & Mandy',
    imageSrc: './img/Death grim.png',
    color: '#e0e0e0',
    scale: 0.57,
    offset: { x: 85, y: 70 },
    attackBox: { offset: { x: 60, y: 40 }, width: 140, height: 60 },
    attackStyle: 'body-swing',
    facesRight: true
  },
  {
    id: 'ryuk',
    name: 'Ryuk',
    subtitle: 'Death Note',
    imageSrc: './img/ryuk_updated-removebg-preview.png',
    color: '#e74c3c',
    scale: 0.43,
    offset: { x: 82, y: 65 },
    attackBox: { offset: { x: 55, y: 30 }, width: 120, height: 60 },
    attackStyle: 'body-swing',
    facesRight: false
  }
]

// ─── Backgrounds ──────────────────────────────────────────────────────────────
const BACKGROUNDS = [
  { name: 'Dark Forest', imageSrc: './img/background.png' },
  { name: 'The Park',    imageSrc: './img/The-Park-background.png' },
  { name: 'Land of OOO', imageSrc: './img/Land-of-OOO-background.png' }
]
let bgCursor = 0

// ─── Game State ───────────────────────────────────────────────────────────────
let gameState = 'intro'   // 'intro' | 'selecting' | 'countdown' | 'fighting' | 'gameover'
let player = null
let enemy = null

let p1Cursor = 0
let p2Cursor = 1
let p1Confirmed = false
let p2Confirmed = false

const keys = {
  a:          { pressed: false },
  d:          { pressed: false },
  ArrowRight: { pressed: false },
  ArrowLeft:  { pressed: false }
}

// ─── Background Sprite ────────────────────────────────────────────────────────
const background = new Sprite({
  position: { x: 0, y: 0 },
  imageSrc: './img/background.png'
})

// ─── Character Select UI ──────────────────────────────────────────────────────
function renderSelectScreen() {
  const grid = document.getElementById('charGrid')
  if (!grid) return
  grid.innerHTML = ''

  CHARACTERS.forEach((char, i) => {
    const card = document.createElement('div')
    card.className = 'char-card'
    if (p1Cursor === i) card.classList.add('p1-hover')
    if (p2Cursor === i) card.classList.add('p2-hover')
    if (p1Confirmed && p1Cursor === i) card.classList.add('p1-selected')
    if (p2Confirmed && p2Cursor === i) card.classList.add('p2-selected')

    card.innerHTML = `
      <img src="${char.imageSrc}" alt="${char.name}" />
      <div class="char-name">${char.name}</div>
      <div class="char-subtitle">${char.subtitle}</div>
    `
    grid.appendChild(card)
  })

  const p1Status = document.getElementById('p1Status')
  const p2Status = document.getElementById('p2Status')
  if (p1Status) p1Status.textContent = p1Confirmed ? `✓ ${CHARACTERS[p1Cursor].name} (${CHARACTERS[p1Cursor].subtitle})` : 'Choose your fighter'
  if (p2Status) p2Status.textContent = p2Confirmed ? `✓ ${CHARACTERS[p2Cursor].name} (${CHARACTERS[p2Cursor].subtitle})` : 'Choose your fighter'

  const bgGrid = document.getElementById('bgGrid')
  if (bgGrid) {
    bgGrid.innerHTML = ''
    BACKGROUNDS.forEach((bg, i) => {
      const card = document.createElement('div')
      card.className = 'bg-card' + (bgCursor === i ? ' bg-selected' : '')
      card.innerHTML = `<img src="${bg.imageSrc}" /><div class="bg-name">${bg.name}</div>`
      bgGrid.appendChild(card)
    })
  }
}

function startCountdown() {
  gameState = 'countdown'
  document.getElementById('selectScreen').style.display = 'none'

  const p1Char = CHARACTERS[p1Cursor]
  const p2Char = CHARACTERS[p2Cursor]

  // Update health bar labels
  document.getElementById('p1Label').textContent = p1Char.name
  document.getElementById('p2Label').textContent = p2Char.name

  // Create fighters
  player = new SingleImageFighter({
    position: { x: 100, y: 350 },
    velocity: { x: 0, y: 0 },
    color: p1Char.color,
    imageSrc: p1Char.imageSrc,
    scale: p1Char.scale,
    offset: p1Char.offset,
    attackBox: p1Char.attackBox,
    attackStyle: p1Char.attackStyle,
    facingRight: true,
    naturalFacesRight: p1Char.facesRight
  })

  enemy = new SingleImageFighter({
    position: { x: 750, y: 350 },
    velocity: { x: 0, y: 0 },
    color: p2Char.color,
    imageSrc: p2Char.imageSrc,
    scale: p2Char.scale,
    offset: p2Char.offset,
    attackBox: {
      offset: { x: -p2Char.attackBox.offset.x - p2Char.attackBox.width, y: p2Char.attackBox.offset.y },
      width: p2Char.attackBox.width,
      height: p2Char.attackBox.height
    },
    attackStyle: p2Char.attackStyle,
    facingRight: false,
    naturalFacesRight: p2Char.facesRight
  })

  // Apply selected background
  background.image.src = BACKGROUNDS[bgCursor].imageSrc

  // Reset health bars
  gsap.set('#playerHealth', { width: '100%' })
  gsap.set('#enemyHealth', { width: '100%' })

  const countdownEl = document.getElementById('countdownOverlay')
  countdownEl.style.display = 'flex'

  const steps = ['3', '2', '1', 'FIGHT!']
  let i = 0
  countdownEl.querySelector('.countdown-text').textContent = steps[i]

  const iv = setInterval(() => {
    i++
    if (i < steps.length) {
      countdownEl.querySelector('.countdown-text').textContent = steps[i]
    }
    if (i === steps.length - 1) {
      setTimeout(() => {
        countdownEl.style.display = 'none'
        gameState = 'fighting'
        document.querySelector('.hud').style.visibility = 'visible'
        document.getElementById('gameSoundtrack').play()
        decreaseTimer()
      }, 700)
      clearInterval(iv)
    }
  }, 800)
}

function resetGame() {
  clearTimeout(timerId)
  const gs = document.getElementById('gameSoundtrack')
  gs.pause()
  gs.currentTime = 0
  gameState = 'selecting'
  p1Confirmed = false
  p2Confirmed = false
  p1Cursor = 0
  p2Cursor = 1
  bgCursor = 0
  player = null
  enemy = null
  timer = 60
  document.getElementById('timer').innerHTML = 60
  document.getElementById('displayText').style.display = 'none'
  document.getElementById('rematchBtn').style.display = 'none'
  document.getElementById('introScreen').style.display = 'none'
  document.querySelector('.hud').style.visibility = 'hidden'
  document.getElementById('selectScreen').style.display = 'flex'
  renderSelectScreen()
}

// ─── Game Loop ────────────────────────────────────────────────────────────────
function animate() {
  window.requestAnimationFrame(animate)

  c.fillStyle = '#0a0a0f'
  c.fillRect(0, 0, canvas.width, canvas.height)
  background.update()
  c.fillStyle = 'rgba(0, 0, 0, 0.35)'
  c.fillRect(0, 0, canvas.width, canvas.height)

  if (gameState !== 'fighting' && gameState !== 'gameover') return
  if (!player || !enemy) return

  player.update()
  enemy.update()

  player.velocity.x = 0
  enemy.velocity.x = 0

  // Player 1 movement
  if (keys.a.pressed && player.lastKey === 'a') {
    player.velocity.x = -5
    player.switchSprite('run')
  } else if (keys.d.pressed && player.lastKey === 'd') {
    player.velocity.x = 5
    player.switchSprite('run')
  } else {
    player.switchSprite('idle')
  }

  if (player.velocity.y < 0) player.switchSprite('jump')
  else if (player.velocity.y > 0) player.switchSprite('fall')

  // Player 2 movement
  if (keys.ArrowLeft.pressed && enemy.lastKey === 'ArrowLeft') {
    enemy.velocity.x = -5
    enemy.switchSprite('run')
  } else if (keys.ArrowRight.pressed && enemy.lastKey === 'ArrowRight') {
    enemy.velocity.x = 5
    enemy.switchSprite('run')
  } else {
    enemy.switchSprite('idle')
  }

  if (enemy.velocity.y < 0) enemy.switchSprite('jump')
  else if (enemy.velocity.y > 0) enemy.switchSprite('fall')

  // Collision: player hits enemy
  if (
    rectangularCollision({ rectangle1: player, rectangle2: enemy }) &&
    player.isAttacking
  ) {
    enemy.takeHit()
    player.isAttacking = false
    gsap.to('#enemyHealth', { width: Math.max(0, enemy.health / 130 * 100) + '%' })
  }

  // Collision: enemy hits player
  if (
    rectangularCollision({ rectangle1: enemy, rectangle2: player }) &&
    enemy.isAttacking
  ) {
    player.takeHit()
    enemy.isAttacking = false
    gsap.to('#playerHealth', { width: Math.max(0, player.health / 130 * 100) + '%' })
  }

  // End game on death or timer=0
  if ((enemy.health <= 0 || player.health <= 0) && gameState === 'fighting') {
    gameState = 'gameover'
    determineWinner({ player, enemy, timerId })
    document.getElementById('rematchBtn').style.display = 'block'
  }
}

animate()

// ─── Keyboard Handlers ────────────────────────────────────────────────────────
window.addEventListener('keydown', (event) => {
  // Intro screen — any Enter dismisses it
  if (gameState === 'intro') {
    if (event.key === 'Enter') {
      event.preventDefault()
      playClick()
      document.getElementById('introScreen').style.display = 'none'
      document.getElementById('selectScreen').style.display = 'flex'
      gameState = 'selecting'
    }
    return
  }

  // Character select navigation
  if (gameState === 'selecting') {
    switch (event.key) {
      case 'a':
        playClick()
        p1Cursor = (p1Cursor - 1 + CHARACTERS.length) % CHARACTERS.length
        renderSelectScreen()
        break
      case 'd':
        playClick()
        p1Cursor = (p1Cursor + 1) % CHARACTERS.length
        renderSelectScreen()
        break
      case 'Enter':
        event.preventDefault()
        if (!p1Confirmed) {
          playClick()
          p1Confirmed = true
          renderSelectScreen()
          if (p1Confirmed && p2Confirmed) startCountdown()
        }
        break
      case 'ArrowLeft':
        event.preventDefault()
        playClick()
        p2Cursor = (p2Cursor - 1 + CHARACTERS.length) % CHARACTERS.length
        renderSelectScreen()
        break
      case 'ArrowRight':
        event.preventDefault()
        playClick()
        p2Cursor = (p2Cursor + 1) % CHARACTERS.length
        renderSelectScreen()
        break
      case 'ArrowDown':
        event.preventDefault()
        if (!p2Confirmed) {
          playClick()
          p2Confirmed = true
          renderSelectScreen()
          if (p1Confirmed && p2Confirmed) startCountdown()
        }
        break
      case 'w':
        playClick()
        bgCursor = (bgCursor - 1 + BACKGROUNDS.length) % BACKGROUNDS.length
        renderSelectScreen()
        break
      case 's':
        playClick()
        bgCursor = (bgCursor + 1) % BACKGROUNDS.length
        renderSelectScreen()
        break
      case 'ArrowUp':
        event.preventDefault()
        playClick()
        bgCursor = (bgCursor - 1 + BACKGROUNDS.length) % BACKGROUNDS.length
        renderSelectScreen()
        break
    }
    return
  }

  // In-fight controls
  if (!player || !enemy) return

  if (!player.dead) {
    switch (event.key) {
      case 'd':
        keys.d.pressed = true
        player.lastKey = 'd'
        player.facingRight = true
        break
      case 'a':
        keys.a.pressed = true
        player.lastKey = 'a'
        player.facingRight = false
        break
      case 'w':
        if (player.velocity.y === 0) player.velocity.y = -20
        break
      case ' ':
        player.attack()
        break
    }
  }

  if (!enemy.dead) {
    switch (event.key) {
      case 'ArrowRight':
        keys.ArrowRight.pressed = true
        enemy.lastKey = 'ArrowRight'
        enemy.facingRight = true
        break
      case 'ArrowLeft':
        keys.ArrowLeft.pressed = true
        enemy.lastKey = 'ArrowLeft'
        enemy.facingRight = false
        break
      case 'ArrowUp':
        if (enemy.velocity.y === 0) enemy.velocity.y = -20
        break
      case 'ArrowDown':
        enemy.attack()
        break
    }
  }
})

window.addEventListener('keyup', (event) => {
  switch (event.key) {
    case 'd':           keys.d.pressed = false; break
    case 'a':           keys.a.pressed = false; break
    case 'ArrowRight':  keys.ArrowRight.pressed = false; break
    case 'ArrowLeft':   keys.ArrowLeft.pressed = false; break
  }
})

// ─── Init ─────────────────────────────────────────────────────────────────────
renderSelectScreen()  // pre-populate grid while intro is shown
