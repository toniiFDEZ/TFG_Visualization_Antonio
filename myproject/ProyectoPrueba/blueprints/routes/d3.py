from flask import Blueprint, render_template, jsonify
from .dataload import data

d3 = Blueprint('d3', __name__, url_prefix='/d3')

# Grafo de Arcos
@d3.route("/1")
def d3_1(titulo="D3 Arcos", nombre="Antonio"):
    # data = pd.read_csv("./static/data/data.csv", sep = ";")

    # Por si quiero cambiar nombre de columnas
    # data.rename(columns={'First name': 'name'}, inplace=True)

    # data = data.to_json(orient="records") #orient records me pilla cada fila, y la trata como si fuese un array
    return render_template(
        "d3_1.html",
        titulo=titulo,
        nombre=nombre,
        # data=data
    )

# Ruta para los datos
@d3.route("/1/devolverDatos") 
def devolverDatos():
    dataAux = data
    dataAux.rename(columns={'First name': 'name'}, inplace=True)
    dataAux = data.to_json(orient="records")
    return jsonify(dataAux)


# Diagrama de densidad
@d3.route("/2")
def d3_2(titulo="D3 Densidad", nombre="Antonio"):
    return render_template(
        "d3_2.html",
        titulo=titulo,
        nombre=nombre,
        data=data
    )


# Grafo de Arcos v2 / Mas complejo
@d3.route("/3")
def d3_3(titulo="D3 Arcos v2", nombre="Antonio"):
    return render_template(
        "d3_3.html",
        titulo=titulo,
        nombre=nombre,
    )


# Pagina doble diagrama interactivo
@d3.route("/4")
def d3_4(titulo="D3 Doble Diagrama Interactivo", nombre="Antonio"):
    return render_template(
        "d3_4.html",
        titulo=titulo,
        nombre=nombre,
    )
