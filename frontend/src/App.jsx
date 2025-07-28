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

  const resetGame = () => {
    setBoard([
      ["", "", ""],
      ["", "", ""],
      ["", "", ""],
    ]);
    setCurrentPlayer(1);
    setGameStatus("ongoing");
    setWinner(null);
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
      } else if (data.status === "tie") {
        setGameStatus("tie");
      } else {
        setGameStatus("ongoing");
      }
    } catch (error) {
      console.error("Error checking game state:", error);
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
    setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
  };

  const renderCell = (row, col) => {
    // Add classes for border styling based on position
    let cellClasses = "cell";
    if (row === 0) cellClasses += " top-row";
    if (row === 2) cellClasses += " bottom-row";
    if (col === 0) cellClasses += " left-col";
    if (col === 2) cellClasses += " right-col";

    return (
      <button
        key={`${row}-${col}`}
        className={cellClasses}
        onClick={() => makeMove(row, col)}
        disabled={gameStatus !== "ongoing" || gameMode === null}
      >
        {board[row][col]}
      </button>
    );
  };

  const renderBoard = () => {
    return (
      <div className="board">
        {board.map((row, rowIndex) => (
          <div key={rowIndex} className="row">
            {row.map((_, colIndex) => renderCell(rowIndex, colIndex))}
          </div>
        ))}
      </div>
    );
  };

  const renderGameStatus = () => {
    if (gameStatus === "winner") {
      const playerName = winner === "X" ? "Player 1" : "Player 2";
      return (
        <div className="game-status">
          <h2>{playerName} wins!</h2>
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
    if (gameMode !== "player" || gameStatus !== "ongoing") {
      return null;
    }

    return (
      <div className="player-indicators">
        <button
          className={`player-btn ${currentPlayer === 1 ? "active" : "waiting"}`}
          disabled
        >
          {currentPlayer === 1 ? "Player 1, your turn" : "Wait for Player 1"}
        </button>
        <button
          className={`player-btn ${currentPlayer === 2 ? "active" : "waiting"}`}
          disabled
        >
          {currentPlayer === 2 ? "Player 2, your turn" : "Wait for Player 2"}
        </button>
      </div>
    );
  };

  if (gameMode === null) {
    return (
      <div className="app">
        <h1>Tic-Tac-Toe</h1>
        <div className="menu">
          <button onClick={startPlayerVsPlayer} className="mode-btn">
            Play against another player
          </button>
          <button onClick={startPlayerVsComputer} className="mode-btn" disabled>
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
