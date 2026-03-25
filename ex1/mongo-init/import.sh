#!/bin/bash
# Importa o JSON para a base de dados autoRepair, coleção repairs
mongoimport --host localhost --db autoRepair --collection repairs --type json --file /tmp/repairs.json --jsonArray