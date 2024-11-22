function goToLogin() {
    window.location.href = "login.html";
}


function toggleSocials() {
    const socialLinks = document.getElementById("socialLinks");
    socialLinks.style.display =
      socialLinks.style.display === "block" ? "none" : "block";
  }
  
  function showMessage() {
    const messageBox = document.getElementById("message");
    messageBox.style.display = "block";
    setTimeout(() => {
      messageBox.style.display = "none";
    }, 3000); // Повідомлення зникне через 3 секунди
  }
