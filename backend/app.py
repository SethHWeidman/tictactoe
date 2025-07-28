import flask
from flask import request as flask_request
import flask_cors

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


@APP.route('/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return flask.jsonify({'status': 'healthy'})


if __name__ == '__main__':
    APP.run(debug=True, port=5001)
