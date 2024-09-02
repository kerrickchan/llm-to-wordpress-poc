import { Ollama, Settings } from 'llamaindex';
import readline from 'readline';
import WPAPI from 'wpapi';

// Set up WordPress API
const wp = new WPAPI({
  endpoint: 'http://localhost:8080/wp-json',
  username: 'user@gmail.com',
  password: 'B2tT tZbW QJG0 7G9v qbhQ 9rdM'
});

// Set up readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Set up LlamaIndex
const ollama = new Ollama({ model: "llama3.1" });

// Use Ollama LLM and Embed Model
Settings.llm = ollama;
Settings.embedModel = ollama;

interface GeneratedContent {
  title: string;
  content: string;
}

// Function to generate content using LlamaIndex
async function generateContent(content: string): Promise<string> {
  try {
    const stream = await ollama.chat({
      messages: [{ content, role: "user" }],
      stream: true,
    });

    let response = '';
    for await (const chunk of stream) {
      response += chunk.delta;
      process.stdout.write(chunk.delta);
    }
    console.log("\n\ndone");

    return content;
  } catch (error) {
    console.error('Error generating content:', error);
    throw error;
  }
}

// Function to post content to WordPress
async function postToWordPress(title: string, content: string): Promise<void> {
  try {
    const post = await wp.posts().create({
      title: title,
      content: content,
      status: 'draft',
    });
    console.log('Post created successfully. ID:', post.id);
    console.log('Post URL:', post.link);
  } catch (error) {
    console.error('Error posting to WordPress:', error);
  }
}

// Main function
async function main() {
  rl.question('Enter a prompt for content generation: ', async (prompt) => {
    const generatedContent = await generateContent(prompt);

    if (generatedContent) {
      console.log('Generated content:');
      console.log(generatedContent);
      return postToWordPress(prompt, generatedContent);
    } else {
      console.log('Failed to generate content.');
      rl.close();
    }
  });
}

main();
