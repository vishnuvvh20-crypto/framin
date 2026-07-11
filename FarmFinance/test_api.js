const fetch = require('node-fetch');

async function test() {
  try {
    const formData = new URLSearchParams();
    const prompt = `Conversation context:
User: What is the best fertilizer for tomatoes?
Farmin AI: Use 5-10-10.

User's new message: What about for apples?
Please reply to the user's new message considering the context.`;
    formData.append('message', prompt);
    
    const res = await fetch('https://ai-agent-v01.onrender.com/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    });
    const data = await res.json();
    console.log("RESPONSE:", data);
  } catch(e) {
    console.error(e);
  }
}
test();
