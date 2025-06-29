import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { UserContext } from '../UserContext';
import './Navbar.css';

const Navbar = ({ cartCount }) => {
  const { user, logout } = useContext(UserContext);

  return (
    <nav>
      <ul className="nav-container">
        <li>
        
          <Link to="/" className="nav-link">Anasayfa</Link>
        
        </li>
        {user && user.user_type === 'customer' && (
          <>
            <li>
              <Link to="/cart" className="nav-link">Sepetim ({cartCount} Ürün)</Link>
            </li>
          </>
        )}
        {user && user.user_type === 'seller' && (
          <p className="seller-message">Seller yetkisiyle giriş yapıldı.</p>
        )}
        {user ? (
          <>
            <li className="welcome-msg">Hoşgeldiniz, {user.name || 'Kullanıcı'}!</li>
            <li>
              <Link to="/login" className="logout-btn" onClick={logout}>Çıkış Yap</Link>
            </li>
          </>
        ) : (
          <>
            <li>
              <Link to="/login" className="nav-link">Giriş Yap</Link>
            </li>
            <li>
              <Link to="/register" className="nav-link">Üye Ol</Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;
