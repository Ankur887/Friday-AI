from gtts import gTTS
import os

language = 'en'
response = ''

with open("response_model.txt","r") as file:
    response.append(file.read())

myObj = gTTS(text=response, lang=language, slow=False)
myObj.save('model.mp3')
os.save('welcome.mp3')