document.addEventListener('DOMContentLoaded', function () {
  const loginForm = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const togglePassword = document.getElementById('togglePassword');
  const errorMessagesDiv = document.getElementById('errorMessages');
  const submitBtn = loginForm.querySelector('button[type="submit"]');
  const loadingOverlay = document.getElementById('loadingOverlay');
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const rememberedEmail = localStorage.getItem('rememberedEmail');
  if (rememberedEmail) {
    emailInput.value = rememberedEmail;
    passwordInput.focus();
  }

  // Mostrar y ocultar contraseña con animación
  togglePassword.addEventListener('click', function () {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    const icon = this.querySelector('i');

    // Animación del icono
    this.classList.toggle('active');
    icon.classList.toggle('fa-eye');
    icon.classList.toggle('fa-eye-slash');

    // Efecto de rebote
    icon.style.transform = 'scale(1.3)';
    setTimeout(() => {
      icon.style.transform = 'scale(1)';
    }, 200);
  });

  loginForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    clearErrors();

    const email = emailInput.value.trim();
    const password = passwordInput.value;
    if (!validateForm(email, password)) return;

    try {
      setLoadingState(true);

      // Autenticar usuario
      const userData = await ApiController.login(email, password);

      // Guardar sesión 
      saveUserSession({
        email: email,
        name: userData.nombre,
        role: userData.rol,
        avatar: userData.avatarUrl,
        token: userData.token
      });

      showTemporaryMessage('¡Bienvenido! Ingresando...', 'success');
      setTimeout(() => window.location.href = 'pagina.html', 1000);

    } catch (error) {
      handleLoginError(error);
    } finally {
      setLoadingState(false);
    }
  });

  function validateForm(email, password) {
    let isValid = true;

    if (!email) {
      showError('El correo electrónico es requerido', emailInput);
      isValid = false;
    } else if (!emailRegex.test(email)) {
      showError('Ingrese un correo electrónico válido', emailInput);
      isValid = false;
    }

    if (!password) {
      showError('La contraseña es requerida', passwordInput);
      isValid = false;
    } else if (password.length < 6) {
      showError('La contraseña debe tener al menos 6 caracteres', passwordInput);
      isValid = false;
    }

    return isValid;
  }

  function showError(message, inputElement = null) {
    errorMessagesDiv.innerHTML = `
        <div class="error-message">
          <i class="fas fa-exclamation-circle"></i>
          <span>${message}</span>
        </div>
      `;

    if (inputElement) {
      inputElement.style.borderColor = '#e74c3c';
      inputElement.focus();
    }

    loginForm.classList.add('shake');
    setTimeout(() => loginForm.classList.remove('shake'), 500);
  }

  function showTemporaryMessage(message, type = 'success') {
    errorMessagesDiv.innerHTML = `
        <div class="${type}-message">
          <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i>
          <span>${message}</span>
        </div>
      `;
  }

  function clearErrors() {
    errorMessagesDiv.innerHTML = '';
    emailInput.style.borderColor = '';
    passwordInput.style.borderColor = '';
  }

  function setLoadingState(isLoading) {
    try {
      if (isLoading) {
        console.log("Activando loading overlay");
        loadingOverlay.classList.add('active');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando sesión...';
      } else {
        console.log("Desactivando loading overlay");
        loadingOverlay.classList.remove('active');
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Iniciar Sesión';
      }
    } catch (e) {
      console.error("Error en setLoadingState:", e);
    }
  }

  function handleLoginError(error) {
    let errorMessage = 'Error al iniciar sesión';

    if (error.message.includes('Credenciales')) {
      errorMessage = 'Correo o contraseña incorrectos';
    } else if (error.message.includes('conectar')) {
      errorMessage = 'No se puede conectar al servidor. Verifique su conexión.';
    } else {
      errorMessage = error.message;
    }

    showError(errorMessage);
    passwordInput.focus();
  }

  function saveUserSession(user) {
    sessionStorage.setItem('auth', 'true');
    sessionStorage.setItem('userEmail', user.email);
    sessionStorage.setItem('userName', user.nombre);
    sessionStorage.setItem('userRole', user.rol);
    sessionStorage.setItem('authToken', user.token);
    localStorage.setItem('rememberedEmail', user.email);

    ApiController.setAuthToken(user.token);
  }
});