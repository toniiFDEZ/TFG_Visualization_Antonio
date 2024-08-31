from cmath import cos, pi, sin
import json
from pathlib import Path
from flask import Blueprint, jsonify, request
from bokeh.plotting import figure
from bokeh.models import ColumnDataSource, Slider, CustomJS, LinearColorMapper, ColorBar, HoverTool
from bokeh.plotting import figure
from bokeh.layouts import column
from bokeh.embed import components
from bokeh.transform import transform, linear_cmap
from bokeh.palettes import Viridis256 as palette
from bokeh.palettes import Turbo256
import numpy as np
import pandas as pd
import re

from sklearn.cluster import KMeans  # Import regular expressions

api_url = '/bokeh'
api_name = 'bokeh'

bokeh = Blueprint(name=api_name, url_prefix=api_url, import_name=__name__)

@bokeh.route('/get_barchart/<string:data>', methods=['GET'])
def get_barchart(data):
    file_path = Path(f'apps/static/assets/data/frequent_itemset/{data}_freqItemset.tsv')

    if not file_path.exists():
        return jsonify(error="Archivo no encontrado"), 404

    df = pd.read_csv(file_path, sep='\t')
    df['itemsets'] = df['itemsets'].apply(lambda x: list(eval(x))[0])
    df = df.rename(columns={'support': 'Frequency', 'itemsets': 'Item'})

    source = ColumnDataSource(df)
    original_source = ColumnDataSource(df)

    num_items = len(df['Item'].unique())
    if num_items > 50:
        p = figure(y_range=df['Item'].unique().tolist(), title="Frecuencia de Ítems",
                toolbar_location=None, tools="",
                height=num_items*10, width=800)  # Corrected 'height' instead of 'plot_height'
    else:
        p = figure(y_range=df['Item'].unique().tolist(), title="Frecuencia de Ítems",
                toolbar_location=None, tools="",
                height=600, width=800)  # Corrected 'height' instead of 'plot_height'
    p.hbar(y='Item', right='Frequency', height=0.9, source=source,
           color="navy", line_color="white", fill_alpha=0.6)

    p.ygrid.grid_line_color = None
    p.x_range.start = 0
    p.xaxis.axis_label = "Frecuencia"
    p.yaxis.axis_label = "Ítem"

    # Crear un control deslizante para el filtro de frecuencia
    slider = Slider(start=0, end=1, value=0, step=0.01, title="Filtro de Frecuencia Mínima")
    callback = CustomJS(args=dict(source=source, original_source=original_source, slider=slider),
                        code="""
        const data = source.data;
        const original_data = original_source.data;
        const f = slider.value;
        source.data = {'Item': [], 'Frequency': []};
        for (var i = 0; i < original_data['Frequency'].length; i++) {
            if (original_data['Frequency'][i] >= f) {
                source.data['Item'].push(original_data['Item'][i]);
                source.data['Frequency'].push(original_data['Frequency'][i]);
            }
        }
        source.change.emit();
    """)

    slider.js_on_change('value', callback)

    # Agregar herramientas de hover para mostrar más detalles
    hover = HoverTool()
    hover.tooltips = [("Item", "@Item"), ("Frecuencia", "@Frequency")]
    p.add_tools(hover)

    layout = column(slider, p)
    script, div = components(layout)

    # Use a regular expression to remove <script> and </script> tags
    script_cleaned = re.sub(r'<script[^>]*>', '', script)  # Remove <script> tag
    script_cleaned = re.sub(r'</script>', '', script_cleaned)  # Remove </script> tag

    return jsonify(script=script_cleaned, div=div)


@bokeh.route('/get_buble_cluster/<string:data>', methods=['GET'])
def get_bubble_chart(data):
    file_path = Path(f'apps/static/assets/data/rules_table_tsv/{data}_rules.tsv')

    if not file_path.exists():
        return jsonify(error="Archivo no encontrado"), 404

    df = pd.read_csv(file_path, sep='\t')
    df['antecedents'] = df['antecedents'].apply(lambda x: str(eval(x))[11:-2])
    df['consequents'] = df['consequents'].apply(lambda x: str(eval(x))[11:-2])

    # Supongamos que 'lift' y 'confidence' están disponibles directamente
    features = df[['lift', 'confidence']].fillna(0).values

    # Ejecutar KMeans clustering (para dividir en secciones)
    kmeans = KMeans(n_clusters=3, random_state=42)
    df['cluster'] = kmeans.fit_predict(features)
    df['size'] = df['lift'] * 10  # Escalar el lift para el tamaño de las burbujas

    # Preparar los datos para Bokeh
    source = ColumnDataSource(df)

    # Crear la figura
    p = figure(width=800, height=600, title="Bubble Chart de Clusters",
               x_axis_label='Lift', y_axis_label='Confidence')

    mapper = linear_cmap(field_name='cluster', palette=Turbo256, low=min(df['cluster']), high=max(df['cluster']))

    # Dibujar las burbujas
    p.circle(x='lift', y='confidence', size='size', source=source, color=mapper, fill_alpha=0.6,
             line_color='black', legend_field='cluster')

    # Agregar herramientas de hover para mostrar más detalles
    hover = HoverTool()
    hover.tooltips = [("Antecedente", "@antecedents"), ("Consecuente", "@consequents"), ("Lift", "@lift"), ("Confidence", "@confidence"), ("Cluster", "@cluster")]
    p.add_tools(hover)

    # Organizar el layout y crear los componentes
    script, div = components(column(p))

    # Limpiar etiquetas de script para enviar por JSON
    script_cleaned = re.sub(r'<script[^>]*>', '', script)
    script_cleaned = re.sub(r'</script>', '', script_cleaned)

    return jsonify(script=script_cleaned, div=div)