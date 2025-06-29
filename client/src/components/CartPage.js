import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CartPage.css';

const CartPage = () => {
  const [cart, setCart] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const navigate = useNavigate();

  // Sepet verisini localStorage'dan al
  const getCart = () => {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    return cart.map(item => ({ ...item, quantity: item.quantity || 1 })); // Varsayılan quantity değeri
  };

  // Sepete ürün ekle veya miktarını güncelle
  const addOrUpdateCart = (product) => {
    const cart = getCart();
    const existingIndex = cart.findIndex(item => item.id === product.id);

    if (existingIndex > -1) {
      cart[existingIndex].quantity += product.quantity; // Mevcut ürünün miktarını artır
    } else {
      cart.push(product); // Yeni ürün ekle
    }

    saveCart(cart);
  };

  // Sepet verisini localStorage'a kaydet
  const saveCart = (cart) => {
    localStorage.setItem('cart', JSON.stringify(cart));
    displayCart(); // Kaydettikten sonra görüntüyü yenile
  };

  // Sepet içeriğini güncelle
  const displayCart = () => {
    const cartItems = getCart();
    setCart(cartItems);
    const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    setTotalPrice(total);
  };

  useEffect(() => {
    displayCart(); // Sayfa yüklendiğinde sepeti görüntüle
  }, []);

  const increaseQuantity = (index) => {
    const updatedCart = [...cart];
    updatedCart[index].quantity += 1;
    saveCart(updatedCart);
  };

  const decreaseQuantity = (index) => {
    const updatedCart = [...cart];
    if (updatedCart[index].quantity > 1) {
      updatedCart[index].quantity -= 1;
    } else {
      const confirmRemove = window.confirm(
        `${updatedCart[index].name} ürününü sepetten çıkarmak istiyor musunuz?`
      );
      if (confirmRemove) {
        updatedCart.splice(index, 1); // Ürünü sepetten çıkar
      }
    }
    saveCart(updatedCart);
  };

  const clearCart = () => {
    localStorage.removeItem('cart');
    displayCart(); // Boş sepeti göster
  };

  const handleCheckout = () => {
    // Kullanıcı giriş durumunu kontrol et
    const loggedInUser = JSON.parse(localStorage.getItem('user'));
    if (!loggedInUser || !loggedInUser.phone) {
      alert('Sipariş tamamlamak için giriş yapmalısınız!');
      navigate('/login'); // Giriş sayfasına yönlendir
      return;
    }

    const customerPhone = loggedInUser.phone;

    // Yeni gönderilen ürünlerin `product_id` olarak backend'deki mantığa uygun şekilde
  const itemsToSend = cart.map(item => ({
    image_url: item.image_url, // Backend'te bu üzerinden ID çekilecek.
    quantity: item.quantity,
  }));

    if (cart.length === 0) {
      alert('Sepetiniz boş! Sipariş oluşturmak için ürün ekleyin.');
      return;
    }

    // Siparişi backend'e gönder
    fetch('http://localhost:5001/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerPhone: loggedInUser.phone,
        items: itemsToSend,
        
       
      }),
    })
    
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          alert('Siparişiniz başarıyla tamamlandı!');
          localStorage.removeItem('cart');
          navigate('/'); // Ana sayfaya yönlendir
        } else {
          alert('Bir hata oluştu: ' + data.message);
        }
      })
      .catch((error) => {
        alert('Bir hata oluştu: ' + error.message);
      });
  };


  return (
    <div>
      <header>
        <h1>Sepetim</h1>
      </header>
      <main id="cart-container">
        <h2>Sepetinizdeki Ürünler</h2>
        {cart.length === 0 ? (
          <p>
            Sepetiniz boş. <a href="/">Alışverişe Başla</a>
          </p>
        ) : (
          <ul>
            {cart.map((item, index) => (
              <li key={index}>
                <img
                  src={`http://localhost:5001${item.image_url}`}
                  alt={item.name}
                  width="100"
                  style={{ objectFit: 'cover', marginRight: '10px' }}
                />
                <span>{item.name}</span> - <span>₺{item.price}</span>
                <div>
                  <button onClick={() => decreaseQuantity(index)}>-</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => increaseQuantity(index)}>+</button>
                </div>
                <span>Toplam: ₺{item.price * item.quantity}</span>
              </li>
            ))}
          </ul>
        )}
        <p id="total-price">Toplam: ₺{totalPrice}</p>
        {cart.length > 0 && <button onClick={clearCart}>Sepeti Boşalt</button>}
      </main>
      <footer>
        <button id="checkout" onClick={handleCheckout}>
          Siparişi Tamamla
        </button>
      </footer>
    </div>
  );
};

export default CartPage;
