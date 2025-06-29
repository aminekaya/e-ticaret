import React, { useState } from 'react';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [userType, setUserType] = useState('customer');
  const [message, setMessage] = useState('');
  const [messageColor, setMessageColor] = useState('black');

  const handleSubmit = async (event) => {
    event.preventDefault(); // Formun default davranışını engeller

    const formData = { name, email, password, phone, user_type: userType };

    try {
      const response = await fetch('http://localhost:5001/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json(); // Yanıtı JSON formatında alıyoruz

      console.log('Backend Yanıtı:', data); // Yanıtı kontrol et

      if (data.success) {
        setMessage('Kayıt başarılı! Lütfen giriş yapın.');
        setMessageColor('green');
      } else {
        setMessage('Bir hata oluştu: ' + data.message);
        setMessageColor('red');
      }
    } catch (error) {
      setMessage('Bir hata oluştu: ' + error.message);
      setMessageColor('red');
    }
  };

  return (
    <div>
      <header>
        <h1>MİNESSA BAGS</h1>
      </header>
      <main>
        <h2>Üye Ol</h2>
        <form id="register-form" onSubmit={handleSubmit} noValidate>
          <input
            type="text"
            name="name"
            placeholder="Ad ve Soyad"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="E-posta"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Şifre"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            type="text"
            name="phone"
            placeholder="Telefon Numarası"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <label htmlFor="user-type">Üye Tipi:</label>
          <select
            name="user_type"
            value={userType}
            onChange={(e) => setUserType(e.target.value)}
            required
          >
            <option value="customer">Müşteri</option>
            <option value="seller">Satıcı</option>
          </select>
          <button type="submit">Üye Ol</button>
        </form>
        <p id="response-message" style={{ color: messageColor }}>
          {message}
        </p>
      </main>
    </div>
  );
};

export default Register;
