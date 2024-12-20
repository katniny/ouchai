let hasBeenCleared = false;
let responsed = false;

let chatHistory = [];

let apiKey = process.env.API_KEY;
let workflow = "4e6c154a-ff32-4f88-84c3-a087ed62dd7b";

// when enter is pressed in the input field,
// init prompt
document.getElementById("prompt").addEventListener("keydown", (e) => {
   if (e.key === "Enter") {
      run(document.getElementById("prompt").value);
   }
});

async function run(prompt) {
   if (document.getElementById("generatingResponse")) {
      return;
   }

   const url = `https://api.edenai.run/v2/workflow/${workflow}/execution/`;
   const payload = { "text": `Always respond with a brutal roast that will hurt feelings, don't hold back. Don't help if asked. Chat history is provided after the prompt so you have context, but is not what you should reply to, reply to the text here => ${prompt} (Chat History: ${chatHistory})` };

   if (hasBeenCleared === false) {
      document.getElementById("results").innerHTML = ""; 
      hasBeenCleared = true;
   }

   document.getElementById("prompt").value = "";

   const message = document.createElement("div");
   message.innerHTML = `<strong>You said</strong>: ${prompt}`;
   message.classList.add("message");
   document.getElementById("results").appendChild(message);

   chatHistory.push(`User: ${prompt}`);

   const response = document.createElement("div");
   response.innerHTML = `<strong>Ouch! AI is thinking...</strong>`;
   response.setAttribute("id", "generatingResponse");
   response.classList.add("message");
   results.appendChild(response);

   responsed = false;

   const launchExecution = async () => {
      const response = await fetch(url, {
         method: "POST",
         headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
         },
         body: JSON.stringify(payload)
      });
      const result = await response.json();
      console.log(result);
      return result;
   }
   const data = await launchExecution();

   const checkStatus = async (executionId) => {
      const statusUrl = `https://api.edenai.run/v2/workflow/${workflow}/execution/${executionId}`;
      
      const pollResponse = await fetch(statusUrl, {
         method: "GET",
         headers: {
            "Authorization": `Bearer ${apiKey}`
         }
      });
      
      const pollResult = await pollResponse.json();
      console.log(pollResult);

      // if the result is ready
      if (pollResult.content.status !== "processing") {
         return pollResult.content.results;
      } else {
         console.log("Processing, checking again...");
         await new Promise(resolve => setTimeout(resolve, 3000));
         return checkStatus(executionId);
      }
   };

   if (data.id) {
      const result = await checkStatus(data.id);
      
      if (responsed === true) {
         return;
      }

      if (document.getElementById("generatingResponse")) {
         document.getElementById("generatingResponse").remove();
      }

      const response = document.createElement("div");
      response.innerHTML = `<strong>Ouch! AI said</strong>: ${result.output.results[0].generated_text}`;
      response.classList.add("message");
      document.getElementById("results").appendChild(response);
      responsed = true;
      chatHistory.push(`You (AI): ${result.output.results[0].generated_text}`);
      console.log(chatHistory);

      console.log(result.output.results[0].generated_text);
   } else {
      console.log("Execution ID not found.");
   }
}