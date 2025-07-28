import { useState } from "react";
import "./App.css";

function App() {
  const [gameMode, setGameMode] = useState(null); // null, 'player', 'computer'
  const [board, setBoard] = useState([
    ["", "", ""],
    ["", "", ""],
    ["", "", ""],
  ]);
  const [currentPlayer, setCurrentPlayer] = useState(1); // 1 for X, 2 for O
  const [gameStatus, setGameStatus] = useState("ongoing"); // 'ongoing', 'winner', 'tie'
  const [winner, setWinner] = useState(null);
  const [winningCondition, setWinningCondition] = useState(null);

  const resetGame = () => {
    setBoard([
      ["", "", ""],
      ["", "", ""],
      ["", "", ""],
    ]);
    setCurrentPlayer(1);
    setGameStatus("ongoing");
    setWinner(null);
    setWinningCondition(null);
  };

  const startPlayerVsPlayer = () => {
    setGameMode("player");
    resetGame();
  };

  const startPlayerVsComputer = () => {
    setGameMode("computer");
    resetGame();
  };

  const backToMenu = () => {
    setGameMode(null);
    resetGame();
  };

  const checkGameState = async (newBoard) => {
    try {
      const response = await fetch("http://127.0.0.1:5001/check_game_state", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ board: newBoard }),
      });

      if (!response.ok) {
        throw new Error("Failed to check game state");
      }

      const data = await response.json();

      if (data.status === "winner") {
        setGameStatus("winner");
        setWinner(data.winner);
        setWinningCondition(data.winning_condition);
      } else if (data.status === "tie") {
        setGameStatus("tie");
      } else {
        setGameStatus("ongoing");
      }
    } catch (error) {
      console.error("Error checking game state:", error);
    }
  };

  const getComputerMove = async (board) => {
    try {
      const response = await fetch("http://127.0.0.1:5001/computer_move", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ board: board }),
      });

      if (!response.ok) {
        throw new Error("Failed to get computer move");
      }

      const data = await response.json();
      return { row: data.row, col: data.col };
    } catch (error) {
      console.error("Error getting computer move:", error);
      return null;
    }
  };

  const makeMove = async (row, col) => {
    if (
      board[row][col] !== "" ||
      gameStatus !== "ongoing" ||
      gameMode === null
    ) {
      return;
    }

    // In computer mode, only allow human moves when it's player 1's turn
    if (gameMode === "computer" && currentPlayer !== 1) {
      return;
    }

    const newBoard = board.map((r, rowIndex) =>
      r.map((cell, colIndex) => {
        if (rowIndex === row && colIndex === col) {
          return currentPlayer === 1 ? "X" : "O";
        }
        return cell;
      })
    );

    setBoard(newBoard);
    await checkGameState(newBoard);

    // If game is over, don't continue
    const gameState = await checkGameStateSync(newBoard);
    if (gameState.status !== "ongoing") {
      return;
    }

    // Switch to next player
    const nextPlayer = currentPlayer === 1 ? 2 : 1;
    setCurrentPlayer(nextPlayer);

    // If it's computer mode and now it's the computer's turn (player 2)
    if (gameMode === "computer" && nextPlayer === 2) {
      // Small delay to make the computer move feel more natural
      setTimeout(async () => {
        const computerMove = await getComputerMove(newBoard);
        if (computerMove && gameStatus === "ongoing") {
          await makeComputerMove(computerMove.row, computerMove.col, newBoard);
        }
      }, 500);
    }
  };

  const checkGameStateSync = async (board) => {
    try {
      const response = await fetch("http://127.0.0.1:5001/check_game_state", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ board: board }),
      });

      if (!response.ok) {
        throw new Error("Failed to check game state");
      }

      return await response.json();
    } catch (error) {
      console.error("Error checking game state:", error);
      return { status: "ongoing" };
    }
  };

  const makeComputerMove = async (row, col, currentBoard) => {
    const newBoard = currentBoard.map((r, rowIndex) =>
      r.map((cell, colIndex) => {
        if (rowIndex === row && colIndex === col) {
          return "O"; // Computer is always O
        }
        return cell;
      })
    );

    setBoard(newBoard);
    await checkGameState(newBoard);
    setCurrentPlayer(1); // Switch back to human player
  };

  const renderCell = (row, col) => {
    // Add classes for border styling based on position
    let cellClasses = "cell";
    if (row === 0) cellClasses += " top-row";
    if (row === 2) cellClasses += " bottom-row";
    if (col === 0) cellClasses += " left-col";
    if (col === 2) cellClasses += " right-col";

    // Disable clicks when game is not ongoing, no mode selected, or when it's
    // computer's turn
    const isDisabled =
      gameStatus !== "ongoing" ||
      gameMode === null ||
      (gameMode === "computer" && currentPlayer === 2);

    return (
      <button
        key={`${row}-${col}`}
        className={cellClasses}
        onClick={() => makeMove(row, col)}
        disabled={isDisabled}
      >
        {board[row][col]}
      </button>
    );
  };

  const renderWinningLine = () => {
    if (!winningCondition) return null;
    
    // Map backend winning condition names to CSS class names
    const lineClassMap = {
      'top_row': 'top-row',
      'middle_row': 'middle-row', 
      'bottom_row': 'bottom-row',
      'left_column': 'left-column',
      'middle_column': 'middle-column',
      'right_column': 'right-column',
      'top_left_bottom_right_diagonal': 'top-left-bottom-right-diagonal',
      'top_right_bottom_left_diagonal': 'top-right-bottom-left-diagonal'
    };
    
    const lineClass = lineClassMap[winningCondition];
    if (!lineClass) return null;
    
    return <div className={`winning-line ${lineClass}`}></div>;
  };

  const renderBoard = () => {
    return (
      <div className="board">
        {board.map((row, rowIndex) => (
          <div key={rowIndex} className="row">
            {row.map((_, colIndex) => renderCell(rowIndex, colIndex))}
          </div>
        ))}
        {renderWinningLine()}
      </div>
    );
  };

  const renderGameStatus = () => {
    if (gameStatus === "winner") {
      let playerName;
      if (gameMode === "computer") {
        playerName = winner === "X" ? "You" : "Computer";
      } else {
        playerName = winner === "X" ? "Player 1" : "Player 2";
      }
      return (
        <div className="game-status">
          <h2>
            {playerName} win{playerName === "You" ? "" : "s"}!
          </h2>
          <button onClick={resetGame} className="reset-btn">
            Play Again
          </button>
          <button onClick={backToMenu} className="menu-btn">
            Back to Menu
          </button>
        </div>
      );
    } else if (gameStatus === "tie") {
      return (
        <div className="game-status">
          <h2>It's a tie!</h2>
          <button onClick={resetGame} className="reset-btn">
            Play Again
          </button>
          <button onClick={backToMenu} className="menu-btn">
            Back to Menu
          </button>
        </div>
      );
    }
    return null;
  };

  const renderPlayerIndicators = () => {
    if (gameStatus !== "ongoing") {
      return null;
    }

    if (gameMode === "player") {
      return (
        <div className="player-indicators">
          <button
            className={`player-btn ${
              currentPlayer === 1 ? "active" : "waiting"
            }`}
            disabled
          >
            {currentPlayer === 1 ? "Player 1, your turn" : "Wait for Player 1"}
          </button>
          <button
            className={`player-btn ${
              currentPlayer === 2 ? "active" : "waiting"
            }`}
            disabled
          >
            {currentPlayer === 2 ? "Player 2, your turn" : "Wait for Player 2"}
          </button>
        </div>
      );
    } else if (gameMode === "computer") {
      return (
        <div className="player-indicators">
          <button
            className={`player-btn ${
              currentPlayer === 1 ? "active" : "waiting"
            }`}
            disabled
          >
            {currentPlayer === 1 ? "Your turn" : "Wait for your turn"}
          </button>
          <button
            className={`player-btn ${
              currentPlayer === 2 ? "active" : "waiting"
            }`}
            disabled
          >
            {currentPlayer === 2 ? "Computer's turn" : "Wait for computer"}
          </button>
        </div>
      );
    }

    return null;
  };

  if (gameMode === null) {
    return (
      <div className="app">
        <h1>Tic-Tac-Toe</h1>
        <div className="menu">
          <button onClick={startPlayerVsPlayer} className="mode-btn">
            Play against another player
          </button>
          <button onClick={startPlayerVsComputer} className="mode-btn">
            Play against the computer
          </button>
        </div>
        {renderBoard()}
      </div>
    );
  }

  return (
    <div className="app">
      <h1>Tic-Tac-Toe</h1>
      {renderPlayerIndicators()}
      {renderBoard()}
      {renderGameStatus()}
    </div>
  );
}

export default App;
