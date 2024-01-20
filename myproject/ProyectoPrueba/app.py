from flask import Flask, render_template
from flask import Blueprint
from flask_pymongo import PyMongo
from blueprints.routes.dataload import dataload as dataloadBP
from blueprints.routes.d3 import d3 as d3BP
from blueprints.routes.bokeh import bokeh as bokehBP
from blueprints.basic_endpoints.login import login_blp as loginBP

app = Flask(__name__)

# ============================================ MONGO ======================================================
app.config["MONGO_URI"] = "mongodb+srv://anthony:SKKdVPuVD92PBpEE@medicaldatabase.7tg1dju.mongodb.net/test"
mongo = PyMongo(app)
# =========================================================================================================


# ============= BLUEPRINTS ================
app.register_blueprint(dataloadBP)
app.register_blueprint(d3BP)
app.register_blueprint(bokehBP)
app.register_blueprint(loginBP)
# =========================================

# Inicio
@app.route("/")
def index(titulo="Presentación", nombre="Antonio"):
    # online_users = mongo.db.users
    # online_users.insert_one({'name' : 'Brian'})
    return render_template(
        "index.html",
        titulo=titulo,
        nombre=nombre,
        # online_users=online_users
    )

if __name__ == "__main__":
    mongo.init_app(app)
    app.run(debug=True)
