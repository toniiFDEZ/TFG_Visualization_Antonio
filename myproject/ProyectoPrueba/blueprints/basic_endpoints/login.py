from flask import Blueprint, render_template

login_blp = Blueprint('login', __name__)

# Login
@login_blp.route('/login', methods=['POST', 'GET'])
def login():
    titulo = "Inicio de Sesión"
    error = None
    # if request.method == 'POST':
    #     if valid_login(request.form['username'],
    #                    request.form['password']):
    #         return log_the_user_in(request.form['username'])
    #     else:
    #         error = 'Invalid username/password'

    # the code below is executed if the request method
    # was GET or the credentials were invalid
    return render_template(
        'login.html',
        titulo=titulo,
        error=error
    )