import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../UserContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(''); // Telefon numarası için state
  const [message, setMessage] = useState('');
  const { setUser } = useContext(UserContext);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch('http://localhost:5001/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        console.log('Sunucudan gelen kullanıcı bilgileri:', data.user);

        // Kullanıcı giriş yaptıktan sonra phoneNumber'ı kaydet
        const userWithPhone = {
          ...data.user,
          phoneNumber, 
        };

        localStorage.setItem('user', JSON.stringify(data.user));

        setUser(data.user); // Kullanıcıyı UserContext'e aktar
        setMessage('Giriş başarılı! Yönlendiriliyorsunuz...');
        
        // Kullanıcı türüne göre yönlendirme yap
        if (data.user.user_type === 'seller') {
          setMessage('Seller giriş yaptı! Seller sayfasına yönlendiriliyorsunuz...');
          setTimeout(() => navigate('/seller'), 1000);
        } else {
          setTimeout(() => navigate('/'), 1000);
        }
      } else {
        setMessage('Hata: ' + data.message);
      }
    } catch (error) {
      console.error('Giriş sırasında bir hata oluştu:', error);
      setMessage('Sunucu hatası! Lütfen tekrar deneyin.');
    }
  };

  return (
    <div>
      <h2>Giriş Yap</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <input
            type="email"
            placeholder="E-posta"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Şifre"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        
        <div>
          <button type="submit">Giriş Yap</button>
        </div>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default Login;
