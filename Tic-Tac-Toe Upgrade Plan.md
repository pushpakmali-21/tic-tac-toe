# **Cyberpunk Tic-Tac-Toe: Architecture & Feature Upgrade Plan**

This document serves as an actionable, phase-by-phase development blueprint to upgrade your retro-futuristic Tic-Tac-Toe game. By following these steps, you will transition the existing modular codebase into a high-performance, accessible, and deeply engaging arcade experience.

## **Phase 1: Code Cleanup & State Architecture**

### **Goal**

Refactor state management, fix layout shifts, and eliminate timer race conditions to guarantee gameplay stability.

### **Step 1.1: State Consolidation**

Refactor loose global variables in script.js into distinct, read-only configuration and dynamic state objects:

const gameConfig \= {  
    mode: 'pvp', // 'pvp' or 'pvc'  
    difficulty: 'easy', // 'easy' or 'hard'  
    playerSymbol: 'X',  
    computerSymbol: 'O',  
    turnDuration: 10 // seconds  
};

const gameState \= {  
    board: \['', '', '', '', '', '', '', '', ''\],  
    isActive: true,  
    currentTurn: 'X',  
    scores: { player1: 0, player2: 0, ties: 0 },  
    timerInterval: null  
};

### **Step 1.2: Refactor Timer Lifecycles**

Right now, the timer continues running behind the scenes during the computer's thinking delay (setTimeout). Ensure the active interval is cleared *immediately* upon any action:

1. Modify handlePlayerMove to call stopTimer() immediately at the top of the function.  
2. Only call startTimer() explicitly inside the player's turn state handoff.  
3. Completely bypass starting a timer when it is the computer's turn.

### **Step 1.3: Stabilize UI Layout Shifts**

In style.css, prevent dynamic text shifts from shifting layout components:

\#status-message-container {  
    min-height: 80px; /\* Force static spacing \*/  
    text-align: center;  
    margin-bottom: 20px;  
    display: flex;  
    flex-direction: column;  
    justify-content: center;  
}

\#timer-wrapper {  
    min-height: 100px; /\* Lock height so grid never jumps \*/  
}

## **Phase 2: Accessibility & Keyboard Navigation**

### **Goal**

Ensure the game is fully playable using keyboard arrow keys, tab indexing, and readable by screen-assistive technologies.

### **Step 2.1: Semantic Keyboard Triggers**

Update the grid cells in index.html to act as interactive keyboard elements. Change them from passive div blocks to HTML \<button\> elements, or add proper accessibility traits:

\<\!-- Inside \#board \--\>  
\<button class="cell" data-cell-index="0" aria-label="Cell 1, Empty"\>\</button\>

### **Step 2.2: Implement Keyboard Event Handlers**

In script.js, listen to keyboard navigation events. This allows focus handling across the ![][image1] grid using standard Arrow Keys:

// Adding arrow navigation across the grid  
const handleGridNavigation \= (e, index) \=\> {  
    let targetIndex \= null;  
    if (e.key \=== 'ArrowRight') targetIndex \= index \+ 1;  
    if (e.key \=== 'ArrowLeft') targetIndex \= index \- 1;  
    if (e.key \=== 'ArrowDown') targetIndex \= index \+ 3;  
    if (e.key \=== 'ArrowUp') targetIndex \= index \- 3;

    if (targetIndex \!== null && targetIndex \>= 0 && targetIndex \< 9\) {  
        cells\[targetIndex\].focus();  
    }  
};

cells.forEach((cell, idx) \=\> {  
    cell.addEventListener('keydown', (e) \=\> handleGridNavigation(e, idx));  
});

### **Step 2.3: Assistive Announcements (aria-live)**

Add accessibility live-regions to the status container so that assistive devices read turns and end-game announcements automatically:

\<div id="status-message-container" aria-live="polite"\>  
    \<div id="status-message"\>\</div\>  
    \<div id="sub-message"\>\</div\>  
\</div\>

## **Phase 3: Scoreboard Tracking & LocalStorage**

### **Goal**

Preserve game sessions and track matchups (Wins, Losses, Draws) through browser restarts.

### **Step 3.1: Build Scoreboard UI**

Add a high-tech glowing score counter directly above the grid container:

\<\!-- Insert inside \#game-container \--\>  
\<div id="scoreboard" class="scoreboard-grid"\>  
    \<div class="score-card"\>  
        \<span class="score-label"\>PLAYER 1 (X)\</span\>  
        \<span id="score-p1" class="score-num"\>0\</span\>  
    \</div\>  
    \<div class="score-card"\>  
        \<span class="score-label"\>TIES\</span\>  
        \<span id="score-ties" class="score-num"\>0\</span\>  
    \</div\>  
    \<div class="score-card"\>  
        \<span class="score-label"\>COMPUTER (O)\</span\>  
        \<span id="score-p2" class="score-num"\>0\</span\>  
    \</div\>  
\</div\>

/\* Matching Retro Neon styling \*/  
.scoreboard-grid {  
    display: grid;  
    grid-template-columns: repeat(3, 1fr);  
    gap: 15px;  
    width: 100%;  
    margin-bottom: 20px;  
}  
.score-card {  
    background: rgba(0, 255, 65, 0.05);  
    border: 1px solid var(--primary-color);  
    padding: 10px;  
    border-radius: 8px;  
    text-align: center;  
}  
.score-num {  
    display: block;  
    font-size: 1.8rem;  
    color: var(--accent-color);  
    text-shadow: 0 0 10px rgba(255, 255, 0, 0.5);  
}

### **Step 3.2: Score Persistence via LocalStorage**

Keep score states synchronized across page refreshes:

const loadPersistedScores \= () \=\> {  
    const saved \= localStorage.getItem('cyber\_ttt\_scores');  
    if (saved) {  
        gameState.scores \= JSON.parse(saved);  
        updateScoreboardDOM();  
    }  
};

const saveScores \= () \=\> {  
    localStorage.setItem('cyber\_ttt\_scores', JSON.stringify(gameState.scores));  
    updateScoreboardDOM();  
};

const updateScoreboardDOM \= () \=\> {  
    document.getElementById('score-p1').textContent \= gameState.scores.player1;  
    document.getElementById('score-p2').textContent \= gameState.scores.player2;  
    document.getElementById('score-ties').textContent \= gameState.scores.ties;  
};

## **Phase 4: AI Optimization (Alpha-Beta Pruning)**

### **Goal**

Implement Alpha-Beta pruning to reduce unnecessary node branches evaluated by the recursive Minimax algorithm.

### **Step 4.1: Expand Minimax Parameters**

Add alpha (![][image2]) and beta (![][image3]) boundaries to limit evaluations. The initial search should begin at context boundaries of ![][image4].

const minimax \= (newBoard, player, alpha \= \-Infinity, beta \= Infinity) \=\> {  
    const availSpots \= newBoard.map((val, i) \=\> (val \=== '') ? i : null).filter(v \=\> v \!== null);

    if (checkWin(newBoard, playerSymbol)) return { score: \-10 };  
    if (checkWin(newBoard, computerSymbol)) return { score: 10 };  
    if (availSpots.length \=== 0\) return { score: 0 };

    const moves \= \[\];

    for (let i \= 0; i \< availSpots.length; i++) {  
        const move \= {};  
        move.index \= availSpots\[i\];  
        newBoard\[availSpots\[i\]\] \= player;

        if (player \=== computerSymbol) {  
            const result \= minimax(newBoard, playerSymbol, alpha, beta);  
            move.score \= result.score;  
            alpha \= Math.max(alpha, move.score);  
        } else {  
            const result \= minimax(newBoard, computerSymbol, alpha, beta);  
            move.score \= result.score;  
            beta \= Math.min(beta, move.score);  
        }

        newBoard\[availSpots\[i\]\] \= '';  
        moves.push(move);

        // Alpha-Beta Pruning check  
        if (beta \<= alpha) {  
            break; // Prune unnecessary branch  
        }  
    }

    // Determine best index (remaining selection logic remains identical)  
    let bestMove;  
    if (player \=== computerSymbol) {  
        let bestScore \= \-Infinity;  
        for (let i \= 0; i \< moves.length; i++) {  
            if (moves\[i\].score \> bestScore) {  
                bestScore \= moves\[i\].score;  
                bestMove \= i;  
            }  
        }  
    } else {  
        let bestScore \= Infinity;  
        for (let i \= 0; i \< moves.length; i++) {  
            if (moves\[i\].score \< bestScore) {  
                bestScore \= moves\[i\].score;  
                bestMove \= i;  
            }  
        }  
    }  
    return moves\[bestMove\];  
};

## **Phase 5: Sound Synthesis (Web Audio API)**

### **Goal**

Deliver retro arcade vibes programmatically without burdening network payloads with physical audio assets.

### **Step 5.1: Create Sound Engine Utility**

Implement a synthesis function utilizing the client browser's natural AudioContext:

const synthSound \= (frequency, type \= 'sine', duration \= 0.1) \=\> {  
    try {  
        const audioCtx \= new (window.AudioContext || window.webkitAudioContext)();  
        const oscillator \= audioCtx.createOscillator();  
        const gainNode \= audioCtx.createGain();

        oscillator.type \= type;  
        oscillator.frequency.value \= frequency;

        gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);  
        // Clean linear exponential sweep to zero to eliminate audible clicking noises  
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime \+ duration);

        oscillator.connect(gainNode);  
        gainNode.connect(audioCtx.destination);

        oscillator.start();  
        oscillator.stop(audioCtx.currentTime \+ duration);  
    } catch (e) {  
        console.warn("Audio Context blocked by client policies:", e);  
    }  
};

### **Step 5.2: Track and Bind Arcade Triggers**

Map out synth events for in-game actions inside your event loop handles:

* **Grid Interaction:** synthSound(600, 'triangle', 0.08);  
* **Win Sequence:** Trigger an ascending arpeggio on game end:  
  const playWinSound \= () \=\> {  
      synthSound(523.25, 'sine', 0.15); // C5  
      setTimeout(() \=\> synthSound(659.25, 'sine', 0.15), 100); // E5  
      setTimeout(() \=\> synthSound(783.99, 'sine', 0.3), 200); // G5  
  };

* **Failure / Timeout Sweep:** A low frequency downward sweep:  
  const playLoseSound \= () \=\> {  
      synthSound(220, 'sawtooth', 0.4); // A3 Low Buzz  
  };  


[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAAAZCAYAAABOxhwiAAACdUlEQVR4Xu2VvWtUQRTFdzGKoiCo68J+vf1AhVVQXBGCjY1iEBHUQgjY2IqgFkJip8FKELQRJJpiGwmkEFEwhYX/gKD4D9hIKq20kPg77h2Z3LxHdosEAu/AYd+bOXfueXfvzBQKOXKMhl6vt7XRaByu1+tHxFKptMtrNgLNZnN7kiTHa7XaAT37+VXYlMYRHEO8AK/DO8Yf+mW66PXrBfJNwHk4SREfmodLoteGL3wDP1Sr1b1hnPcZ+BuOx/r1QqVS2Ueuzxh+QbV3MDRmH/HN2FoRYMZV7e+tVutQGOd9Ci7DiVjvUS6XdxJX9uMxZEqt6MdjqGjk+iRaAYs89+FPkRxHfcy//u52u9v0rK8V+fJ3qkCn09nv9THa7fZuPn6OfXHCzwmscR4+Wsu4IA9Bp2IQ9xW+Fu1fWA0FaEMgum/8ot73ujTIPPpXJDsZxhLrTdZ4PIzpAHWADgdiZ+FHql8Tve4/ML2HoIuIbxvfU/VTXpcFM9+X+WB4VNMCPqrkvWLFW2Ddg6LXZYKgG/APi5zxc1kw84vEvAwt5zUjQD3+FC6JOqq9IBWbwXhRu9hfOAgvJINTpS9NPJeFZNDXszrS1DJxzw+BLToI4kuHde6aB3EqFivZeDI4rxd1tIXxyPg8r2NRSCrQXYZP1NOh38VhzWP4quV7Hsac8ZlYX7AdvKSNVIgMJoNWWdaCkTwVsekwJvN2VD4bxjy6c6zxC7M3bSi0ioqaehEWCbrFxFs4may88u+tdSqQqI1uOktn1X+gS8jPxVC8jOJlTsVq2JXP7zWxkNWuSkBlzgbq3Ws2AuQuq00xfzru9xw5cuTIkYq/Nci2BJUuu0kAAAAASUVORK5CYII=>

[image2]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAAdCAYAAABxPebnAAAA/UlEQVR4XmNgGAVDEsjIyKjIy8tnAXGytLS0MLo8VkC0JmNjY1YFBYVOKF6oqKgoLycn5wLEJ0FskGYQBvJdYXoYgZwyoMkHQFhJSYkfJAjUzAHkbwXSDUDsDsJAdSFgHUCT1IGSL4GC6SAMMwmqcSEQbwTKt4IwUK04WALICQLiT0ABfRBG1gQUnwTE/zAMJFdTERA/BGJJEEbSwwD0QzlQ7DSQFgRhuARQ0BKIrwFDRwaEkcQ1gaZfkocGDghLSUlxgSWRgnsjFMcDFc4D0gWysrImQPZFIJ4NwkDbfOG2gYCoqCgPCINCCGQQTByomQOIBUAYWf0oGAUIAAB6S0PXjDeEiwAAAABJRU5ErkJggg==>

[image3]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAAcCAYAAAC6YTVCAAABR0lEQVR4Xu2Svy4FQRTGR0RCEIVsNrL/J5KNRKLYVqeS3IiERkuhU0iQaEhEo1IoKTyBzu2RaD0AL+EJ/L61e425cgui4iS/3Hu+852ZMztjzB+JMAzHsyw7g5s8z+/4XRa+rxdVVY2kaXoQx/Gs8iiKYhoeGgrfXwcN66y+2uYYZ+BJUKtcr2HlMUHxxFo71eoYF9EeBbtOuz1acU6wy7aKmJeKolhA68Ka+NSgwNRpofEa0ys8w6XOKfye7zVRPBQ02VZrznibJMmKcP0mCIIJVj8WuiO3pl11BcLVNZqFHeHqZVlOstM97Aq3ptF043vC1RlpHu1F99N3RxRO4UKQDknTwcmvMO83Wq3XwcyjaqJ4JMjPybegy/8NLMM984+a9CDdL6Mv2TyXj3H8SN/fVv8TGRQ0bOqN+frA0F2Yr+b+j1+KNxLLVIyy+S/OAAAAAElFTkSuQmCC>

[image4]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAF4AAAAZCAYAAAC4j5m6AAADdUlEQVR4Xu2YW4hNURjH92lGESKMM+Zc9plzMISogwfRSJNLbmWmUFOTpDQmZdQ8iCIpnl2mlAc8iBcvojzwQF5GQormjQcvYl54US6//+y92K3O7lw6Yx/sf/3be33rW2t967+/dTnHcWLE+O9QKBTmuq77KJvNvoNdou0TIxzpdHpZLpd7Kerdrg8Fos+Dp217jOqA8AdJ2qJtD0UsfH0QCx8RYuGdcRE2tbe3b7TtE4lYeIAA20XbPpFoCOFTqdRskUB66XvQD6gp6FMsFidRt8HnMQJfb/vUiiqET+Tz+YWKkfH7uOFlbAchOBduLvPteiFy4TOZzEr6eyESzFWed+AP+IQJpOWDfQXl5zxPiUxmAeVd8DJCzLD7rBYVCp9g7COMOaJx4SvFie2cqMSQD7Z+P9Y9zK3A+3E4oDqf44hUeAScQl/n2V9d0dgJqAv7mCZHgJ08H8M1wbYCE1tH/T7bXi0qEZ6xljLWWV/g8RVI+SRxfRdpP0x5L+/3mNesQFN9jEG1F42xbsJj2+96mVCWyga1QezllA/ZfQnYu+E3+BX/3Xa90NHRMV2xJJPJqXZdKYTFSP/3RduOMD2i2vI8gHCrgv3525/xV/aPwlzQR1A7tReNLRbei+fvFb4WaOBs+F8OWqIXNCF8hlS2HUAz9YMtLS3T7IpqkK1gq6G+15w5QZA8SZE4XsMx3lfbPrTNI3SfaGxRC5+Hh227oD0fPIXvXS/zu0v4aMJneG2266pBJcJrfHzWlrL7fAu/KOuD55WAbbNWbXDlRiq842XsCYJYJBoj7605b+kP5DyMalIs2R0iLgn/YL7ol01f1+AHkUktMf2VQyXCK9v1kTWusWm1Ynsm5rybl9keRxS0fHSdpHxb7YMrJmrhHV0H3d/75A0CuimhCWqb428v+hDU3XK9a6b4GX6E/cYHNNNm2PVvGXDrr0HKoBLhBV/cu/AKfAAf+omRC/h0ut62ozg/wTdqF+jG+EUrfBAEM1M/PpzS+7nqJ4vaYsy1zgaxbfFZd+F9NOmv8XLnSgVzaRzh64AEkxkSiXGxXRkGRGhta2ubY9snEv+U8LpRENtR0QnJtEZBrcJfp1EPB0dKtH2igu7z2oLCtqFGgH7VIvpONLwUC/8HUbPwjn+46AOYw852iBEOJYX50dXICRIjRnT4CZjMP9oiz889AAAAAElFTkSuQmCC>