import React, { useState, useEffect, useRef } from 'react';
    import { Chess } from 'chess.js';
    import stockfish from 'stockfish';

    function App() {
      const [game, setGame] = useState(new Chess());
      const [selectedSquare, setSelectedSquare] = useState(null);
      const [fen, setFen] = useState(game.fen());
      const [engineThinking, setEngineThinking] = useState(false);
      const engineRef = useRef(null);

      useEffect(() => {
        const sf = stockfish();
        engineRef.current = sf;
        sf.postMessage('uci');
        sf.postMessage('ucinewgame');
      }, []);

      useEffect(() => {
        if (game.turn() === 'b' && !game.isGameOver() && !engineThinking && engineRef.current) {
          setEngineThinking(true);
          engineRef.current.postMessage(`position fen ${game.fen()}`);
          engineRef.current.postMessage('go depth 10');

          engineRef.current.onmessage = (event) => {
            const message = String(event);
            if (message.startsWith('bestmove')) {
              const move = message.split(' ')[1];
              if (move) {
                makeMove(move);
              }
              setEngineThinking(false);
            }
          };
        }
      }, [game, engineThinking]);

      const handleSquareClick = (square) => {
        if (engineThinking) return;

        if (selectedSquare) {
          const move = { from: selectedSquare, to: square };
          const validMove = game.move(move);
          if (validMove) {
            setFen(game.fen());
            setSelectedSquare(null);
          } else {
            setSelectedSquare(square);
          }
        } else {
          setSelectedSquare(square);
        }
      };

      const makeMove = (move) => {
        game.move(move);
        setFen(game.fen());
      };

      const getPiece = (square) => {
        const piece = game.get(square);
        if (piece) {
          return piece.type;
        }
        return null;
      };

      const isLightSquare = (row, col) => {
        return (row + col) % 2 === 0;
      };

      const renderBoard = () => {
        const board = [];
        for (let row = 7; row >= 0; row--) {
          for (let col = 0; col < 8; col++) {
            const square = String.fromCharCode(97 + col) + (row + 1);
            const isSelected = square === selectedSquare;
            const piece = getPiece(square);
            const squareColor = isLightSquare(row, col) ? 'light' : 'dark';
            board.push(
              <div
                key={square}
                className={`square ${squareColor} ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSquareClick(square)}
              >
                {piece}
              </div>,
            );
          }
        }
        return board;
      };

      return (
        <div>
          <div className="board">{renderBoard()}</div>
          <p>FEN: {fen}</p>
          {game.isGameOver() && (
            <p>Game Over: {game.turn() === 'w' ? 'Black wins' : 'White wins'}</p>
          )}
        </div>
      );
    }

    export default App;
