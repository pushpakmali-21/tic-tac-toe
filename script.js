document.addEventListener('DOMContentLoaded', () => {
    // --- Element Selection ---
    const cells = document.querySelectorAll('.cell');
    const statusMessage = document.getElementById('status-message');
    const subMessage = document.getElementById('sub-message');
    const restartButton = document.getElementById('restart-button');
    const rematchButton = document.getElementById('rematch-button');
    const playerVsPlayerBtn = document.getElementById('player-vs-player');
    const playerVsComputerBtn = document.getElementById('player-vs-computer');
    const difficultyEasyBtn = document.getElementById('difficulty-easy');
    const difficultyHardBtn = document.getElementById('difficulty-hard');
    const chooseXBtn = document.getElementById('choose-x');
    const chooseOBtn = document.getElementById('choose-o');
    const timerDisplay = document.getElementById('timer-display');
    
    // --- Containers and Back Buttons ---
    const backFromDifficultyBtn = document.getElementById('back-from-difficulty');
    const backFromChoiceBtn = document.getElementById('back-from-choice');
    const backFromGameBtn = document.getElementById('back-from-game');
    const gameModeSelection = document.getElementById('game-mode-selection');
    const difficultySelection = document.getElementById('difficulty-selection');
    const playerChoiceContainer = document.getElementById('player-choice-container');
    const gameContainer = document.getElementById('game-container');

    // --- Game State Variables ---
    let currentPlayer = 'X';
    let playerSymbol = 'X';
    let computerSymbol = 'O';
    let gameBoard = ['', '', '', '', '', '', '', '', ''];
    let isGameActive = true;
    let isPlayerVsComputer = false;
    let difficultyLevel = 'easy';
    let timerInterval;
    const TURN_DURATION = 10; // 10 seconds per turn

    const winningConditions = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];

    const messages = {
        win: (player) => `Player ${player} wins!`,
        youWin: 'You win!',
        youLose: 'You lose!',
        draw: 'It\'s a draw!',
        playerTurn: (player) => `Player ${player}'s turn`,
        yourTurn: 'Your turn',
        computerTurn: 'The computer\'s turn',
        winQuote: 'Awesome! You\'re a pro!',
        loseQuote: 'Don\'t give up! You\'ll get it next time!',
        drawQuote: 'A worthy opponent!',
        timeout: (player) => `Player ${player} ran out of time!`
    };

    // --- Feature: Timed Turns ---
    const stopTimer = () => {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        timerDisplay.textContent = '';
    };

    const startTimer = () => {
        stopTimer();
        let timeLeft = TURN_DURATION;
        timerDisplay.textContent = `Time left: ${timeLeft}`;

        timerInterval = setInterval(() => {
            timeLeft--;
            timerDisplay.textContent = `Time left: ${timeLeft}`;
            if (timeLeft <= 0) {
                stopTimer();
                const loser = currentPlayer;
                const winner = loser === 'X' ? 'O' : 'X';
                statusMessage.textContent = messages.timeout(loser);
                endGame(winner);
            }
        }, 1000);
    };

    // --- Core Game Logic ---
    const resetState = () => {
        gameBoard = ['', '', '', '', '', '', '', '', ''];
        isGameActive = true;
        currentPlayer = 'X';
        cells.forEach(cell => {
            cell.textContent = '';
            cell.classList.remove('winning-cell');
        });
        subMessage.textContent = '';
        rematchButton.classList.add('hidden');
        restartButton.classList.remove('hidden');
        stopTimer();
    };

    const startGame = () => {
        gameModeSelection.classList.add('hidden');
        difficultySelection.classList.add('hidden');
        playerChoiceContainer.classList.add('hidden');
        gameContainer.classList.remove('hidden');
        resetState();
        
        if (isPlayerVsComputer) {
            statusMessage.textContent = (playerSymbol === 'X') ? messages.yourTurn : messages.computerTurn;
            if (playerSymbol === 'O') {
                currentPlayer = 'X'; // Computer starts
                setTimeout(handleComputerMove, 500);
            } else {
                startTimer(); // Player starts
            }
        } else {
            statusMessage.textContent = messages.playerTurn('X');
            startTimer();
        }
    };

    const handlePlayerMove = (cell, index) => {
        // Input validation for cell index
        if (index < 0 || index > 8 || !cell) {
            console.error('Invalid cell index or element provided');
            return;
        }
        
        // Input validation for current player
        if (!['X', 'O'].includes(currentPlayer)) {
            console.error('Invalid current player:', currentPlayer);
            return;
        }

        gameBoard[index] = currentPlayer;
        cell.textContent = currentPlayer;
        startTimer(); // Reset timer for the next player
        
        const winningCombination = checkWin(gameBoard, currentPlayer);
        if (winningCombination) {
            endGame(currentPlayer, winningCombination);
            return;
        }

        if (!gameBoard.includes('')) {
            endGame(null); // Draw
            return;
        }
        
        currentPlayer = (currentPlayer === 'X') ? 'O' : 'X';
        
        if (isPlayerVsComputer) {
            statusMessage.textContent = (currentPlayer === playerSymbol) ? messages.yourTurn : messages.computerTurn;
        } else {
            statusMessage.textContent = messages.playerTurn(currentPlayer);
        }
        
        if (isGameActive && isPlayerVsComputer && currentPlayer !== playerSymbol) {
            stopTimer(); // Stop player's timer before computer moves
            setTimeout(handleComputerMove, 500);
        }
    };

    const handleCellClick = (e) => {
        const clickedCell = e.target;
        const clickedCellIndex = parseInt(clickedCell.getAttribute('data-cell-index'));

        // Input validation for clicked cell
        if (!clickedCell || isNaN(clickedCellIndex) || clickedCellIndex < 0 || clickedCellIndex > 8) {
            console.error('Invalid cell clicked');
            return;
        }

        if (gameBoard[clickedCellIndex] !== '' || !isGameActive) return;
        if (isPlayerVsComputer && currentPlayer !== playerSymbol) return;

        handlePlayerMove(clickedCell, clickedCellIndex);
    };

    const checkWin = (board, player) => {
        // Input validation for board and player
        if (!Array.isArray(board) || board.length !== 9 || !['X', 'O'].includes(player)) {
            console.error('Invalid board or player in checkWin');
            return null;
        }

        for (const condition of winningConditions) {
            if (board[condition[0]] === player && board[condition[1]] === player && board[condition[2]] === player) {
                return condition;
            }
        }
        return null;
    };

    const endGame = (winner, winningCombination = null) => {
        if (!isGameActive) return;
        isGameActive = false;
        stopTimer();

        if (winner) {
            if (isPlayerVsComputer) {
                statusMessage.textContent = (winner === playerSymbol) ? messages.youWin : messages.youLose;
                subMessage.textContent = (winner === playerSymbol) ? messages.winQuote : messages.loseQuote;
            } else {
                statusMessage.textContent = messages.win(winner);
                subMessage.textContent = messages.winQuote;
            }
            if(winningCombination) highlightWinningCells(winningCombination);
        } else {
            statusMessage.textContent = messages.draw;
            subMessage.textContent = messages.drawQuote;
        }
        
        rematchButton.classList.remove('hidden');
    };

    const highlightWinningCells = (winningCombination) => {
        if (!Array.isArray(winningCombination)) {
            console.error('Invalid winning combination provided');
            return;
        }
        
        winningCombination.forEach(index => {
            if (index >= 0 && index < 9 && cells[index]) {
                cells[index].classList.add('winning-cell');
            }
        });
    };
    
    // --- Computer AI Logic ---
    const handleComputerMove = () => {
        if (!isGameActive || currentPlayer === playerSymbol) return;
        let moveIndex;
        if (difficultyLevel === 'easy') {
            moveIndex = getEasyMove();
        } else {
            moveIndex = minimax(gameBoard, computerSymbol).index;
        }
        if (moveIndex !== undefined) {
             handlePlayerMove(cells[moveIndex], moveIndex);
        }
    };

    const getEasyMove = () => {
        const availableCells = gameBoard
            .map((cell, index) => cell === '' ? index : null)
            .filter(index => index !== null);
        if (availableCells.length > 0) {
            return availableCells[Math.floor(Math.random() * availableCells.length)];
        }
        return undefined;
    };
    
    const minimax = (newBoard, player) => {
        // Input validation for minimax
        if (!Array.isArray(newBoard) || newBoard.length !== 9 || !['X', 'O'].includes(player)) {
            console.error('Invalid parameters for minimax algorithm');
            return { index: 0, score: 0 };
        }

        const availSpots = newBoard.map((val, i) => (val === '') ? i : null).filter(v => v !== null);

        if (checkWin(newBoard, playerSymbol)) return { score: -10 };
        if (checkWin(newBoard, computerSymbol)) return { score: 10 };
        if (availSpots.length === 0) return { score: 0 };

        const moves = [];
        for (let i = 0; i < availSpots.length; i++) {
            const move = {};
            move.index = availSpots[i];
            newBoard[availSpots[i]] = player;

            if (player === computerSymbol) {
                const result = minimax(newBoard, playerSymbol);
                move.score = result.score;
            } else {
                const result = minimax(newBoard, computerSymbol);
                move.score = result.score;
            }

            newBoard[availSpots[i]] = '';
            moves.push(move);
        }

        let bestMove;
        if (player === computerSymbol) {
            let bestScore = -Infinity;
            for (let i = 0; i < moves.length; i++) {
                if (moves[i].score > bestScore) {
                    bestScore = moves[i].score;
                    bestMove = i;
                }
            }
        } else {
            let bestScore = Infinity;
            for (let i = 0; i < moves.length; i++) {
                if (moves[i].score < bestScore) {
                    bestScore = moves[i].score;
                    bestMove = i;
                }
            }
        }
        return moves[bestMove];
    };

    // --- Navigation & Event Listeners ---
    const showGameMode = () => {
        gameContainer.classList.add('hidden');
        difficultySelection.classList.add('hidden');
        playerChoiceContainer.classList.add('hidden');
        gameModeSelection.classList.remove('hidden');
    };

    const showDifficultySelection = () => {
        gameModeSelection.classList.add('hidden');
        playerChoiceContainer.classList.add('hidden');
        difficultySelection.classList.remove('hidden');
    };

    const showPlayerChoice = () => {
        difficultySelection.classList.add('hidden');
        playerChoiceContainer.classList.remove('hidden');
    };

    cells.forEach(cell => cell.addEventListener('click', handleCellClick));
    restartButton.addEventListener('click', startGame);
    rematchButton.addEventListener('click', startGame);
    
    playerVsPlayerBtn.addEventListener('click', () => { isPlayerVsComputer = false; gameModeSelection.classList.add('hidden'); showPlayerChoice(); });
    playerVsComputerBtn.addEventListener('click', () => { isPlayerVsComputer = true; gameModeSelection.classList.add('hidden'); showDifficultySelection(); });
    difficultyEasyBtn.addEventListener('click', () => { difficultyLevel = 'easy'; showPlayerChoice(); });
    difficultyHardBtn.addEventListener('click', () => { difficultyLevel = 'hard'; showPlayerChoice(); });
    chooseXBtn.addEventListener('click', () => { playerSymbol = 'X'; computerSymbol = 'O'; startGame(); });
    chooseOBtn.addEventListener('click', () => { playerSymbol = 'O'; computerSymbol = 'X'; startGame(); });
    
    backFromDifficultyBtn.addEventListener('click', showGameMode);
    backFromChoiceBtn.addEventListener('click', () => isPlayerVsComputer ? showDifficultySelection() : showGameMode());
    backFromGameBtn.addEventListener('click', showGameMode);
});