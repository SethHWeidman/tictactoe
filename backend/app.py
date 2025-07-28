import flask
from flask import request as flask_request
import flask_cors
import random

APP = flask.Flask(__name__)
flask_cors.CORS(APP)


def check_winner(board):
    """
    Check if there's a winner on the board.
    Returns the winning condition string or None if no winner.
    """
    # Check rows
    for i in range(3):
        if board[i][0] == board[i][1] == board[i][2] and board[i][0] != '':
            if i == 0:
                return 'top_row'
            elif i == 1:
                return 'middle_row'
            else:
                return 'bottom_row'

    # Check columns
    for j in range(3):
        if board[0][j] == board[1][j] == board[2][j] and board[0][j] != '':
            if j == 0:
                return 'left_column'
            elif j == 1:
                return 'middle_column'
            else:
                return 'right_column'

    # Check diagonals
    if board[0][0] == board[1][1] == board[2][2] and board[0][0] != '':
        return 'top_left_bottom_right_diagonal'

    if board[0][2] == board[1][1] == board[2][0] and board[0][2] != '':
        return 'top_right_bottom_left_diagonal'

    return None


def is_board_full(board):
    """Check if the board is full (tie game)."""
    for row in board:
        for cell in row:
            if cell == '':
                return False
    return True


def get_empty_cells(board):
    """Get all empty cells on the board."""
    empty_cells = []
    for i in range(3):
        for j in range(3):
            if board[i][j] == '':
                empty_cells.append((i, j))
    return empty_cells


def count_moves(board):
    """Count the number of moves made on the board."""
    count = 0
    for row in board:
        for cell in row:
            if cell != '':
                count += 1
    return count


def can_win_next_move(board, player):
    """Check if a player can win on their next move. Returns list of winning positions."""
    winning_moves = []
    empty_cells = get_empty_cells(board)

    for row, col in empty_cells:
        # Create a copy of the board with the move
        test_board = [row[:] for row in board]
        test_board[row][col] = player

        # Check if this move results in a win
        if check_winner(test_board):
            winning_moves.append((row, col))

    return winning_moves


def find_fork_opportunities(board, player):
    """Find moves that create two ways to win (fork opportunities)."""
    fork_moves = []
    empty_cells = get_empty_cells(board)

    for row, col in empty_cells:
        # Create a copy of the board with the move
        test_board = [row[:] for row in board]
        test_board[row][col] = player

        # Check how many ways this player can win after this move
        winning_moves = can_win_next_move(test_board, player)
        if len(winning_moves) >= 2:
            fork_moves.append((row, col))

    return fork_moves


def get_computer_move(board):
    """
    Implement the computer AI logic as specified:
    1. If empty board, play center
    2. If only one move:
       - If opponent played center, play random corner
       - Otherwise, play center
    3. If more moves:
       - Block opponent wins (random if multiple)
       - Create fork (two ways to win)
       - Create winning opportunity
    """
    empty_cells = get_empty_cells(board)
    move_count = count_moves(board)

    # If board is empty, play center
    if move_count == 0:
        return (1, 1)

    # If only one move has been made
    if move_count == 1:
        # If opponent played center, play random corner
        if board[1][1] != '':
            corners = [(0, 0), (0, 2), (2, 0), (2, 2)]
            available_corners = [corner for corner in corners if corner in empty_cells]
            return random.choice(available_corners)
        else:
            # Otherwise play center
            return (1, 1)

    # More than one move has been played
    # Computer is 'O', human is 'X'
    computer_player = 'O'
    human_player = 'X'

    # 1. Check if we can win immediately
    computer_winning_moves = can_win_next_move(board, computer_player)
    if computer_winning_moves:
        return random.choice(computer_winning_moves)

    # 2. Check if opponent can win and block them
    opponent_winning_moves = can_win_next_move(board, human_player)
    if opponent_winning_moves:
        return random.choice(opponent_winning_moves)

    # 3. Check if we can create a fork (two ways to win)
    fork_moves = find_fork_opportunities(board, computer_player)
    if fork_moves:
        return random.choice(fork_moves)

    # 4. Create a winning opportunity for next move
    # Try each empty cell and see if it creates a winning opportunity
    opportunity_moves = []
    for row, col in empty_cells:
        test_board = [row[:] for row in board]
        test_board[row][col] = computer_player

        # Check if this creates a winning opportunity
        future_wins = can_win_next_move(test_board, computer_player)
        if future_wins:
            opportunity_moves.append((row, col))

    if opportunity_moves:
        return random.choice(opportunity_moves)

    # If no strategic move found, play randomly
    return random.choice(empty_cells)


@APP.route('/check_game_state', methods=['POST'])
def check_game_state():
    """
    Endpoint to check the current game state.
    Expects a JSON payload with 'board' as a 3x3 list of lists.
    Returns the game status and winning condition if applicable.
    """
    data = flask_request.get_json()
    board = data.get('board')

    if not board or len(board) != 3 or any(len(row) != 3 for row in board):
        return flask.jsonify({'error': 'Invalid board format'}), 400

    winner = check_winner(board)

    if winner:
        # Determine which player won
        winning_player = None
        if winner in ['top_row', 'middle_row', 'bottom_row']:
            row_idx = ['top_row', 'middle_row', 'bottom_row'].index(winner)
            winning_player = board[row_idx][0]
        elif winner in ['left_column', 'middle_column', 'right_column']:
            col_idx = ['left_column', 'middle_column', 'right_column'].index(winner)
            winning_player = board[0][col_idx]
        elif winner == 'top_left_bottom_right_diagonal':
            winning_player = board[0][0]
        elif winner == 'top_right_bottom_left_diagonal':
            winning_player = board[0][2]

        return flask.jsonify(
            {'status': 'winner', 'winning_condition': winner, 'winner': winning_player}
        )

    if is_board_full(board):
        return flask.jsonify({'status': 'tie'})

    return flask.jsonify({'status': 'ongoing'})


@APP.route('/computer_move', methods=['POST'])
def computer_move():
    """
    Endpoint for the computer to make a move.
    Expects a JSON payload with 'board' as a 3x3 list of lists.
    Returns the computer's move as row and column indices.
    """
    data = flask_request.get_json()
    board = data.get('board')

    if not board or len(board) != 3 or any(len(row) != 3 for row in board):
        return flask.jsonify({'error': 'Invalid board format'}), 400

    try:
        row, col = get_computer_move(board)
        return flask.jsonify({'row': row, 'col': col})
    except Exception as e:
        return flask.jsonify({'error': f'Failed to get computer move: {str(e)}'}), 500


@APP.route('/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return flask.jsonify({'status': 'healthy'})


if __name__ == '__main__':
    APP.run(debug=True, port=5001)
