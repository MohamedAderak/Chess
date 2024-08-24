const gameContainer = document.getElementById('game-container');
const loadingScreen = document.getElementById('loading-screen');
const playerSelection = document.getElementById('player-selection');
const gameBoard = document.getElementById('game-board');
const playFriendBtn = document.getElementById('play-friend');
const playBotBtn = document.getElementById('play-bot');
const gameOverScreen = document.getElementById('game-over');
const winnerMessage = document.getElementById('winner-message');
const playAgainBtn = document.getElementById('play-again');
const restartButton = document.getElementById('restart-button');
const closeButton = document.getElementById('close-button');
const gameBoardContainer = document.getElementById('game-board-container')

let selectedPiece = null;
let currentPlayer = 'white';
let gameMode = '';
let board = [];

function init() {
    loadingScreen.style.display = 'flex';
    gameOverScreen.style.display = 'none';
    gameBoard.style.display = 'none';
    gameBoardContainer.style.display = 'none';
    setTimeout(() => {
        loadingScreen.style.display = 'none';
        playerSelection.style.display = 'block';
    }, 2000);
}

function restartGame() {
    // Reset the game state
    setupBoard();
    currentPlayer = 'white';
    selectedPiece = null;
    clearHighlights();
}

function closeGame() {
    // Hide the game board and show the player selection screen
    document.getElementById('game-board-container').style.display = 'none';
    playerSelection.style.display = 'block';
}

restartButton.addEventListener('click', restartGame);
closeButton.addEventListener('click', closeGame);

function setupBoard() {
    playerSelection.style.display = 'none';
    gameBoardContainer.style.display = 'block';
    gameBoard.style.display = 'grid';
    gameBoard.innerHTML = '';
    
    const initialBoard = [
        ['♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜'],
        ['♟', '♟', '♟', '♟', '♟', '♟', '♟', '♟'],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['♙', '♙', '♙', '♙', '♙', '♙', '♙', '♙'],
        ['♖', '♘', '♗', '♕', '♔', '♗', '♘', '♖']
    ];

    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.classList.add((i + j) % 2 === 0 ? 'white' : 'black');
            cell.dataset.row = i;
            cell.dataset.col = j;
            cell.textContent = initialBoard[i][j];
            cell.addEventListener('click', handleCellClick);
            gameBoard.appendChild(cell);
        }
    }

    board = initialBoard;
    currentPlayer = 'white';
}

function handleCellClick(event) {
    const cell = event.target;
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);

    if (selectedPiece) {
        movePiece(selectedPiece, row, col);
    } else {
        selectPiece(row, col);
    }
}

function selectPiece(row, col) {
    const piece = board[row][col];
    if (piece && ((currentPlayer === 'white' && piece.charCodeAt(0) >= 9812 && piece.charCodeAt(0) <= 9817) ||
                    (currentPlayer === 'black' && piece.charCodeAt(0) >= 9818 && piece.charCodeAt(0) <= 9823))) {
        selectedPiece = { row, col };
        highlightPossibleMoves(row, col);
    }
}

function movePiece(from, toRow, toCol) {
    const piece = board[from.row][from.col];
    if (isValidMove(piece, from.row, from.col, toRow, toCol)) {
        const capturedPiece = board[toRow][toCol];
        board[toRow][toCol] = piece;
        board[from.row][from.col] = '';
        updateBoardDisplay();

        if (capturedPiece === '♔' || capturedPiece === '♚') {
            endGame(currentPlayer);
        } else {
            currentPlayer = currentPlayer === 'white' ? 'black' : 'white';
            
            if (gameMode === 'bot' && currentPlayer === 'black') {
                setTimeout(makeBotMove, 500);
            }
        }
    }
    selectedPiece = null;
    clearHighlights();
}

function highlightPossibleMoves(row, col) {
    clearHighlights();
    const piece = board[row][col];
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            if (isValidMove(piece, row, col, i, j)) {
                const cell = gameBoard.children[i * 8 + j];
                cell.classList.add('possible-move');
            }
        }
    }
    gameBoard.children[row * 8 + col].classList.add('selected');
}

function clearHighlights() {
    const cells = gameBoard.getElementsByClassName('cell');
    for (let cell of cells) {
        cell.classList.remove('selected', 'possible-move');
    }
}

function isValidMove(piece, fromRow, fromCol, toRow, toCol) {
    if (fromRow === toRow && fromCol === toCol) return false;
    
    const targetPiece = board[toRow][toCol];
    if (targetPiece && ((currentPlayer === 'white' && targetPiece.charCodeAt(0) >= 9812 && targetPiece.charCodeAt(0) <= 9817) ||
                        (currentPlayer === 'black' && targetPiece.charCodeAt(0) >= 9818 && targetPiece.charCodeAt(0) <= 9823))) {
        return false;
    }

    let validMove = false;

    switch (piece) {
        case '♙': // White Pawn
            validMove = (toCol === fromCol && (toRow === fromRow - 1 || (fromRow === 6 && toRow === fromRow - 2)) && !targetPiece) ||
                        (Math.abs(toCol - fromCol) === 1 && toRow === fromRow - 1 && targetPiece);
            break;
        case '♟': // Black Pawn
            validMove = (toCol === fromCol && (toRow === fromRow + 1 || (fromRow === 1 && toRow === fromRow + 2)) && !targetPiece) ||
                        (Math.abs(toCol - fromCol) === 1 && toRow === fromRow + 1 && targetPiece);
            break;
        case '♖': case '♜': // Rook
            validMove = (toRow === fromRow || toCol === fromCol) && !isPieceBetween(fromRow, fromCol, toRow, toCol);
            break;
        case '♘': case '♞': // Knight
            validMove = (Math.abs(toRow - fromRow) === 2 && Math.abs(toCol - fromCol) === 1) ||
                        (Math.abs(toRow - fromRow) === 1 && Math.abs(toCol - fromCol) === 2);
            break;
        case '♗': case '♝': // Bishop
            validMove = Math.abs(toRow - fromRow) === Math.abs(toCol - fromCol) && !isPieceBetween(fromRow, fromCol, toRow, toCol);
            break;
        case '♕': case '♛': // Queen
            validMove = (toRow === fromRow || toCol === fromCol || Math.abs(toRow - fromRow) === Math.abs(toCol - fromCol)) && 
                        !isPieceBetween(fromRow, fromCol, toRow, toCol);
            break;
        case '♔': case '♚': // King
            validMove = Math.abs(toRow - fromRow) <= 1 && Math.abs(toCol - fromCol) <= 1;
            break;
    }

    return validMove;
}

function isPieceBetween(fromRow, fromCol, toRow, toCol) {
    const rowStep = fromRow < toRow ? 1 : fromRow > toRow ? -1 : 0;
    const colStep = fromCol < toCol ? 1 : fromCol > toCol ? -1 : 0;

    let row = fromRow + rowStep;
    let col = fromCol + colStep;

    while (row !== toRow || col !== toCol) {
        if (board[row][col] !== '') {
            return true;
        }
        row += rowStep;
        col += colStep;
    }

    return false;
}

function updateBoardDisplay() {
    const cells = gameBoard.getElementsByClassName('cell');
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            cells[i * 8 + j].textContent = board[i][j];
        }
    }
}

function makeBotMove() {
    let bestMove = null;
    let bestScore = -Infinity;

    for (let fromRow = 0; fromRow < 8; fromRow++) {
        for (let fromCol = 0; fromCol < 8; fromCol++) {
            const piece = board[fromRow][fromCol];
            if (piece && piece.charCodeAt(0) >= 9818 && piece.charCodeAt(0) <= 9823) {
                for (let toRow = 0; toRow < 8; toRow++) {
                    for (let toCol = 0; toCol < 8; toCol++) {
                        if (isValidMove(piece, fromRow, fromCol, toRow, toCol)) {
                            const targetPiece = board[toRow][toCol];
                            let score = 0;

                            // Prioritize capturing moves
                            if (targetPiece) {
                                score = getPieceValue(targetPiece);
                            }

                            // Encourage central control
                            score += (4 - Math.abs(3.5 - toRow)) * 0.1;
                            score += (4 - Math.abs(3.5 - toCol)) * 0.1;

                            if (score > bestScore) {
                                bestScore = score;
                                bestMove = { fromRow, fromCol, toRow, toCol };
                            }
                        }
                    }
                }
            }
        }
    }

    if (bestMove) {
        movePiece({ row: bestMove.fromRow, col: bestMove.fromCol }, bestMove.toRow, bestMove.toCol);
    }
}

function getPieceValue(piece) {
    switch (piece) {
        case '♙': case '♟': return 1;  // Pawn
        case '♘': case '♞': return 3;  // Knight
        case '♗': case '♝': return 3;  // Bishop
        case '♖': case '♜': return 5;  // Rook
        case '♕': case '♛': return 9;  // Queen
        case '♔': case '♚': return 100; // King
        default: return 0;
    }
}

function endGame(winner) {
    winnerMessage.textContent = `checkmate! ${winner.charAt(0).toUpperCase() + winner.slice(1)} wins!`;
    gameOverScreen.style.display = 'flex';
}

playFriendBtn.addEventListener('click', () => {
    gameMode = 'friend';
    setupBoard();
});

playBotBtn.addEventListener('click', () => {
    gameMode = 'bot';
    setupBoard();
});

playAgainBtn.addEventListener('click', () => {
    gameOverScreen.style.display = 'none';
    playerSelection.style.display = 'block';
    gameBoard.style.display = 'none';
    gameBoard.innerHTML = '';
});

function resizeBoard() {
    const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
    const size = Math.min(vw, vh) * 0.8;
    gameBoard.style.width = `${size}px`;
    gameBoard.style.height = `${size}px`;
}

window.addEventListener('resize', resizeBoard);

// Start the game
init();
resizeBoard();
