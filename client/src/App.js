import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import { UserProvider } from './UserContext';
import Register from './components/Register';
import Login from './components/Login';
import HomePage from './components/HomePage';
import CartPage from './components/CartPage';
import Navbar from './components/Navbar';
import SellerPage from './components/SellerPage';
import AddProductPage from './components/AddProductPage';

const App = () => {
  const [products, setProducts] = useState([]); // Ürünleri tutmak için state
  const [cart, setCart] = useState(() => {
    const storedCart = JSON.parse(localStorage.getItem('cart'));
    return storedCart ? storedCart : [];
  });

  const [user, setUser] = useState(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    return storedUser || null;
  });

  const navigate = useNavigate();

  // Backend'den ürünleri çek
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/products');
        setProducts(response.data);
      } catch (error) {
        console.error('Ürünler yüklenemedi:', error);
      }
    };

    loadProducts();
  }, []);

  // Kullanıcı giriş yaparsa yönlendirme işlemleri
  useEffect(() => {
    if (user?.user_type === 'seller') {
      navigate('/seller');
    }
  }, [user, navigate]);



  // Sepeti localStorage'a kaydet
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product) => {
    setCart((prevCart) => {
      const existingProductIndex = prevCart.findIndex((item) => item.id === product.id);

      if (existingProductIndex !== -1) {
        const updatedCart = [...prevCart];
        updatedCart[existingProductIndex].quantity += 1;
        return updatedCart;
      }

      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const onProductAdded = async () => {
    const response = await axios.get('http://localhost:5001/api/add-product');
    setProducts(response.data);
  };
  

  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
    navigate('./components/HomePage');
  };

  return (
    <UserProvider value={{ user, setUser, logout }}>
      
        <Navbar cartCount={cart.length} />
        <main>
          <Routes>
            <Route path="/" element={<HomePage products={products} addToCart={addToCart} />} />
            <Route path="/cart" element={<CartPage cart={cart} removeFromCart={removeFromCart} />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/seller" element={<SellerPage />} />
            <Route path="/add-product" element={<AddProductPage />} />
            <Route path="/add-product" element={<AddProductPage onProductAdded={onProductAdded} />} />

          </Routes>
        </main>
      
    </UserProvider>
  );
};

export default App;
