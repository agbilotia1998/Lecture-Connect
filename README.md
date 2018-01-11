# Lecture-Connect
A Real time lecture translation web app in different languages.Started during IIITA Hacks.

## Setting up the Project

- Cloning the project
Just run the following command on your terminal or CLI.
``` git clone https://github.com/agbilotia1998/Lecture-Connect ```

- Starting mongo server
Install mongo db server on you machine by typing ``` sudo apt-get install mongodb-server ```.
Type ``` mkdir /data/db``` from root.
Type ``` mongod ``` to start mongo server on your machine.

- Starting server
Enter into the clone directory using ``` cd Lecture-Connect ```.
Type ``` npm start ``` to start the server on your localhost.

- Deploying the project on Heroku.

Create a heroku account. 
Create a new app. 
Under the deploy tab of your newly created app.
Select ``` connect to github ``` and enter the name of your repository which you want to deploy. 
Wait for the app to be deployed.
In case of errors see heroku logs.

## Exploring the Project

Open ``` localhost:9000 ``` on your Chrome browser.

Professor:
  - Logging in with Professor's credentials. Use ``` professor ``` as username and ``` mypass ``` as password.
  - Type in the course name and select the language in which you wish to broadcast the translation.
  - Enter the room thus created.
  - Select language in which you wish to speak and start speaking.


Student:
  - Logging in as a student. Use your gmail to enter as student.
  - Select one of the active channels.
  - View the translated Lecture in Real-time.
