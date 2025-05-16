document.addEventListener('DOMContentLoaded', function() {
  const dynamicContent = document.getElementById('dynamicContent');
  
  // Default message
  let message = 'Hello World!';
  
  // Create message input
  const messageInput = document.createElement('input');
  messageInput.type = 'text';
  messageInput.value = message;
  messageInput.placeholder = '输入新内容...';
  messageInput.style.width = '80%';
  messageInput.style.padding = '10px';
  messageInput.style.marginBottom = '15px';
  messageInput.style.borderRadius = '4px';
  messageInput.style.border = '1px solid #ccc';
  
  // Create update button
  const updateButton = document.createElement('button');
  updateButton.textContent = '更新内容';
  updateButton.style.backgroundColor = '#4285f4';
  updateButton.style.color = 'white';
  updateButton.style.border = 'none';
  updateButton.style.padding = '10px 15px';
  updateButton.style.borderRadius = '4px';
  updateButton.style.cursor = 'pointer';
  updateButton.style.marginLeft = '10px';
  
  // Create content wrapper
  const contentWrapper = document.createElement('div');
  contentWrapper.style.marginTop = '20px';
  
  // Create heading
  const heading = document.createElement('h2');
  heading.textContent = '动态内容';
  
  // Create content display
  const content = document.createElement('p');
  content.textContent = message;
  content.style.fontSize = '24px';
  content.style.fontWeight = 'bold';
  content.style.color = '#333';
  content.style.padding = '20px';
  content.style.border = '1px solid #ddd';
  content.style.borderRadius = '5px';
  content.style.backgroundColor = '#f9f9f9';
  
  // Update function
  const updateContent = () => {
    message = messageInput.value || 'Hello World!';
    content.textContent = message;
    
    // Add animation effect
    let opacity = 0;
    content.style.opacity = opacity;
    
    // Fade in animation
    const fadeIn = setInterval(() => {
      opacity += 0.05;
      content.style.opacity = opacity;
      
      if (opacity >= 1) {
        clearInterval(fadeIn);
      }
    }, 50);
  };
  
  // Add event listener to button
  updateButton.addEventListener('click', updateContent);
  
  // Add event listener for Enter key
  messageInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      updateContent();
    }
  });
  
  // Append elements to the container
  contentWrapper.appendChild(heading);
  contentWrapper.appendChild(content);
  
  // Append input, button and content to container
  dynamicContent.appendChild(messageInput);
  dynamicContent.appendChild(updateButton);
  dynamicContent.appendChild(contentWrapper);
  
  // Initial fade in
  updateContent();
});
