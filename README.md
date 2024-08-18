## Inspiration
The idea for Pic-A-Project came from our love for DIY projects and the endless inspiration we get from images online. We realized that sometimes, you see something in a picture and wish you could recreate it but don't know where to start. We wanted to create a tool that bridges the gap between inspiration and creation, making it easy for anyone to turn a picture into a step-by-step project.

## Authors
@vanessatan2007: Fullstack, API Integration
@mrkingseasheep: Fullstack, API Integration

## What it does
Pic-A-Project allows users to upload a picture of anything they want to make, and the platform generates a detailed guide on how to recreate that item. Whether it's a piece of furniture, a craft project, or even a recipe, Pic-A-Project analyzes the image and provides users with a list of materials, tools, and step-by-step instructions to bring their vision to life.

## How we built it
We built Pic-A-Project using a combination of image recognition technology, and natural language processing. The frontend was designed using HTML & CSS to ensure a smooth user experience, while the backend was powered by Node.js and integrated with the Google Generative AI API to interpret and generate project instructions. 

## Challenges we ran into
One of the main challenges was to get Gemini to output specific suggestions. At first, the response kept asking for more information because it could not generate a response based on previous prompts. We fixed this by asking it to identify the object first, then passing that object with the prompt, so the suggestions were related to that prompt. 

## Accomplishments that we're proud of
We're proud of successfully creating a platform that turns inspiration into reality. The seamless integration of image recognition and AI to generate custom instructions is a major achievement. We’re also proud of the user-friendly interface that makes Pic-A-Project accessible to DIY enthusiasts of all skill levels.

## What we learned
Throughout the development process, we learned a lot about using the Google Generative AI API and how to phrase prompts to get the desired response. We also gained valuable insights into user experience design, especially the need to present information clearly and intuitively in instructional content.

## What's next for Pic-A-Project
In the future, we plan to expand Pic-A-Project's capabilities by improving the accuracy of our AI model and increasing the variety of projects it can handle. We also want to build a community feature where users can share their completed projects and have a gallery of their creations. Additionally, we're open to exploring web scraping to provide direct links to purchase the materials needed for each project. It would have been nice to use AI to generate a picture of the project at each step, however Google Gemini was unable to generate images from a prompt at the time of this project. 
