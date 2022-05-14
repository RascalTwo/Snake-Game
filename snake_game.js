
//Declare global variables to track game board size
const LINE_PIXEL_COUNT = 40
const TOTAL_PIXEL_COUNT = LINE_PIXEL_COUNT**2

//Track scores to display to user
let totalFoodEaten = [0, 0]
let activeSnakes = [0];
let snakeCount = 1;
let totalDistanceTraveled = 0

const peer = new Peer(new URLSearchParams(window.location.hash.slice(1)).get('id') || undefined, {
  host: 'localhost',
  path: '/myapp',
  port: 9000
});

let host;
let client;
peer.on('open', id => {
  console.log(id)
})

const hostID = new URLSearchParams(window.location.hash.slice(1)).get('host');
if (hostID){
  host = peer.connect(hostID);
  host.on('open', () => {
    snakeCount++;
    activeSnakes.push(1);
  });
  host.on('data', data => {
    totalDistanceTraveled++

    document.getElementById("blocksTraveled").innerText = totalDistanceTraveled
    if (totalFoodEaten !== data.totalFoodEaten){
      totalFoodEaten = data.totalFoodEaten
      document.getElementById("pointsEarned").innerText = totalFoodEaten.slice(0, snakeCount).join(' ')
    }

    document.querySelectorAll('.snakeBodyPixel0').forEach(pixel => pixel.classList.remove('snakeBodyPixel0'))
    document.querySelectorAll('.snakeBodyPixel1').forEach(pixel => pixel.classList.remove('snakeBodyPixel1'))

    for (const key in data.snakes){
      gameBoardPixels[key].classList.add('snakeBodyPixel' + data.snakes[key])
    }

    if (data.currentFoodPosition === currentFoodPosition) return;
    gameBoardPixels[currentFoodPosition].classList.remove("food")
    currentFoodPosition = data.currentFoodPosition
    gameBoardPixels[currentFoodPosition].classList.add('food')
  })
}

peer.on('connection', (conn) => {
  client = conn;
  if (snakeCount === 1){
    snakeCount++;
  }
  if (!activeSnakes.includes(1)) activeSnakes.push(1);

  conn.on('data', (data) => {
    changeDirection(data, 1);
  });
});

//Shorten reference to game board
const gameContainer = document.getElementById('gameContainer')

//Generate the game board
let html = ''
for (let i = 1; i<= TOTAL_PIXEL_COUNT; i++) {
  html = `${html} <div class="gameBoardPixel" id = "pixel${i}"></div>`;
}
gameContainer.innerHTML = html;

//Shorten references to game pixels
const gameBoardPixels = [...document.getElementsByClassName("gameBoardPixel")]

let currentFoodPosition = 0

//create the randomly generated food items in the game board
const createFood = () => {
  gameBoardPixels[currentFoodPosition].classList.remove("food")
  currentFoodPosition = Math.floor(Math.random()*TOTAL_PIXEL_COUNT)
  gameBoardPixels[currentFoodPosition].classList.add('food')
}

//Start setting up snake behavior

const LEFT_DIRS = [37, 65]
const UP_DIRS = [38, 87]
const RIGHT_DIRS = [39, 68]
const DOWN_DIRS = [40, 83]
const DIRECTIONS = [LEFT_DIRS, UP_DIRS, RIGHT_DIRS, DOWN_DIRS]

let snakeCurrentDirections = [RIGHT_DIRS[0], LEFT_DIRS[1]]

//Make sure that the user input is valid and change snake direction variable
const changeDirection = (newDirectionCode, i) => {
  let snakeCurrentDirection = snakeCurrentDirections[i]
  if(newDirectionCode == snakeCurrentDirection) return;

  if (newDirectionCode == LEFT_DIRS[i] && snakeCurrentDirection !== RIGHT_DIRS[i]) {
    snakeCurrentDirection = newDirectionCode
  } else if(newDirectionCode == UP_DIRS[i] && snakeCurrentDirection !== DOWN_DIRS[i]) {
    snakeCurrentDirection = newDirectionCode
  }else if (newDirectionCode == RIGHT_DIRS[i] && snakeCurrentDirection !== LEFT_DIRS[i]) {
    snakeCurrentDirection = newDirectionCode
  } else if (newDirectionCode == DOWN_DIRS[i] && snakeCurrentDirection !== UP_DIRS[i]) {
    snakeCurrentDirection = newDirectionCode
  }
  snakeCurrentDirections[i] = snakeCurrentDirection
}

//set starting point for snake on load
let currentHeadPositions = [TOTAL_PIXEL_COUNT/2, TOTAL_PIXEL_COUNT/2 - 1]

//Set initial length
let snakeLengths = [200, 200]

//Start moving snake, wrap around to other side of screen if needed
const moveSnake = () => {

  if (client) {
    const snakes = {}
    for (let i = 0; i < gameBoardPixels.length; i++){
      const snakeIndex = gameBoardPixels[i].className.split('snakeBodyPixel')[1]
      if (snakeIndex) snakes[i] = snakeIndex;
    }
    const data = {
      snakes,
      currentFoodPosition,
      totalFoodEaten
    };
    client.send(data)
  }
  for (const i of activeSnakes){
    let currentHeadPosition = currentHeadPositions[i];
    switch (snakeCurrentDirections[i]) {
      case LEFT_DIRS[i]:
        --currentHeadPosition
        const isHeadAtLeft = currentHeadPosition % LINE_PIXEL_COUNT == LINE_PIXEL_COUNT - 1 || currentHeadPosition < 0
        if (isHeadAtLeft) {
          currentHeadPosition = currentHeadPosition + LINE_PIXEL_COUNT
        }
      break;
      case RIGHT_DIRS[i]:
        ++currentHeadPosition
        const isHeadAtRight = currentHeadPosition % LINE_PIXEL_COUNT == 0
        if (isHeadAtRight) {
          currentHeadPosition = currentHeadPosition - LINE_PIXEL_COUNT
        }
        break;
      case UP_DIRS[i]:
        currentHeadPosition = currentHeadPosition - LINE_PIXEL_COUNT
        const isHeadAtTop = currentHeadPosition < 0
        if (isHeadAtTop) {
          currentHeadPosition = currentHeadPosition + TOTAL_PIXEL_COUNT
        }
        break;
      case DOWN_DIRS[i]:
        currentHeadPosition = currentHeadPosition + LINE_PIXEL_COUNT
        const isHeadAtBottom = currentHeadPosition > TOTAL_PIXEL_COUNT -1
        if (isHeadAtBottom) {
          currentHeadPosition = currentHeadPosition - TOTAL_PIXEL_COUNT
        }
        break;
        default:
        break;
      }
      currentHeadPositions[i] = currentHeadPosition
  
      //Accessed the correct pixel within the HTML collection
      let nextSnakeHeadPixel = gameBoardPixels[currentHeadPosition]
      const className = "snakeBodyPixel" + i
      const otherClassName = "snakeBodyPixel" + ((i + 1) % 2)
  
      //Check if snake head is about to intersect with its own body
      if (nextSnakeHeadPixel.classList.contains(className) || nextSnakeHeadPixel.classList.contains(otherClassName)) {
        // TODO - replace
        alert(`You have eaten ${totalFoodEaten[i]} food and traveled ${totalDistanceTraveled} blocks.`)
        activeSnakes.splice(activeSnakes.indexOf(i), 1)
        if (!activeSnakes.length) {
          clearInterval(moveSnakeInterval)
          window.location.reload()
        }
      }
  
      //Assuming an empty pixel, add snake body styling
      nextSnakeHeadPixel.classList.add(className)
  
      //Remove snake styling to keep snake appropriate length
      setTimeout(() => {
        nextSnakeHeadPixel.classList.remove(className)
      }, snakeLengths[i])
  
      //Describe what to do if the snake encounters a food pixel
      if (currentHeadPosition == currentFoodPosition) {
        console.log('eat food')
        totalFoodEaten[i]++
        document.getElementById("pointsEarned").innerText = totalFoodEaten.slice(0, snakeCount).join(' ')
        snakeLengths[i] = snakeLengths[i] + 100
        createFood()
      }
  }
  //Added distance traveled count
  totalDistanceTraveled++
  document.getElementById("blocksTraveled").innerText = totalDistanceTraveled
}

if (!host) {
  createFood();

  //Set animation speed
  setInterval(moveSnake, 100)
}

addEventListener("keydown", e => {
  let foundIndex = -1;
  for (const codes of DIRECTIONS){
    foundIndex = codes.indexOf(e.keyCode)
    if (foundIndex !== -1) break;
  }
  if (foundIndex === -1) return

  if (foundIndex === 1) {
    if (client || host) return;
    if (snakeCount === 1) {
      snakeCount++;
      activeSnakes.push(1);
    }
  }

  if (host) host.send(DIRECTIONS.find(codes => codes.indexOf(e.keyCode) === foundIndex)[(foundIndex + 1) % 2])
  else changeDirection(e.keyCode, foundIndex);
})

//Adding variables for on-screen buttons
const leftButton  = document.getElementById('leftButton')
const rightButton  = document.getElementById('rightButton')
const upButton  = document.getElementById('upButton')
const downButton  = document.getElementById('downButton')

//Add listeners for on-screen buttons
leftButton.onclick = () => changeDirection(LEFT_DIRS[0], 0)
rightButton.onclick = () => changeDirection(RIGHT_DIRS[0], 0)
upButton.onclick = () => changeDirection(UP_DIRS[0], 0)
downButton.onclick = () => changeDirection(DOWN_DIRS[0], 0)