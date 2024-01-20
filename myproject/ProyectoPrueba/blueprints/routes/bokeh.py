from flask import Blueprint, render_template
import pandas as pd

from bokeh.embed import components
from bokeh.plotting import figure
from bokeh.resources import CDN

bokeh = Blueprint('bokeh', __name__, url_prefix='/bokeh')

# Diagrama barras horizontal - Bokeh
@bokeh.route('/1')
def bokeh_1(titulo="Bokeh", nombre="Antonio"):
    # init a basic bar chart:
    # http://bokeh.pydata.org/en/latest/docs/user_guide/plotting.html#bars

    df = pd.read_csv("./static/data/data.csv", sep=";")
    names = df['First name']
    amount = df['Identifier']

    fig = figure(width=600, height=600, y_range=names)
    fig.hbar(right=amount, left=0, y=names, height=0.4, color="green", fill_alpha=0.5)
    fig.title.text = "Grafico Prueba"
    fig.xaxis.axis_label = "Cantidad"
    fig.yaxis.axis_label = "Nombre"

    # grab the static resources
    js_resources = CDN.js_files[0]

    # render template
    script, div = components(fig)
    return render_template(
        'bokeh_1.html',
        titulo=titulo,
        nombre=nombre,
        plot_script=script,
        plot_div=div,
        js_resources=js_resources
    )