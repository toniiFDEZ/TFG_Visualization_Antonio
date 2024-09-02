# Usar una imagen base de Python
FROM python:3.9

# Copiar el archivo de requisitos
COPY requirements.txt .

# Instalar las dependencias
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el resto del código de la aplicación
COPY . .

# Establecer la variable de entorno para Flask
ENV FLASK_APP=run.py
ENV DEBUG=True

ENV FLASK_APP=run.py
ENV FLASK_ENV=development

ENV ASSETS_ROOT=/static/assets

# Puerto
EXPOSE 5000

# Comando para ejecutar la aplicación
CMD ["python3", "-m", "flask", "run", "--host=0.0.0.0"]
