<script>
import Header from "./Header.vue";

export default {
  name: "Registration",
  components: {
    Header,
  },
  methods: {
    goToLogin() {
      this.$router.push("/login");
    },
  },
};
</script>

<template>
  <div class="registration-page">
    <Header />

    <div class="form-container">
      <h2>Регистрация</h2>

      <form>
        <div class="input-group">
          <label for="username">Имя пользователя</label>
          <input
            type="text"
            id="username"
            placeholder="Введите имя пользователя"
          />
        </div>

        <div class="input-group">
          <label for="email">Email</label>
          <input type="email" id="email" placeholder="Введите email" />
        </div>

        <div class="input-group">
          <label for="password">Пароль</label>
          <input type="password" id="password" placeholder="Введите пароль" />
        </div>

        <div class="input-group">
          <label for="confirm-password">Подтвердите пароль</label>
          <input
            type="password"
            id="confirm-password"
            placeholder="Подтвердите пароль"
          />
        </div>

        <button type="submit" class="submit-button">Зарегистрироваться</button>
      </form>

      <p class="login-link">
        Уже есть аккаунт? <a @click.prevent="goToLogin">Вход</a>
      </p>
    </div>
  </div>
</template>

<style>
.registration-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #f0f4f7;
  font-family: "Arial", sans-serif;
}

.form-container {
  background-color: white;
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  width: 400px;
  max-width: 100%;
  text-align: center;
}

.form-container h2 {
  margin-bottom: 24px;
  color: #333;
  font-size: 24px;
}

.input-group {
  margin-bottom: 20px;
  text-align: left;
}

.input-group label {
  display: block;
  font-size: 14px;
  color: #555;
  margin-bottom: 6px;
}

.input-group input {
  width: 100%;
  padding: 10px;
  font-size: 16px;
  border-radius: 4px;
  border: 1px solid #ddd;
  background-color: #fafafa;
}

.input-group input:focus {
  outline: none;
  border-color: #76a34f;
  background-color: white;
}

.submit-button {
  width: 100%;
  padding: 12px;
  font-size: 16px;
  color: white;
  background-color: #76a34f;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.submit-button:hover {
  background-color: #5e883c;
}

.login-link {
  margin-top: 16px;
  font-size: 14px;
  color: #555;
}

.login-link a {
  color: #76a34f;
  text-decoration: none;
}

.login-link a:hover {
  text-decoration: underline;
}

a {
  cursor: pointer;
}
</style>
