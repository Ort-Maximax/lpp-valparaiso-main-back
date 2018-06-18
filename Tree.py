#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import sys
import json
import logging
# import datetime
import time


def path_to_dict(path):
    d = {'name': os.path.basename(path)}
    if os.path.isdir(path):
        d['children'] = [path_to_dict(os.path.join(path,x)) for x in os.listdir(path)]
    else:
        # TOASK est ce que l'on met le last date modified uniquement sur le fichier ?
        # TOASK trouver un format pour la date (DD-MM-YYYY?)
        # TOASK Ajouter la taille des fichiers ?
        d['lastUpdated'] = time.ctime(os.path.getmtime(path))
        # d['lastUpdated'] = os.stat(path).st_mtime
        # d['lastUpdated'] = datetime.datetime.fromtimestamp(path.getmtime()) #id SO 39359245
    return d


if len(sys.argv) < 2:
    logging.warning(os.path.realpath(__file__).split('/')[-1] + ": Argument(s) manquant(s).\npython3 Delete.py USER FILE|DIRECTORY [FILE|DIRECTORY] ...")

elif not os.path.isdir('./' + sys.argv[1]):
    os.makedirs('./' + sys.argv[1])
    print(json.dumps(path_to_dict('./' + sys.argv[1])))
    # logging.warning("The user " + sys.argv[1] + " does not exist or has not been initialised yet.")

else:
    print(json.dumps(path_to_dict('./' + sys.argv[1])))
    # TODO format de la réponse à spécifier, print ? return ? json dumb ou json encode ?
    # => cette réponse sera envoyé vers le micro service Main NodeJS
    # print(json.JSONEncoder().encode(path_to_dict('./' + sys.argv[1])))
