@echo off
echo ===== Table de Rappel Minecraft - Installation =====
echo.

REM Vérifier si npm est installé
WHERE npm >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    echo ERREUR: Node.js/npm n'est pas installé!
    echo Veuillez télécharger et installer Node.js depuis https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo Installation des dépendances...
call npm install
echo Code retour npm install: %ERRORLEVEL%

REM Créer le dossier data si nécessaire
echo.
echo Création du dossier data si nécessaire...
if not exist "data" (
    mkdir "data"
    echo Dossier data créé.
) else (
    echo Le dossier data existe déjà.
)

echo.
echo ===== Démarrage du serveur =====
echo Le serveur sera disponible à l'adresse: http://localhost:3000
echo Pour arrêter le serveur, appuyez sur Ctrl+C
echo.

REM Démarrer le serveur Node.js
node backend/server.js

REM Si le serveur s'arrête avec une erreur
IF %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERREUR: Le serveur a rencontré un problème.
    echo Code d'erreur: %ERRORLEVEL%
    pause
)

pause 