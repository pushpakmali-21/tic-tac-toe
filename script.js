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
    const gameConfig = {
        mode: 'pvp',           // 'pvp' or 'pvc'
        difficulty: 'easy',    // 'easy' or 'hard'
        playerSymbol: 'X',
        computerSymbol: 'O',
        turnDuration: 10
    };

    const gameState = {
        board: ['', '', '', '', '', '', '', '', ''],
        isActive: true,
        currentTurn: 'X',
        scores: { player1: 0, player2: 0, ties: 0 },
        timerInterval: null
    };
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
    // --- Sound Engine ---
    const synthSound = (frequency, type = 'sine', duration = 0.1) => {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            oscillator.type = type;
            oscillator.frequency.value = frequency;

            gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            oscillator.start();
            oscillator.stop(audioCtx.currentTime + duration);
        } catch (e) {
            console.warn('Audio Context blocked by client policies:', e);
        }
    };

    const playWinSound = () => {
        synthSound(523.25, 'sine', 0.15);           // C5
        setTimeout(() => synthSound(659.25, 'sine', 0.15), 100);  // E5
        setTimeout(() => synthSound(783.99, 'sine', 0.3), 200);   // G5
    };

    const playLoseSound = () => {
        synthSound(220, 'sawtooth', 0.4); // A3 low buzz
    };

    const playDrawSound = () => {
        synthSound(440, 'sine', 0.15);                              // A4
        setTimeout(() => synthSound(415.30, 'sine', 0.3), 150);   // Ab4 slight descent
    };

    const stopTimer = () => {
        if (gameState.timerInterval) {
            clearInterval(gameState.timerInterval);
            gameState.timerInterval = null;
        }
        timerDisplay.textContent = '';
    };

    const startTimer = () => {
        stopTimer();
        let timeLeft = gameConfig.turnDuration;
        timerDisplay.textContent = `Time left: ${timeLeft}`;

        gameState.timerInterval = setInterval(() => {
            timeLeft--;
            timerDisplay.textContent = `Time left: ${timeLeft}`;
            if (timeLeft <= 0) {
                stopTimer();
                const loser = gameState.currentTurn;
                const winner = loser === 'X' ? 'O' : 'X';
                statusMessage.textContent = messages.timeout(loser);
                endGame(winner);
            }
        }, 1000);
    };

    // --- Core Game Logic ---
    const resetState = () => {
        gameState.board = ['', '', '', '', '', '', '', '', ''];
        gameState.isActive = true;
        gameState.currentTurn = 'X';
        cells.forEach((cell, idx) => {
            cell.textContent = '';
            cell.classList.remove('winning-cell');
            cell.setAttribute('aria-label', `Cell ${idx + 1}, Empty`);
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
        document.getElementById('score-label-p1').textContent = gameConfig.mode === 'pvc' ? `YOU (${gameConfig.playerSymbol})` : 'PLAYER 1';
        document.getElementById('score-label-p2').textContent = gameConfig.mode === 'pvc' ? `CPU (${gameConfig.computerSymbol})` : 'PLAYER 2';
        updateScoreboardDOM();

        if (gameConfig.mode === 'pvc') {
            statusMessage.textContent = (gameConfig.playerSymbol === 'X') ? messages.yourTurn : messages.computerTurn;
            if (gameConfig.playerSymbol === 'O') {
                gameState.currentTurn = 'X'; // Computer starts
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
        if (!['X', 'O'].includes(gameState.currentTurn)) {
            console.error('Invalid current player:', gameState.currentTurn);
            return;
        }

        stopTimer(); // Kill timer immediately on any move
        synthSound(600, 'triangle', 0.08); // Cell placement click
        gameState.board[index] = gameState.currentTurn;
        cell.textContent = gameState.currentTurn;
        cell.setAttribute('aria-label', `Cell ${index + 1}, ${gameState.currentTurn}`);

        const winningCombination = checkWin(gameState.board, gameState.currentTurn);
        if (winningCombination) {
            endGame(gameState.currentTurn, winningCombination);
            return;
        }

        if (!gameState.board.includes('')) {
            endGame(null); // Draw
            return;
        }

        gameState.currentTurn = (gameState.currentTurn === 'X') ? 'O' : 'X';

        if (gameConfig.mode === 'pvc') {
            statusMessage.textContent = (gameState.currentTurn === gameConfig.playerSymbol) ? messages.yourTurn : messages.computerTurn;
        } else {
            statusMessage.textContent = messages.playerTurn(gameState.currentTurn);
        }

        if (gameState.isActive && gameConfig.mode === 'pvc' && gameState.currentTurn !== gameConfig.playerSymbol) {
            setTimeout(handleComputerMove, 500); // Timer already stopped above, just schedule computer
        } else if (gameState.isActive) {
            startTimer(); // Only start timer for a human player's turn
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

        if (gameState.board[clickedCellIndex] !== '' || !gameState.isActive) return;
        if (gameConfig.mode === 'pvc' && gameState.currentTurn !== gameConfig.playerSymbol) return;

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
        if (!gameState.isActive) return;
        gameState.isActive = false;
        stopTimer();

        if (winner) {
            if (gameConfig.mode === 'pvc') {
                statusMessage.textContent = (winner === gameConfig.playerSymbol) ? messages.youWin : messages.youLose;
                subMessage.textContent = (winner === gameConfig.playerSymbol) ? messages.winQuote : messages.loseQuote;
                if (winner === gameConfig.playerSymbol) { gameState.scores.player1++; playWinSound(); }
                else { gameState.scores.player2++; playLoseSound(); }
            } else {
                statusMessage.textContent = messages.win(winner);
                subMessage.textContent = messages.winQuote;
                if (winner === 'X') gameState.scores.player1++;
                else gameState.scores.player2++;
                playWinSound();
            }
            if (winningCombination) highlightWinningCells(winningCombination);
        } else {
            statusMessage.textContent = messages.draw;
            subMessage.textContent = messages.drawQuote;
            gameState.scores.ties++;
            playDrawSound();
        }

        saveScores();
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
    // --- Scoreboard Logic ---
    const updateScoreboardDOM = () => {
        document.getElementById('score-p1').textContent = gameState.scores.player1;
        document.getElementById('score-p2').textContent = gameState.scores.player2;
        document.getElementById('score-ties').textContent = gameState.scores.ties;
    };

    const saveScores = () => {
        localStorage.setItem('cyber_ttt_scores', JSON.stringify(gameState.scores));
        updateScoreboardDOM();
    };

    const loadPersistedScores = () => {
        const saved = localStorage.getItem('cyber_ttt_scores');
        if (saved) {
            gameState.scores = JSON.parse(saved);

            updateScoreboardDOM();
        }
    };
    const resetScores = () => {
        gameState.scores = { player1: 0, player2: 0, ties: 0 };
        localStorage.removeItem('cyber_ttt_scores');
        updateScoreboardDOM();
    };

    // --- Computer AI Logic ---
    const handleComputerMove = () => {
        if (!gameState.isActive || gameState.currentTurn === gameConfig.playerSymbol) return;
        let moveIndex;
        if (gameConfig.difficulty === 'easy') {
            moveIndex = getEasyMove();
        } else {
            moveIndex = minimax(gameState.board, gameConfig.computerSymbol).index;
        }
        if (moveIndex !== undefined) {
            handlePlayerMove(cells[moveIndex], moveIndex);
        }
    };

    const getEasyMove = () => {
        const availableCells = gameState.board
            .map((cell, index) => cell === '' ? index : null)
            .filter(index => index !== null);
        if (availableCells.length > 0) {
            return availableCells[Math.floor(Math.random() * availableCells.length)];
        }
        return undefined;
    };

    const minimax = (newBoard, player, alpha = -Infinity, beta = Infinity) => {
        // Input validation for minimax
        if (!Array.isArray(newBoard) || newBoard.length !== 9 || !['X', 'O'].includes(player)) {
            console.error('Invalid parameters for minimax algorithm');
            return { index: 0, score: 0 };
        }

        const availSpots = newBoard.map((val, i) => (val === '') ? i : null).filter(v => v !== null);

        if (checkWin(newBoard, gameConfig.playerSymbol)) return { score: -10 };
        if (checkWin(newBoard, gameConfig.computerSymbol)) return { score: 10 };
        if (availSpots.length === 0) return { score: 0 };

        const moves = [];
        for (let i = 0; i < availSpots.length; i++) {
            const move = {};
            move.index = availSpots[i];
            newBoard[availSpots[i]] = player;

            if (player === gameConfig.computerSymbol) {
                const result = minimax(newBoard, gameConfig.playerSymbol, alpha, beta);
                move.score = result.score;
                alpha = Math.max(alpha, move.score);
            } else {
                const result = minimax(newBoard, gameConfig.computerSymbol, alpha, beta);
                move.score = result.score;
                beta = Math.min(beta, move.score);
            }

            newBoard[availSpots[i]] = '';
            moves.push(move);

            // Alpha-Beta Pruning check
            if (beta <= alpha) {
                break; // Prune remaining branches — they can't change the outcome
            }
        }

        let bestMove;
        if (player === gameConfig.computerSymbol) {
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

    const handleGridNavigation = (e, index) => {
        let targetIndex = null;
        if (e.key === 'ArrowRight') targetIndex = index + 1;
        if (e.key === 'ArrowLeft') targetIndex = index - 1;
        if (e.key === 'ArrowDown') targetIndex = index + 3;
        if (e.key === 'ArrowUp') targetIndex = index - 3;
        if (targetIndex !== null && targetIndex >= 0 && targetIndex < 9) {
            e.preventDefault(); // Stop page from scrolling on arrow keys
            cells[targetIndex].focus();
        }
    };


    // --- Navigation & Event Listeners ---
    const showGameMode = () => {
        stopTimer();
        gameState.isActive = false;
        resetScores();
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
    cells.forEach((cell, idx) => cell.addEventListener('keydown', (e) => handleGridNavigation(e, idx)));
    restartButton.addEventListener('click', () => { resetScores(); startGame(); });
    rematchButton.addEventListener('click', startGame); // Rematch keeps scores

    playerVsPlayerBtn.addEventListener('click', () => { gameConfig.mode = 'pvp'; gameModeSelection.classList.add('hidden'); showPlayerChoice(); });
    playerVsComputerBtn.addEventListener('click', () => { gameConfig.mode = 'pvc'; gameModeSelection.classList.add('hidden'); showDifficultySelection(); });
    difficultyEasyBtn.addEventListener('click', () => { gameConfig.difficulty = 'easy'; showPlayerChoice(); });
    difficultyHardBtn.addEventListener('click', () => { gameConfig.difficulty = 'hard'; showPlayerChoice(); });
    chooseXBtn.addEventListener('click', () => { gameConfig.playerSymbol = 'X'; gameConfig.computerSymbol = 'O'; startGame(); });
    chooseOBtn.addEventListener('click', () => { gameConfig.playerSymbol = 'O'; gameConfig.computerSymbol = 'X'; startGame(); });
    backFromDifficultyBtn.addEventListener('click', showGameMode);
    backFromChoiceBtn.addEventListener('click', () => gameConfig.mode === 'pvc' ? showDifficultySelection() : showGameMode());
    backFromGameBtn.addEventListener('click', showGameMode);

    loadPersistedScores();
});