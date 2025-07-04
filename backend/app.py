from flask import Flask, jsonify
import psycopg2
import os
from flask_cors import CORS

conn = psycopg2.connect(
    dbname=os.getenv("POSTGRES_DB"),
    user=os.getenv("POSTGRES_USER"),
    password=os.getenv("POSTGRES_PASSWORD"),
    host=os.getenv("DB_HOST"),
    port=os.getenv("DB_PORT")
)

cur = conn.cursor()

app = Flask(__name__)
trusted_origins = os.getenv("TRUSTED_ORIGINS", "").split(",")
CORS(app, origins=trusted_origins)



@app.route("/")
def hello_world():
    return jsonify(message="Hello world!")


if __name__ == '__main__':
    app.run(debug=True)