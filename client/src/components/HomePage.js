import React, { useState, useEffect, useContext } from 'react';
import './HomePage.css';
import { UserContext } from '../UserContext.js';
import axios from 'axios';

const HomePage = () => {
  const { user } = useContext(UserContext);
  const [products, setProducts] = useState([]); // Ürünleri tutmak için
  const [showNotification, setShowNotification] = useState(false);


  // Bildirim durumunu kontrol et
  useEffect(() => {
    if (user) {
      const notificationHidden = localStorage.getItem('hideNotification');
      if (!notificationHidden) {
        checkCompletedOrder(); // Tamamlanmış siparişi kontrol et
      }
    }
  }, [user]);

  // Kullanıcının tamamlanmış siparişini kontrol et
  const checkCompletedOrder = async () => {
    try {
      const response = await axios.get(`http://localhost:5001/user-completed-orders/${user.id}`);
      if (response.data.completedOrder) {
        setShowNotification(true); // Eğer tamamlanmış sipariş varsa, bildirimi göster
      }
    } catch (error) {
      console.error('Tamamlanmış sipariş kontrol edilirken hata:', error);
    }
  };

  // Bildirimi gizle
  const handleHideNotification = () => {
    setShowNotification(false);
    localStorage.setItem('hideNotification', 'true'); // Bildirimi tekrar gösterme
  };
  

  // Sunucudan ürünleri çek
  const fetchProducts = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Ürünler çekilirken hata:', error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Sepete ürün ekleme işlemleri
  const addToCart = (product) => {
    let currentCart = JSON.parse(localStorage.getItem('cart')) || [];
    currentCart.push(product);
    localStorage.setItem('cart', JSON.stringify(currentCart));
    alert(`${product.name} sepete eklendi!`);
  };


  return (
    <div className="home-page">
      <header>
        <h1>MINESSA BAG</h1>
        <h2>Ürünler</h2>
      </header>
      {/* Bildirim Alanı */}
      {showNotification && (
        <div style={{ backgroundColor: 'orange', padding: '10px', marginBottom: '20px' }}>
          <p>1 siparişiniz tamamlandı</p>
          <a href="#" onClick={handleHideNotification}>
            Bu bildirimi gösterme
          </a>
        </div>
      )}

      {/* Ürün Listesi */}
      <section className="product-list">
        {products.length > 0 ? (
          products.map((product) => (
            <div key={product.id} className="product-card">
              <img
                src={`http://localhost:5001${product.image_url}`}
                alt={product.name}
                className="product-image"
              />
              <h3>{product.name}</h3>
              <p>₺{product.price}</p>
              <button onClick={() => {
                  if (!user) {
                    alert('Sepete ürün eklemek için giriş yapmalısınız!');
                  } else {
                    addToCart(product);
                  }
                }}
              >
                
                Sepete Ekle
              </button>
            </div>
          ))
        ) : (
          <p>Ürünler yükleniyor...</p>
        )}
      </section>
    </div>
  );
};


export default HomePage;
