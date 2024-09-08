
# TFG_Visualization_Antonio - Flask Application - Cliente-Servidor Orientada a Servicios

Este proyecto es una aplicación web cliente-servidor desarrollada con **Flask** y **Python 3.9**. Puedes ejecutar la aplicación de dos maneras:

1. **Utilizando una imagen preconfigurada en Docker Hub**.
2. **Manualmente**, configurando el entorno virtual y las dependencias de Python.

## Requisitos

Antes de comenzar, asegúrate de tener instalado lo siguiente:

- **Docker** (si deseas ejecutar la imagen de Docker).
- **Python 3.9** (si deseas ejecutar el proyecto manualmente).
- **pip** (el gestor de paquetes de Python).
- **Virtualenv** (para gestionar entornos virtuales de Python).

---

## 1. Ejecutar la aplicación con Docker

Puedes usar la imagen de Docker ya preparada en Docker Hub.

### Pasos:

1. Asegúrate de tener Docker instalado. Puedes comprobarlo con el siguiente comando:

    ```bash
    docker --version
    ```

2. Ejecuta el siguiente comando para lanzar la aplicación desde la imagen de Docker Hub:

    ```bash
    docker run -d -p 5000:5000 toniifdez/tfg_antoniofdez:latest
    ```

3. Abre tu navegador y visita `http://localhost:5000` para acceder a la aplicación Flask.

4. Para detener el contenedor, utiliza:

    ```bash
    docker stop <container_id>
    ```

---

## 2. Ejecutar la aplicación manualmente

Si prefieres no utilizar Docker, también puedes ejecutar la aplicación manualmente siguiendo estos pasos.

### Pasos:

### 2.1. Clonar el repositorio

Clona este repositorio en tu máquina local:

```bash
git clone https://github.com/ugritai/TFG_Visualization_Antonio.git
cd myproject
```

### 2.2. Activar el entorno virtual

- En **Linux/macOS**:

    ```bash
    source TFG/bin/activate
    ```

- En **Windows**:

    ```bash
    TFG\Scripts\activate
    ```

### 2.3. Instalar las dependencias

Instala las dependencias necesarias que están especificadas en el archivo `requirements.txt`:

```bash
cd flask-atlantis-dark
pip install -r requirements.txt
```

### 2.4. Ejecutar la aplicación

Una vez instaladas las dependencias, puedes lanzar la aplicación ejecutando:

```bash
python3 -m flask run
```

La aplicación estará disponible en `http://127.0.0.1:5000/`.

### 2.5. Configuración adicional (si es necesario)

Si necesitas cambiar alguna configuración, edita el archivo `config.py` o las variables de entorno en tu sistema.

---

## Notas adicionales

### Variables de entorno

- **FLASK_ENV**: Puedes configurar el entorno de Flask como desarrollo o producción. Ejemplo para desarrollo:

    ```bash
    export FLASK_ENV=development
    ```

- **Otros**: Puedes definir variables adicionales según tus necesidades (base de datos, servicios externos, etc.).

---

### Recursos y Documentación

- [Flask Documentation](https://flask.palletsprojects.com/en/2.0.x/)
- [Docker Documentation](https://docs.docker.com/get-started/)

---

Si tienes alguna duda o problema, no dudes en abrir un **issue** o contribuir con mejoras.
